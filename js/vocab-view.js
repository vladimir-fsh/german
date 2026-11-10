/* Экран карточек: DOM, размещение и эффекты. Очередью владеет VocabTraining. */
window.VocabView = (function () {
  "use strict";
  function bar(ws, loading) {
    var total = ws.total || 0, segments = "", rows = "";
    (ws.stages || []).forEach(function (stage) {
      var width = loading || !total ? 0 : stage.count / total * 100;
      segments += '<i class="phase-' + stage.id + '" style="width:' + width + '%"></i>';
      rows += '<div class="phase-stat"><span><i class="phase-' + stage.id + '"></i>' + stage.label +
        '</span><b>' + (loading ? "-" : stage.count) + '</b></div>';
    });
    return '<div class="phase-progress" aria-label="Распределение по интервалам">' +
      '<div class="phase-bar" aria-hidden="true">' + segments + '</div><div class="phase-grid">' + rows + '</div></div>';
  }

  function mount(app, mode, options) {
    var E = window.Engine, el = E.el, esc = E.esc, Store = window.Store;
    var training = options.training, active = options.active, syncTabs = options.syncTabs;
    var go = options.go, showResultLayout = options.showResult, tutorContext = options.context;
    var V_LEVELS = 5;
    function vocabSchedule(it) { return Store.vocabSchedule(Store.state().vocab, it.key.slice(0, -3)); }
    var run = training.open(mode), current = run.current(), calib = mode === "calib";
    app.innerHTML = "";

    if (current.empty) {
      var head = el("div", "card");
      head.innerHTML = '<div class="kicker">Словарь</div><h2>Карточки слов</h2>';
      app.appendChild(head);

      var sp = training.summary();
      var ws0 = sp;
      head.appendChild(el("div", "muted", calib
        ? "Все слова словаря уже в работе - калибровать нечего."
        : mode === "repeat"
        ? "Повторять нечего: ни одному слову сейчас не подошёл срок."
        : sp.fresh
          ? "Всё, что пора повторить, пройдено. Можно взять новые слова."
          : "Слова кончились: весь словарь уже в работе."));
      head.insertAdjacentHTML("beforeend", bar(ws0));
      head.appendChild(el("div", "note", "Новых слов можно начать сегодня: " + sp.newRemaining + ". Сначала повторите просроченные карточки."));
      var r0 = el("div", "btnrow");
      if (training.summary().canStartNew) {
        var bn = el("button", "btn", "Начать новые карточки");
        bn.onclick = function () { go("/vocab/new"); };
        r0.appendChild(bn);
      }
      var b0 = el("button", "btn sec", "← На главную");
      b0.onclick = function () { go("/"); };
      r0.appendChild(b0);
      head.appendChild(r0);
      return;
    }

    var total = current.total;

    var card = el("div", "vscreen");
    var pl = el("div", "progline");
    pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>';
    card.appendChild(pl);
    var intervalProgress = el("div", "vinterval muted");
    card.appendChild(intervalProgress);
    var host = el("div", "vhost");
    card.appendChild(host);
    app.appendChild(card);
    app.classList.add("tight");
    document.documentElement.classList.add("vocab-training");

    /* высота ровно по окну: ни вертикальной полосы, ни прыжков адресной строки */
    function fitScreen() {
      card.style.height = "auto";
      var top = card.getBoundingClientRect().top;
      var bar = document.getElementById("tabbar");
      var barH = bar ? bar.offsetHeight : 0;
      card.style.height = Math.max(0, window.innerHeight - top - barH - 12) + "px";
    }
    fitScreen();
    window.onresize = fitScreen;

    var busy = false, noteButton = null, notesDeck = null, closeNotes = null;
    function syncSavedIcon() {
      if (!active() || !noteButton || !current.card) return;
      var count = window.WordExplanations.list(current.card.key.slice(0, -3)).length;
      noteButton.hidden = !count || busy;
      noteButton.disabled = busy;
      if (count) notesDeck.classList.add("has-notes"); else notesDeck.classList.remove("has-notes");
      noteButton.setAttribute("aria-label", "Сохранённые объяснения: " + count);
    }
    var unsubscribeNotes = Store.onChange(syncSavedIcon);
    function undoPrevious() {
      if (busy || !active()) return;
      var undo = run.undo();
      if (undo.conflict) app.appendChild(el("div", "note", "Слово уже изменено на другом устройстве. Отмена недоступна."));
      if (!undo.restored) return;
      app.innerHTML = "";
      app.classList.remove("result-screen"); app.classList.add("tight");
      document.documentElement.classList.add("vocab-training"); app.appendChild(card);
      window.onresize = fitScreen; step(); syncTabs();
    }

    /* На итоге тот же жест вниз; обычная прокрутка и кнопки его не запускают. */
    function bindResultUndo(result) {
      var start = null, distance = 0;
      result.addEventListener('touchstart', function (event) {
        start = null; distance = 0;
        if (event.touches.length !== 1 || event.target.closest('button, a, input, textarea, select, [contenteditable]')) return;
        if ((document.scrollingElement || document.documentElement).scrollTop > 1) return;
        start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }, { passive: true });
      result.addEventListener('touchmove', function (event) {
        if (!start) return;
        if (event.touches.length !== 1) { start = null; return; }
        var dx = event.touches[0].clientX - start.x, dy = event.touches[0].clientY - start.y;
        distance = dy > 0 && dy > Math.abs(dx) * 1.4 ? dy : 0;
        if (distance > 14 && event.cancelable) event.preventDefault();
      }, { passive: false });
      result.addEventListener('touchend', function () {
        var undo = start && distance >= 100;
        start = null; distance = 0;
        if (undo) undoPrevious();
      });
      result.addEventListener('touchcancel', function () { start = null; distance = 0; });
    }

    var finishGesture = null;
    /* Ответ и позиция сохраняются до эффекта, следующий свайп блокируется. */
    function advance(source, ok, schedule) {
      busy = true;
      if (noteButton) noteButton.hidden = true;
      if (finishGesture) finishGesture(source === "known-swipe" || (calib && ok) ? "known" : ok ? "good" : "bad", schedule);
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(function () {
        if (!active()) return;
        busy = false;
        step();
      }, reduced ? 120 : 460);
    }

    function faceFront(it) {
      var f = el("div", "vface vfront");
      var inner = el("div", "vinner");
      inner.appendChild(el("div", "vword", esc(it.dir === "de" ? it.w.de : it.w.ru)));
      f.appendChild(inner);
      window.VocabFrames.decorate(f, vocabSchedule(it));
      return f;
    }

    function faceBack(it) {
      var de2ru = it.dir === "de";
      var b = el("div", "vface vback");
      var inner = el("div", "vinner");
      inner.innerHTML = '<div class="vword">' + esc(de2ru ? it.w.ru : it.w.de) + "</div>" +
        (it.w.ex ? '<div class="vex">' + esc(it.w.ex) +
          (it.w.exru ? "<i>" + esc(it.w.exru) + "</i>" : "") + "</div>" : "") +
        (it.w.reg ? '<div class="vreg">' + esc(it.w.reg) +
          (it.w.regEx ? '<div class="vex">' + esc(it.w.regEx) +
            (it.w.regExRu ? '<i>' + esc(it.w.regExRu) + '</i>' : '') + '</div>' : '') + '</div>' : '');
      b.appendChild(inner);
      window.VocabFrames.decorate(b, vocabSchedule(it));
      return b;
    }

    function step() {
      if (closeNotes) { closeNotes(); closeNotes = null; }
      current = run.current(); total = current.total;
      var it = current.card, schedule = current.schedule;
      if (!it) return finish();
      tutorContext("word:" + it.key, function () {
        var data = window.TutorContext.word(it.w, it.dir, !!(host.querySelector(".vflip.flipped")));
        data.lesson = it.n || null; data.wordKey = it.key.slice(0, -3); return data;
      });
      var paired = Store.vocabPaired(schedule);
      intervalProgress.textContent = current.retry ? "Повтор промахов · осталось " + current.retryCount : calib ? "Русский → немецкий" : paired
        ? "Интервал: " + (schedule.pairRu ? "½" : "0") + " из 1 · " + (it.dir === "ru" ? "русский → немецкий" : "немецкий → русский")
        : it.dir === "ru" ? "Русский → немецкий" : "Немецкий → русский";

      if (!calib) intervalProgress.textContent = window.VocabTraining.interval(schedule) + " · " + intervalProgress.textContent;

      pl.querySelector(".cnt").textContent = current.done + " / " + total;
      pl.querySelector("i").style.width = Math.round((current.done / total) * 100) + "%";

      host.innerHTML = "";
      var stage = el("div", "vstage");
      var deck = el("div", "vdeck");
      notesDeck = deck;

      var slot = el("div", "vslot vtop");
      var drag = el("div", "vdrag");
      var flip = el("div", "vflip");
      flip.appendChild(faceFront(it));
      flip.appendChild(faceBack(it));
      drag.appendChild(flip);
      slot.appendChild(drag);
      deck.appendChild(slot);
      noteButton = el("button", "word-note-open"); noteButton.type = "button";
      noteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/><path d="M9 8h6M9 11h6"/></svg>';
      noteButton.onclick = function () {
        if (busy || !active()) return;
        closeNotes = window.WordExplanationView.open(it.key.slice(0, -3), it.w.de, noteButton);
      };
      deck.appendChild(noteButton); syncSavedIcon();

      stage.appendChild(deck);
      host.appendChild(stage);
      fitScreen();

      finishGesture = window.VocabGestures.bind(drag, flip, {
        active: active, busy: function () { return busy; }, calibration: calib,
        undo: undoPrevious, known: function () { answerKnown("known-swipe"); },
        answer: function (ok) { answer(ok, "swipe"); }, flip: flipCard
      });
      if (current.peeked) { flip.classList.add("flipped"); }
    }

    function flipCard() {
      if (busy || !active()) return;
      var flip = host.querySelector(".vflip");
      if (!flip) return;
      run.peek();   /* Подсказка сохраняется при переходах и перезагрузке. */
      flip.classList.toggle("flipped");
    }

    function answerKnown(source) { commit(true, source, true); }
    function answer(ok, source) { commit(ok, source, false); }
    function commit(ok, source, known) {
      if (busy || !active()) return;
      var result = run.answer(ok, known);
      if (!result) return;
      syncTabs(); advance(source, result.ok, result.schedule);
    }

    document.onkeydown = function (e) {
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target && e.target.tagName)) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard(); }
      else if (e.key === "1") { e.preventDefault(); answer(true); }
      else if (e.key === "2") { e.preventDefault(); answer(false); }
    };

    function finish() {
      document.onkeydown = null;
      tutorContext("vocab-result", function () { return { type: "result", title: "Тренировка слов завершена", cards: total }; });
      document.documentElement.classList.remove("vocab-training");
      var result = run.finish();

      if (calib) return finishCalib(result);

      var moved = result.moved;
      var sp = training.summary();
      app.innerHTML = "";
      var ws = sp;
      showResultLayout();
      var c = el("div", "card hero result-card");
      var ending = total % 100 >= 11 && total % 100 <= 14 ? "карточек пройдено"
        : total % 10 === 1 ? "карточка пройдена" : total % 10 >= 2 && total % 10 <= 4 ? "карточки пройдены" : "карточек пройдено";
      c.innerHTML = '<div class="kicker">Сессия закрыта</div><h1>' + total + " " + ending + "</h1>" +
        '<div class="muted">Ступень словаря: ' + Store.state().vocabLevel + " из " + V_LEVELS +
        (moved === "up" ? " - новые слова шли легко, дальше беру следующую группу словаря."
          : moved === "down" ? " - новые слова буксовали, возвращаюсь к предыдущей группе словаря." : "") +
        (sp.due ? "<br>Ждут повторения прямо сейчас: " + sp.due + "." : "") + "</div>" +
        bar(ws);
      var r = el("div", "btnrow");
      var repLeft = sp.repeat;
      if (repLeft) {
        var br = el("button", "btn", "Повторить слова (" + repLeft + ")");
        br.onclick = function () { window.Sessions.clear("vocab"); go("/vocab/repeat"); };
        r.appendChild(br);
      }
      if (training.summary().canStartNew) {
        var bn2 = el("button", "btn" + (repLeft ? " sec" : ""), "Начать новые карточки");
        bn2.onclick = function () { window.Sessions.clear("vocab"); go("/vocab/new"); };
        r.appendChild(bn2);
      }
      var b = el("button", "btn sec", "На главную");
      b.onclick = function () { go("/"); };
      r.appendChild(b);
      bindResultUndo(c);
      c.appendChild(r);
      app.appendChild(c);
    }

    step();
    return function () { unsubscribeNotes(); if (closeNotes) closeNotes(); };

    /* Итог калибровки: ступень - самая высокая, где знакомо хотя бы половину,
       плюс одна сверху, чтобы было куда расти. */
    function finishCalib(result) {
      var lvl = result.level, known = result.known, shown = result.shown, calibStat = result.calibStat;
      syncTabs();

      app.innerHTML = "";
      showResultLayout();
      var c = el("div", "card hero result-card");
      var rows = "";
      for (var m = 1; m <= V_LEVELS; m++) {
        var s2 = calibStat[m];
        if (!s2) continue;
        rows += "<div>Ступень " + m + ": знакомо " + s2.known + " из " + s2.shown + "</div>";
      }
      c.innerHTML = '<div class="kicker">Калибровка</div><h1>Ступень ' + lvl + " из " + V_LEVELS + "</h1>" +
        '<div class="muted">Знакомые слова закрыты сразу и в очередь не попадут - ' +
        "их " + known + " из " + shown + ".<br>Новые слова теперь берутся с этой ступени.</div>" +
        '<div class="muted" style="margin-top:10px">' + rows + "</div>";
      var r = el("div", "btnrow");
      var b = el("button", "btn", "Учить слова");
      b.onclick = function () { go("/vocab"); };
      var b2 = el("button", "btn sec", "На главную");
      b2.onclick = function () { go("/"); };
      r.appendChild(b); r.appendChild(b2);
      bindResultUndo(c);
      c.appendChild(r);
      app.appendChild(c);
    }
  }

  return { mount: mount, bar: bar };
})();
