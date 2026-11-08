/* Личный ключ загружается из Firestore только на время прямого запроса OpenAI. */
window.TutorGateway = (function () {
  "use strict";
  var rejected = {};
  function signedIn() { return !!(window.Cloud && window.Cloud.status().user); }
  function error(code, message) { var e = new Error(message); e.code = code; return e; }
  function check(session, signal) {
    if (!session.current() || (signal && signal.aborted)) throw { name: "AbortError" };
  }
  function session() {
    if (!window.Cloud) return Promise.reject(error("UNAUTHENTICATED", "Войдите через Google, чтобы пользоваться чатом."));
    return window.Cloud.tutorSession();
  }
  function account(s) { return s.projectId + ":" + s.uid; }
  function request(context, history, question, signal) {
    var body;
    try { body = window.TutorRequest.payload(context, history, question); }
    catch (e) { return Promise.reject(e); }
    return session().then(function (s) {
      return s.key("read", null, signal).then(function (saved) {
        check(s, signal);
        if (!saved.configured) throw error("API_KEY_REQUIRED", "Добавьте ключ OpenAI, чтобы пользоваться чатом.");
        var headers = { "Content-Type": "application/json", Authorization: "Bearer " + saved.key };
        saved.key = "";
        var pending = window.fetch("https://api.openai.com/v1/responses", {
          method: "POST", headers: headers, body: JSON.stringify(body), signal: signal,
          credentials: "omit", referrerPolicy: "no-referrer"
        });
        return pending.then(function (res) {
          check(s, signal);
          if (res.status === 401) {
            rejected[account(s)] = saved.revision;
            throw error("API_KEY_REJECTED", "OpenAI не принял ключ. Добавьте действующий ключ заново.");
          }
          if (res.status === 403) throw error("FORBIDDEN", "У ключа нет доступа к OpenAI или выбранной модели. Проверьте права ключа.");
          if (res.status === 429) throw error("QUOTA", "Достигнут лимит OpenAI API или закончился баланс. Повторите позже и проверьте баланс API.");
          if (res.status === 404) throw error("MODEL_UNAVAILABLE", "Модель чата недоступна в OpenAI.");
          if (!res.ok) throw error("UNAVAILABLE", "OpenAI сейчас недоступен. Повторите позже.");
          return res.json().then(function (result) { check(s, signal); return window.TutorRequest.text(result); });
        });
      });
    });
  }
  function settings(action, key, signal) {
    return session().then(function (s) {
      return s.key(action, key, signal).then(function (result) {
        check(s, signal);
        if (action === "save") delete rejected[account(s)];
        return { configured: result.configured && (!Object.prototype.hasOwnProperty.call(rejected, account(s)) || rejected[account(s)] !== result.revision) };
      });
    });
  }
  return { signedIn: signedIn, request: request, settings: settings };
})();
