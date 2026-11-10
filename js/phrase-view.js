/* Самопроверка фраз: сначала вспомнить, затем открыть образец и оценить ответ. */
window.PhraseView = (function () {
  "use strict";
  function mount(host, mode, options) {
    var E = window.Engine, el = E.el, esc = E.esc, training = options.training;
    var run = null, canUndo = false, disposed = false, release = null;
    function button(parent, label, action, secondary) {
      var b = el("button", "btn" + (secondary ? " sec" : ""), label);
      b.type = "button"; b.onclick = function () { if (!disposed) action(); };
      parent.appendChild(b); return b;
    }
    function reset() {
      if (release) release();
      host.innerHTML = ""; host.classList.remove("result-screen");
      release = window.SwipeBack.mount(host, function () { options.go("/"); });
    }
    function undo() {
      var result = run.undo(); canUndo = false;
      if (result.conflict) window.Store.warn("Фраза уже изменена на другом устройстве. Отмена не применена.", "phrase-undo");
      render();
    }
    function render() {
      reset();
      var current = run.current();
      if (!current.card) {
        run.finish(); options.showResult();
        var result = el("section", "card result-card phrase-result");
        result.appendChild(el("h1", null, current.empty ? "Пока всё" : "Тренировка завершена"));
        result.appendChild(el("p", "muted", current.empty ? "Повторы появятся, когда подойдёт срок." : "Готово. Повторы запланированы."));
        button(result, "На главную", function () { options.go("/"); });
        if (canUndo) button(result, "Отменить последний ответ", undo, true);
        host.appendChild(result); return;
      }
      var w = current.card.w, reverse = current.card.dir === "de", revealed = current.peeked;
      var section = el("section", "phrase-session");
      var top = el("div", "phrase-top");
      button(top, "← На главную", function () { options.go("/"); }, true);
      top.appendChild(el("span", "muted", current.retry ? "Повтор промахов · " + current.retryCount : (current.done + 1) + " / " + current.total));
      section.appendChild(top);
      var card = el("div", "card phrase-card");
      card.appendChild(el("div", "eyebrow", esc((window.PHRASE_TOPICS.filter(function (topic) { return topic.id === w.topic; })[0] || {}).title || "Бытовая ситуация")));
      card.appendChild(el("h2", null, esc(w.title)));
      card.appendChild(el("p", "muted", esc(w.context)));
      card.appendChild(el("p", "note", reverse ? "Вспомни смысл по-русски" : "Как сказать по-немецки?"));
      var prompt = el("p", "phrase-prompt", esc(reverse ? w.de : w.ru));
      prompt.lang = reverse ? "de" : "ru"; card.appendChild(prompt);
      if (revealed) {
        var answer = el("div", "phrase-answer");
        answer.setAttribute("aria-live", "polite");
        answer.appendChild(el("div", "muted", "Возможный вариант"));
        var text = el("p", "phrase-sample", esc(reverse ? w.ru : w.de));
        text.lang = reverse ? "ru" : "de"; answer.appendChild(text);
        answer.appendChild(el("p", "note", "Вспомнил без подсказки? Другой верный вариант тоже подходит."));
        card.appendChild(answer);
      }
      section.appendChild(card);
      var actions = el("div", "phrase-actions");
      if (!revealed) button(actions, "Показать ответ", function () { run.peek(); render(); });
      else {
        var row = el("div", "phrase-grades");
        function grade(ok) {
          if (!window.Store.ready() || window.Store.blocked()) { options.go("/more"); return; }
          run.answer(ok); canUndo = true; render();
        }
        button(row, "Не знаю", function () { grade(false); }, true);
        button(row, "Знаю", function () { grade(true); });
        actions.appendChild(row);
      }
      if (canUndo) button(actions, "Отменить последний ответ", undo, true);
      section.appendChild(actions); host.appendChild(section);
      options.context("phrase:" + current.card.key + ":" + revealed, function () {
        var context = { type: "exercise", title: w.title, description: w.context, question: reverse ? w.de : w.ru, checked: revealed };
        if (revealed) context.sampleAnswer = reverse ? w.ru : w.de;
        return context;
      }, function () { run.peek(); render(); });
    }
    run = training.open(mode === "repeat" ? "repeat" : "");
    render();
    return function () { disposed = true; if (release) release(); };
  }
  return { mount: mount };
})();
