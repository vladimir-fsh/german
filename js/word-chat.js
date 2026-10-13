/* Чат живёт в памяти сессии; выбранные подсказки - в журнале прогресса. */
window.mountWordChat = function (word, state, onClose, wordKey) {
  "use strict";
  var request = null, closed = false, detach, viewport = window.visualViewport;
  function node(tag, text, cls) {
    var n = document.createElement(tag); n.textContent = text || ""; n.className = cls || ""; return n;
  }
  var dialog = node("dialog", "", "word-chat");
  dialog.setAttribute("aria-label", "Чат о слове " + word.de);
  var header = node("header", "", "word-chat-header");
  header.appendChild(node("strong", word.de));
  header.appendChild(node("div", word.ru, "muted"));
  dialog.appendChild(header);
  var log = node("div", "", "word-chat-log"); dialog.appendChild(log);
  var form = node("form", "", "word-chat-form");
  var hint = node("button", "Дай хинт к слову", "btn sec"); hint.type = "button"; form.appendChild(hint);
  var label = node("label", "Свой вопрос"); label.htmlFor = "word-question"; form.appendChild(label);
  var input = node("textarea", "", "ai-input"); input.id = "word-question"; input.rows = 2;
  input.maxLength = 6000; input.placeholder = "Почему слово так устроено?"; input.value = state.draft || ""; form.appendChild(input);
  var status = node("div", "", "note"); status.setAttribute("role", "status"); form.appendChild(status);
  var actions = node("div", "", "btnrow");
  var send = node("button", "Отправить", "btn"); send.type = "submit";
  var close = node("button", "К карточке", "btn sec"); close.type = "button";
  actions.appendChild(send); actions.appendChild(close); form.appendChild(actions); dialog.appendChild(form);
  var settings = node("a", "Настроить OpenAI", "word-chat-settings"); settings.href = "#/more/openai"; form.appendChild(settings);
  form.appendChild(node("div", "В OpenAI отправляются слово и переписка. Прикреплённая подсказка доступна без запроса. История чата - до выхода из тренировки.", "note"));
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
    if (pinned) {
      var box = node("section", "", "word-chat-pinned");
      box.appendChild(node("strong", "Прикреплено к слову")); box.appendChild(node("p", pinned, "word-chat-text"));
      var remove = node("button", "Открепить", "btn sec"); remove.type = "button"; remove.onclick = function () { save(""); }; box.appendChild(remove); log.appendChild(box);
    }
    state.messages.forEach(function (message) {
      var item = node("section", "", "word-chat-message " + message.role);
      item.appendChild(node("div", message.role === "user" ? "Вы" : "Подсказка", "note"));
      item.appendChild(node("p", message.content, "word-chat-text"));
      if (message.role === "assistant") {
        var pin = node("button", pinned === message.content ? "Прикреплено" : pinned ? "Заменить подсказку" : "Прикрепить к слову", "btn sec");
        pin.type = "button"; pin.disabled = pinned === message.content;
        pin.onclick = function () { save(message.content); }; item.appendChild(pin);
      }
      log.appendChild(item);
    });
    if (!pinned && !state.messages.length) log.appendChild(node("p", "Разберите слово на части, найдите ассоциацию или задайте свой вопрос.", "muted"));
  }
  function setBusy(value) { send.disabled = hint.disabled = value; input.readOnly = value; }
  function submit(question) {
    if (request || !question.trim()) return;
    try { request = window.GermanAI.ask(question, { word: word, messages: state.messages }); }
    catch (e) { status.textContent = e.message; return; }
    state.draft = question; input.value = question; setBusy(true); status.textContent = "Думаю…";
    request.promise.then(function (answer) {
      if (closed) return;
      state.messages.push({ role: "user", content: question }, { role: "assistant", content: answer });
      state.draft = ""; input.value = ""; status.textContent = ""; request = null; setBusy(false); render(); log.scrollTop = log.scrollHeight;
    }, function (e) { if (!closed) { request = null; setBusy(false); status.textContent = e.message; } });
  }
  input.oninput = function () { state.draft = input.value; };
  hint.onclick = function () { submit("Дай хинт к слову"); };
  form.onsubmit = function (event) { event.preventDefault(); submit(input.value.trim()); };
  function resize() {
    dialog.style.top = (viewport ? viewport.offsetTop : 0) + "px";
    dialog.style.height = (viewport ? viewport.height : window.innerHeight) + "px";
  }
  var previousOverflow = document.body.style.overflow;
  function dispose() {
    if (closed) return; closed = true; state.draft = input.value;
    if (request) request.cancel(); if (detach) detach();
    if (viewport) { viewport.removeEventListener("resize", resize); viewport.removeEventListener("scroll", resize); }
    window.removeEventListener("resize", resize); document.body.style.overflow = previousOverflow;
    dialog.close(); dialog.remove();
  }
  function back() { dispose(); onClose(); }
  close.onclick = back;
  dialog.addEventListener("cancel", function (event) { event.preventDefault(); back(); });
  document.body.appendChild(dialog); render(); resize(); dialog.showModal(); document.body.style.overflow = "hidden";
  close.focus();
  detach = window.SwipeBack.mount(log, back, log);
  if (viewport) { viewport.addEventListener("resize", resize); viewport.addEventListener("scroll", resize); }
  window.addEventListener("resize", resize);
  return dispose;
};
