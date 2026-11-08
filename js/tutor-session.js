/* Беседа для одного экрана и аккаунта. Без DOM и без хранения API-ключа. */
window.TutorSession = (function () {
  "use strict";
  var PROMPTS = {
    explain: "Объясни проще текущий материал на экране: смысл, правило или употребление. Дай короткий пример с переводом.",
    parts: "Разбери на части текущее немецкое слово. Назови слово, покажи его состав, поясни значение каждой реальной части " +
      "и как из них получается общий смысл. Дай одну короткую мнемонику и один бытовой пример с русским переводом. " +
      "Если на экране нет одного главного слова, попроси меня выбрать слово."
  };
  function create(options) {
    var gateway = options.gateway, changed = options.onChange || function () {};
    var later = options.setTimeout || function (fn, ms) { return setTimeout(fn, ms); };
    var cancel = options.clearTimeout || function (timer) { clearTimeout(timer); };
    var controller = options.controller || function () { return new AbortController(); };
    var user = null, id = "", provider = function () { return { type: "page", title: "Курс немецкого A2 → B1" }; }, onUse = null;
    var messages = [], draft = "", status = "", keyStatus = "", configured = null, active = false;
    var request = null, settings = null;
    function state() {
      return { user: user, messages: messages.slice(), draft: draft, status: status, keyStatus: keyStatus,
        configured: configured, pending: !!request, settingsPending: !!settings };
    }
    function emit() { changed(state()); }
    function context() {
      try { return provider() || { type: "page", title: "Курс немецкого" }; }
      catch (e) { return { type: "page", title: "Курс немецкого", note: "Контекст недоступен. Уточни вопрос у ученика." }; }
    }
    function stop(message) {
      if (request) {
        var old = request; request = null; cancel(old.timer); old.controller.abort();
        messages = old.history; draft = old.draft;
      }
      status = message || ""; emit();
    }
    function cancelSettings() {
      if (!settings) return;
      var old = settings; settings = null; cancel(old.timer); old.controller.abort();
    }
    function setContext(next, getData, whenUsed) {
      provider = getData; onUse = whenUsed || null;
      if (next === id) return;
      stop(); id = next; messages = []; draft = ""; status = ""; emit();
    }
    function setAccount(next) {
      var nextId = next ? next.uid : "", oldId = user ? user.uid : "";
      user = next ? { uid: next.uid, email: next.email || "" } : null;
      if (nextId !== oldId) {
        stop(); cancelSettings(); configured = null; keyStatus = ""; messages = []; draft = "";
        emit(); if (active && user) refresh();
      } else emit();
    }
    function ask(question, display) {
      question = String(question || "").trim();
      if (request || !question) return false;
      if (!user) { status = "Войдите через Google, чтобы пользоваться чатом."; emit(); return false; }
      if (onUse) onUse();
      var data = context(), call = { controller: controller(), timer: null, history: messages.slice(), draft: draft };
      request = call;
      messages = messages.concat([{ role: "user", content: question, display: display || question }]);
      draft = ""; status = "Готовлю объяснение…"; emit();
      function fail(error, timedOut) {
        if (request !== call) return;
        request = null; cancel(call.timer); messages = call.history; draft = call.draft;
        status = timedOut ? "Ответ занял слишком много времени. Повторите запрос." : error.name === "AbortError"
          ? "Запрос остановлен." : error.name === "TypeError" ? "Нет связи с сервером. Проверьте интернет и повторите запрос." : error.message;
        emit();
      }
      call.timer = later(function () { call.controller.abort(); fail({}, true); }, 80000);
      Promise.resolve().then(function () {
        if (request !== call) return null;
        return gateway.request(data, call.history, question, call.controller.signal);
      }).then(function (text) {
        if (request !== call) return;
        request = null; cancel(call.timer); messages = messages.concat([{ role: "assistant", content: text }]); status = ""; emit();
      }, function (error) { fail(error); });
      return true;
    }
    function preset(kind, label) {
      var fragment = draft.trim();
      return ask(PROMPTS[kind] + (fragment ? "\nУченик уточнил слово, фрагмент или вопрос: " + fragment : ""), label + (fragment ? ": " + fragment : ""));
    }
    function keyCall(action, key) {
      cancelSettings();
      var call = { controller: controller(), timer: null }; settings = call;
      keyStatus = action === "save" ? "Сохраняю ключ в Firebase…" : "Проверяю сохранённый ключ…"; emit();
      function fail(error) {
        if (settings !== call) return;
        settings = null; cancel(call.timer); if (configured === null) configured = false;
        keyStatus = error.name === "AbortError" ? "Не удалось дождаться сервера. Откройте настройки, чтобы проверить сохранение." :
          error.name === "TypeError" ? "Не удалось связаться с сервером чата Firebase. Проверьте интернет и настройку сервера." : error.message;
        emit();
      }
      call.timer = later(function () { call.controller.abort(); fail({ name: "AbortError" }); }, 60000);
      // Ключ передаётся сразу адаптеру; не остаётся в состоянии или замыкании запроса.
      var promise;
      try { promise = gateway.settings(action, key, call.controller.signal); }
      catch (error) { fail(error); return; }
      key = "";
      Promise.resolve(promise).then(function (result) {
        if (settings !== call) return;
        settings = null; cancel(call.timer); configured = result.configured;
        keyStatus = configured ? "Ключ сохранён в Firebase." : "Ключ ещё не сохранён."; emit();
      }, fail);
    }
    function refresh() { if (user && !settings) keyCall("status"); }
    function saveKey(key) {
      if (!user) { keyStatus = "Сначала войдите через Google."; emit(); return false; }
      if (settings) return false;
      key = String(key || "").trim();
      if (!/^sk-[\w-]{10,500}$/.test(key)) { keyStatus = "Проверьте ключ: он должен начинаться с sk-."; emit(); return false; }
      keyCall("save", key); return true;
    }
    function open() { active = true; refresh(); }
    function close() { active = false; cancelSettings(); emit(); }
    return { state: state, setContext: setContext, setAccount: setAccount,
      setDraft: function (value) { draft = String(value || ""); }, ask: ask, preset: preset, stop: stop,
      open: open, close: close, refresh: refresh, saveKey: saveKey };
  }
  return { create: create, prompts: PROMPTS };
})();
