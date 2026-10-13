/* Чат живёт в памяти сессии; выбранные подсказки - в журнале прогресса. */
window.mountWordChat = function (word, state, onClose, wordKey) {
  "use strict";
  var request = null, pendingQuestion = "", closed = false, detach, viewport = window.visualViewport;
  function node(tag, text, cls) {
    var n = document.createElement(tag); n.textContent = text || ""; n.className = cls || ""; return n;
  }
  var dialog = node("dialog", "", "word-chat");
  dialog.setAttribute("aria-label", "Чат о слове " + word.de);
  var header = node("header", "", "word-chat-header");
  var title = node("div", "", "word-chat-title");
  title.appendChild(node("strong", word.de)); title.appendChild(node("div", word.ru, "muted"));
  var close = node("button", "", "word-chat-close"); close.type = "button";
  close.setAttribute("aria-label", "К карточке");
  close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  header.appendChild(title); header.appendChild(close); dialog.appendChild(header);
  var log = node("div", "", "word-chat-log"); dialog.appendChild(log);
  var form = node("form", "", "word-chat-form");
  var hint = node("button", "Дай хинт к слову", "word-chat-suggestion"); hint.type = "button"; form.appendChild(hint);
  var composer = node("div", "", "word-chat-composer");
  var input = node("textarea", "", "word-chat-input"); input.id = "word-question"; input.rows = 1;
  input.setAttribute("aria-label", "Свой вопрос"); input.maxLength = 6000;
  input.placeholder = "Спроси о слове"; input.value = state.draft || ""; composer.appendChild(input);
  var send = node("button", "", "word-chat-send"); send.type = "submit"; send.setAttribute("aria-label", "Отправить");
  send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
  composer.appendChild(send); form.appendChild(composer);
  var status = node("div", "", "word-chat-status"); status.setAttribute("role", "status"); form.appendChild(status);
  var settings = node("a", "Настроить OpenAI", "word-chat-settings"); settings.href = "#/more/openai"; settings.hidden = true;
  form.appendChild(settings); dialog.appendChild(form);
  function fitInput() {
    input.style.height = "auto";
    input.style.height = Math.min(120, Math.max(48, input.scrollHeight)) + "px";
    send.disabled = !!request || !input.value.trim();
  }
  function savedHint() { return (window.Store.state().wordHints || {})[wordKey] || ""; }
  function save(text) {
    try {
      window.Store.mutate("wordHint", { key: wordKey, text: text });
      status.textContent = window.Store.storageError() || (text ? "Подсказка прикреплена к слову." : "Подсказка удалена.");
      render();
    } catch (e) { status.textContent = e.message; }
  }
  function render() {
    log.textContent = "";
    var pinned = savedHint();
    if (pinned && !state.messages.some(function (message) { return message.role === "assistant" && message.content === pinned; })) {
      var box = node("section", "", "word-chat-pinned");
      box.appendChild(node("strong", "Прикреплено к слову")); box.appendChild(node("p", pinned, "word-chat-text"));
      var remove = node("button", "Открепить", "word-chat-pin"); remove.type = "button"; remove.onclick = function () { save(""); }; box.appendChild(remove); log.appendChild(box);
    }
    state.messages.forEach(function (message) {
      var item = node("section", "", "word-chat-message " + message.role);
      item.appendChild(node("p", message.content, "word-chat-text"));
      if (message.role === "assistant") {
        var pin = node("button", pinned === message.content ? "Прикреплено" : pinned ? "Заменить подсказку" : "Прикрепить к слову", "word-chat-pin");
        pin.type = "button"; pin.disabled = pinned === message.content;
        pin.onclick = function () { save(message.content); }; item.appendChild(pin);
      }
      log.appendChild(item);
    });
    if (pendingQuestion) {
      var pending = node("section", "", "word-chat-message user");
      pending.appendChild(node("p", pendingQuestion, "word-chat-text")); log.appendChild(pending);
    }
    hint.hidden = !!pinned || !!state.messages.length || !!pendingQuestion;
  }
  function setBusy(value) { hint.disabled = value; input.readOnly = value; fitInput(); }
  function submit(question) {
    if (request || !question.trim()) return;
    try { request = window.GermanAI.ask(question, { word: word, messages: state.messages }); }
    catch (e) { status.textContent = e.message; settings.hidden = false; return; }
    pendingQuestion = question; state.draft = question; input.value = ""; settings.hidden = true;
    setBusy(true); render(); status.textContent = "Думаю…"; log.scrollTop = log.scrollHeight;
    request.promise.then(function (answer) {
      if (closed) return;
      state.messages.push({ role: "user", content: question }, { role: "assistant", content: answer });
      pendingQuestion = ""; state.draft = ""; input.value = ""; status.textContent = ""; request = null; setBusy(false); render(); log.scrollTop = log.scrollHeight;
    }, function (e) { if (!closed) { request = null; pendingQuestion = ""; input.value = state.draft; setBusy(false); render(); status.textContent = e.message; settings.hidden = false; } });
  }
  input.oninput = function () { state.draft = input.value; fitInput(); };
  hint.onclick = function () { submit("Дай хинт к слову"); };
  form.onsubmit = function (event) { event.preventDefault(); submit(input.value.trim()); };
  function resize() {
    dialog.style.top = ((viewport ? viewport.offsetTop : 0) + 12) + "px";
    dialog.style.height = Math.max(0, (viewport ? viewport.height : window.innerHeight) - 12) + "px";
    fitInput();
  }
  var previousOverflow = document.body.style.overflow;
  function dispose() {
    if (closed) return; closed = true; state.draft = pendingQuestion || input.value;
    if (request) request.cancel(); if (detach) detach();
    if (viewport) { viewport.removeEventListener("resize", resize); viewport.removeEventListener("scroll", resize); }
    window.removeEventListener("resize", resize); document.body.style.overflow = previousOverflow;
    dialog.close(); dialog.remove();
  }
  function back() { dispose(); onClose(); }
  close.onclick = back;
  dialog.addEventListener("cancel", function (event) { event.preventDefault(); back(); });
  document.body.appendChild(dialog); render(); dialog.showModal(); resize(); document.body.style.overflow = "hidden";
  close.focus();
  detach = window.SwipeBack.mount(dialog, back, log);
  if (viewport) { viewport.addEventListener("resize", resize); viewport.addEventListener("scroll", resize); }
  window.addEventListener("resize", resize);
  return dispose;
};
