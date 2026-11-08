/* Просмотр личных объяснений поверх карточки; текст не интерпретируется как HTML. */
window.WordExplanationView = (function () {
  "use strict";
  function node(tag, cls, text) {
    var element = document.createElement(tag); if (cls) element.className = cls;
    if (text != null) element.textContent = text;
    return element;
  }
  function open(key, word, trigger) {
    var root = node("div", "word-notes-overlay"), panel = node("section", "word-notes-panel");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Сохранённые объяснения: " + word);
    panel.appendChild(node("div", "kicker", "Сохранённые объяснения"));
    panel.appendChild(node("h2", "word-notes-title", word));
    var list = node("div", "word-notes-list"), message = node("div", "muted"); message.setAttribute("role", "status");
    panel.appendChild(list); panel.appendChild(message);
    var back = node("button", "btn word-notes-back", "К карточке"); back.type = "button"; panel.appendChild(back);
    var app = document.getElementById("app"), bar = document.getElementById("tabbar");
    var wasAppInert = app.inert, wasBarInert = bar.inert, closed = false, releaseSwipe = null;
    function render() {
      list.textContent = "";
      if (!window.Store.ready()) { list.appendChild(node("p", "muted", "Не удалось прочитать сохранённые объяснения. Проверьте хранилище в разделе «Ещё».")); return; }
      var entries = window.WordExplanations.list(key);
      if (!entries.length) list.appendChild(node("p", "muted", "Пока нет сохранённых объяснений."));
      entries.forEach(function (entry) {
        var article = node("article", "word-note"), text = node("div", "word-note-text", entry.text);
        article.appendChild(text);
        var remove = node("button", "btn sec word-note-delete", "Удалить"); remove.type = "button";
        remove.onclick = function () {
          try { window.WordExplanations.remove(key, entry.id); back.focus({ preventScroll: true }); }
          catch (error) { message.textContent = "Не удалось удалить объяснение. Проверьте сохранение прогресса."; }
        };
        article.appendChild(remove); list.appendChild(article);
      });
    }
    function close() {
      if (closed) return; closed = true;
      unsubscribe(); if (releaseSwipe) releaseSwipe();
      document.body.removeChild(root); document.documentElement.classList.remove("word-notes-open");
      app.inert = wasAppInert; bar.inert = wasBarInert;
      var focus = trigger && !trigger.hidden && document.documentElement.contains(trigger) ? trigger : document.getElementById("tutor-tab");
      if (focus) focus.focus({ preventScroll: true });
    }
    root.onclick = function (event) { if (event.target === root) close(); };
    back.onclick = close;
    panel.addEventListener("keydown", function (event) {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        var controls = panel.querySelectorAll("button"), first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    root.appendChild(panel); document.body.appendChild(root);
    app.inert = true; bar.inert = true; document.documentElement.classList.add("word-notes-open");
    var unsubscribe = window.Store.onChange(render);
    if (window.SwipeBack) releaseSwipe = window.SwipeBack.mount(panel, close, list);
    render(); back.focus({ preventScroll: true });
    return close;
  }
  return { open: open };
})();
