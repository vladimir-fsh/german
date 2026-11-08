/* Личный чат: ключ из Firebase, запросы OpenAI из браузера, беседа в памяти. */
window.Tutor = (function () {
  "use strict";
  try { localStorage.removeItem("de-tutor-model-v1"); } catch (e) {}
  var root, panel, chatTab, log, input, send, status, settings, connectionText, quick, footer;
  var setupKey, explainButton, partsButton, keyField, keyForm, keyStatus, saveKey, cloudButton;
  var opened = false, settingsOpen = false, previousFocus, releaseSwipe, accountId = "";
  var session = window.TutorSession.create({ gateway: window.TutorGateway, onChange: renderState });
  var state = session.state();
  function node(tag, cls, value) {
    var e = document.createElement(tag); if (cls) e.className = cls;
    if (value != null) e.textContent = value;
    return e;
  }
  function button(parent, cls, label, action) {
    var b = node("button", cls, label); b.type = "button"; b.onclick = action; parent.appendChild(b); return b;
  }
  function renderState(next) {
    state = next;
    if (!input) return;
    var uid = state.user ? state.user.uid : "", accountChanged = uid !== accountId;
    if (accountChanged) { accountId = uid; keyField.value = ""; }
    input.value = state.draft; growInput(); renderLog(); setSending(state.pending);
    status.textContent = state.status; keyStatus.textContent = state.keyStatus;
    keyField.placeholder = state.configured ? "Новый ключ для замены" : "sk-…";
    syncSetup(); updateConnection();
    if (state.configured && settingsOpen) { showSettings(false); input.focus({ preventScroll: true }); }
    else if (accountChanged && !state.user && opened) showSettings(true);
  }
  function setContext(id, getData, whenUsed) { session.setContext(id, getData, whenUsed); }
  function setSending(active) {
    send.textContent = active ? "■" : "↑";
    send.setAttribute("aria-label", active ? "Остановить запрос" : "Отправить вопрос");
  }
  function growInput() {
    input.style.height = "auto";
    input.style.height = Math.min(112, Math.max(48, input.scrollHeight || 48)) + "px";
  }
  function renderLog() {
    log.textContent = "";
    log.hidden = settingsOpen || !state.messages.length;
    state.messages.forEach(function (m) {
      var item = node("div", "tutor-message " + m.role);
      item.appendChild(node("b", "tutor-speaker", m.role === "user" ? "Вы" : "Объяснение"));
      item.appendChild(node("div", "", m.display || m.content)); log.appendChild(item);
      if (m.role === "assistant" && m.wordKey && window.WordExplanations) {
        var saved = window.WordExplanations.contains(m.wordKey, m.content);
        var save = button(item, "btn sec tutor-save", saved ? "Сохранено" : "Сохранить объяснение", function () {
          try { window.WordExplanations.save(m.wordKey, m.content); renderLog(); }
          catch (error) { saveStatus.textContent = "Не удалось сохранить объяснение. Проверьте сохранение прогресса."; }
        });
        save.disabled = saved || !window.Store.ready();
        var saveStatus = node("div", "tutor-save-status"); saveStatus.setAttribute("role", "status"); item.appendChild(saveStatus);
      }
    });
    log.scrollTop = log.scrollHeight;
  }
  function ask(question) {
    session.setDraft(input.value);
    if (session.ask(question)) input.blur();
    else if (!state.user) showSettings(true);
  }
  function preset(kind, label) {
    session.setDraft(input.value);
    if (session.preset(kind, label)) input.blur();
    else if (!state.user) showSettings(true);
  }
  function showSettings(show) {
    if (show && state.configured === true) show = false;
    settingsOpen = show; settings.hidden = !show;
    footer.hidden = show;
    log.hidden = show || !state.messages.length;
    syncSetup();
    if (show) { panel.classList.add("is-settings"); input.blur(); if (opened) panel.focus({ preventScroll: true }); }
    else panel.classList.remove("is-settings");
    if (show) { updateConnection(); session.refresh(); }
  }
  function syncSetup() {
    setupKey.hidden = state.configured === true || (state.configured === null && !!state.user);
    explainButton.hidden = state.configured !== true || state.suggestionsUsed;
    partsButton.hidden = state.configured !== true || state.suggestionsUsed;
    quick.hidden = settingsOpen || (setupKey.hidden && explainButton.hidden && partsButton.hidden);
  }
  function updateConnection() {
    if (!connectionText) return;
    var user = state.user;
    connectionText.textContent = user ? "Аккаунт: " + (user.email || user.uid) : "Войдите через Google в разделе «Облако и вход».";
    keyField.disabled = !user; saveKey.disabled = !user || state.settingsPending;
    cloudButton.hidden = !!user;
  }
  function fit() {
    if (!opened) return;
    var vv = window.visualViewport;
    var layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);
    var keyboardOpen = vv && (!vv.scale || Math.abs(vv.scale - 1) < .01) && layoutHeight - vv.height > 120;
    // VisualViewport уже исключает клавиатуру. Отступ под домашний индикатор нужен только без неё.
    if (keyboardOpen) root.classList.add("keyboard-open");
    else root.classList.remove("keyboard-open");
    root.style.top = (vv ? vv.offsetTop : 0) + "px";
    root.style.height = (vv ? vv.height : window.innerHeight) + "px";
  }
  function open(configure) {
    init();
    if (!opened) {
      previousFocus = document.activeElement; opened = true; root.hidden = false;
      document.documentElement.classList.add("tutor-open");
      document.getElementById("app").inert = true; document.getElementById("tabbar").inert = true;
      chatTab.classList.add("on"); chatTab.setAttribute("aria-expanded", "true"); input.value = state.draft;
      renderLog(); fit();
      if (window.SwipeBack) releaseSwipe = window.SwipeBack.mount(panel, close, log);
    }
    showSettings(!!configure);
    syncSetup();
    session.open();
    if (settingsOpen) panel.focus({ preventScroll: true });
    else { growInput(); input.focus({ preventScroll: true }); }
  }
  function close() {
    if (!opened) return;
    session.setDraft(input.value); opened = false; root.hidden = true;
    chatTab.classList.remove("on"); chatTab.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("tutor-open");
    document.getElementById("app").inert = false; document.getElementById("tabbar").inert = false;
    input.blur();
    session.close(); keyField.value = "";
    if (releaseSwipe) { releaseSwipe(); releaseSwipe = null; }
    if (previousFocus && document.documentElement.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
  }
  function init() {
    if (root) return;
    chatTab = document.getElementById("tutor-tab");
    chatTab.onclick = function () { open(); };
    root = node("div", "tutor-overlay"); root.hidden = true;
    root.addEventListener("click", function (e) { if (e.target === root) close(); });
    panel = node("section", "tutor-panel"); panel.tabIndex = -1;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Чат об открытом экране");
    log = node("div", "tutor-log"); log.setAttribute("aria-live", "polite"); panel.appendChild(log);
    settings = node("div", "tutor-settings"); settings.hidden = true;
    settings.appendChild(node("h3", "", "Ключ OpenAI"));
    settings.appendChild(node("p", "muted", "Сохраните личный ключ в Firebase один раз. После Google-входа браузер использует его для прямых запросов к OpenAI. Ключ доступен вашей авторизованной сессии и не входит в резервную копию прогресса."));
    connectionText = node("p", "muted"); settings.appendChild(connectionText);
    cloudButton = button(settings, "btn sec", "Облако и вход", function () { close(); location.hash = "/more/cloud"; });
    keyForm = node("form", "tutor-key-form");
    var keyLabel = node("label", "", "Ключ API");
    keyField = node("input"); keyField.type = "password"; keyField.maxLength = 512; keyField.placeholder = "sk-…";
    keyField.autocomplete = "off"; keyField.autocapitalize = "off"; keyField.spellcheck = false;
    keyLabel.appendChild(keyField); keyForm.appendChild(keyLabel);
    saveKey = button(keyForm, "btn", "Сохранить в Firebase", function () {}); saveKey.type = "submit";
    keyStatus = node("p", "tutor-key-status muted"); keyStatus.setAttribute("role", "status"); keyForm.appendChild(keyStatus);
    keyForm.onsubmit = function (e) {
      e.preventDefault();
      var key = keyField.value;
      keyField.value = ""; keyField.blur(); session.saveKey(key); key = "";
    };
    settings.appendChild(keyForm);
    button(settings, "btn sec", "К чату", function () {
      keyField.value = ""; showSettings(false); growInput(); input.focus({ preventScroll: true });
    });
    panel.appendChild(settings);
    footer = node("div", "tutor-footer");
    quick = node("div", "tutor-quick");
    setupKey = button(quick, "btn sec", "Добавить API-ключ", function () {
      showSettings(true);
      if (settingsOpen && !keyField.disabled) keyField.focus({ preventScroll: true });
    });
    explainButton = button(quick, "btn sec", "Объясни проще", function () { preset("explain", "Объясни проще"); });
    partsButton = button(quick, "btn sec", "Разбери на части", function () { preset("parts", "Разбери на части"); });
    footer.appendChild(quick);
    status = node("div", "tutor-status"); status.setAttribute("role", "status"); footer.appendChild(status);
    var form = node("form", "tutor-compose");
    input = node("textarea"); input.rows = 1; input.maxLength = 2000; input.placeholder = "Что объяснить?";
    input.setAttribute("aria-label", "Вопрос об открытом экране"); input.oninput = function () { session.setDraft(input.value); growInput(); };
    form.appendChild(input);
    send = button(form, "btn", "↑", function () {}); send.type = "submit"; setSending(false);
    form.onsubmit = function (e) {
      e.preventDefault();
      if (state.pending) session.stop("Запрос остановлен. Можно спросить снова.");
      else ask(input.value);
    };
    footer.appendChild(form); panel.appendChild(footer); root.appendChild(panel); document.body.appendChild(root);
    panel.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key !== "Tab") return;
      var controls = Array.prototype.filter.call(panel.querySelectorAll("button, input, textarea, summary"), function (x) { return !x.disabled && x.getClientRects().length; });
      var first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (window.Cloud) window.Cloud.onChange(function (cloud) { session.setAccount(cloud.user); });
    if (window.Store) window.Store.onChange(function () { if (opened) renderLog(); });
    window.addEventListener("resize", fit);
    if (window.visualViewport) { window.visualViewport.addEventListener("resize", fit); window.visualViewport.addEventListener("scroll", fit); }
    window.addEventListener("hashchange", close);
  }
  return { init: init, open: open, close: close, setContext: setContext,
    prompts: window.TutorSession.prompts };
})();
