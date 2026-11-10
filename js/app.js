/* Приложение: маршруты, прогресс, очередь повторения. */
(function () {
  "use strict";
  var E = window.Engine, el = E.el, esc = E.esc;
  var app = document.getElementById("app");

  /* ---------- состояние ----------
     Живёт в js/sync.js: локальный журнал операций плюс свёртка. Здесь только
     чтение состояния и вызов мутаций — прямых присваиваний в S больше нет. */
  var Store = window.Store;
  var S = Store.state();
  var attempts = window.ExerciseAttempt.create({ store: Store, engine: E,
    practice: window.Practice, sessions: window.Sessions, review: window.ReviewPlan });
  var working = false, routeId = 0, disposeCloud = null, disposeUpdates = null, disposeVocab = null;

  function tutorContext(id, getData, onUse) {
    if (window.Tutor) window.Tutor.setContext(id, getData, onUse);
  }
  if (window.Tutor) window.Tutor.init();

  Store.onChange(function (next) {
    S = next;
    if (redrawable()) route();
    syncTabs();
  });

  /* Перерисовывать можно там, где нет незавершённого прохода: экран задания
     или карточки пересобирать нельзя, иначе ответ пропадёт на полуслове.
     Списки и главная перерисовываются всегда — именно на них видно прогресс. */
  /* Текущий маршрут. Всё, что не похоже на наш маршрут, считается главной. */
  var ROUTE_RE = /^\/(vocab(\/(new|repeat|calibrate))?|phrases(\/(train|repeat))?|review|more(\/cloud)?|l\d+(\/(g|d)\d+)?)?$/;
  function curPath() {
    var h = location.hash.replace(/^#/, "");
    return ROUTE_RE.test(h) ? h : "/";
  }

  function redrawable() {
    var h = curPath();
    if (h === "/more") return !working;
    if (h === "/" || /^\/l\d+$/.test(h)) return true;
    if (h === "/vocab" || h === "/review") return !working;
    return false;
  }

  function dayKey(n, d) { return "L" + n + "D" + d; }
  function isDayDone(n, d) { return !!S.done[dayKey(n, d)]; }
  function lessonPct(n) {
    var L = window["L" + n];
    if (!L) return 0;
    var total = L.days.length, k = 0;
    for (var i = 0; i < total; i++) if (isDayDone(n, i)) k++;
    return Math.round((k / total) * 100);
  }
  function touchStreak() {
    var today = window.ProgressData.day(new Date());
    if (S.lastDay === today) return;
    S = Store.mutate("touchDay", { day: today });
  }

  /* очередь повторения: id -> {box, due, ex, lesson} */
  function srsDue() {
    var now = Date.now(), out = [];
    for (var k in S.srs) if (S.srs[k].due <= now) out.push({ id: k, r: S.srs[k] });
    return out;
  }

  /* ---------- маршруты ---------- */
  function go(hash) { location.hash = hash; }
  window.addEventListener("hashchange", route);

  function route() {
    if (disposeVocab) { disposeVocab(); disposeVocab = null; }
    if (disposeUpdates) { disposeUpdates(); disposeUpdates = null; }
    if (disposeCloud) { disposeCloud(); disposeCloud = null; }
    routeId++; working = false; document.onkeydown = null;
    var h = curPath();
    var m;
    tutorContext(h, function () {
      var names = { "/": "Курс немецкого A2 → B1", "/more": "Настройки приложения", "/more/cloud": "Облако и вход", "/review": "Повторение ошибок", "/vocab": "Тренировка слов" };
      return { type: "page", title: names[h] || "Тренировка слов", note: "На экране нет отдельного слова или задания. Уточни, что объяснить." };
    });
    document.documentElement.classList.remove("vocab-training");
    window.scrollTo(0, 0);
    window.onresize = null;
    app.classList.remove("tight", "result-screen");
    syncTabs();
    if (h === "/") return viewHome();
    if (h === "/review") return viewReview();
    if (/^\/phrases/.test(h)) return viewPhrases(h.split("/")[2]);
    if (h === "/vocab") return viewVocab();
    if (h === "/vocab/new") return viewVocab("new");
    if (h === "/vocab/repeat") return viewVocab("repeat");
    if (h === "/vocab/calibrate") return viewVocab("calib");
    if (h === "/more") return viewMore();
    if (h === "/more/cloud") {
      working = true; app.innerHTML = "";
      disposeCloud = window.mountCloud(app, function () { go("/more"); }); return;
    }
    if ((m = h.match(/^\/l(\d+)$/))) return viewLesson(+m[1]);
    if ((m = h.match(/^\/l(\d+)\/g(\d+)$/))) return viewGrammar(+m[1], +m[2]);
    if ((m = h.match(/^\/l(\d+)\/d(\d+)$/))) return viewDay(+m[1], +m[2]);
    viewHome();
  }

  /* ---------- главная ---------- */
  function viewHome() {
    var C = window.COURSE;
    var ready = C.lessons.filter(function (l) { return l.status === "ready"; });
    var totalDays = 0, doneDays = 0;
    ready.forEach(function (l) {
      var L = window["L" + l.n];
      if (!L) return;
      totalDays += L.days.length;
      L.days.forEach(function (_, i) { if (isDayDone(l.n, i)) doneDays++; });
    });
    var pct = totalDays ? Math.round((doneDays / totalDays) * 100) : 0;
    var due = srsDue().length;
    var vocab = training.summary(), words = vocab.pending;
    var acc = S.totalTried ? Math.round((S.totalCorrect / S.totalTried) * 100) : 0;

    /* Поврежденное хранилище: нули были бы враньем, показываем прочерки. */
    var loading = !Store.ready();
    function val(x) { return loading ? "—" : x; }

    app.innerHTML = "";
    var hero = el("div", "card hero");
    hero.innerHTML =
      '<div class="kicker">' + esc(C.pace) + "</div>" +
      "<h1>" + esc(C.title) + "</h1>" +
      '<div class="muted">Курс собран на базе упражнений lehrerlenz.de, Lektionen 18–32. ' +
      "Доступны " + ready.length + " из " + C.lessons.length + " уроков. Процент показывает выполнение доступных заданий, а не готовность к B1.</div>" +
      '<div class="bar"><i style="width:' + (loading ? 0 : pct) + '%"></i></div>' +
      '<div class="stats">' +
      '<div class="stat"><b>' + (loading ? "—" : doneDays + " / " + totalDays) + "</b><span>доступных дней выполнено</span></div>" +
      '<div class="stat"><b>' + val(window.ProgressData.currentStreak(S, window.ProgressData.day(new Date()))) + "</b><span>учебных дней подряд</span></div>" +
      '<div class="stat"><b>' + (loading ? "—" : acc + "%") + "</b><span>верных ответов</span></div>" +
      '<div class="stat"><b>' + val(due) + "</b><span>на повторение</span></div>" +
      '<div class="stat"><b>' + val(words) + "</b><span>карточек на сегодня</span></div>" +
      "</div>";
    var row = el("div", "btnrow");
    var next = findNext();
    var b1 = el("button", "btn", loading ? "Подтягиваю прогресс…"
      : next ? "Продолжить: урок " + next.n + ", день " + (next.d + 1) : "Все готовые уроки пройдены");
    b1.disabled = loading || !next;
    b1.onclick = function () { go("/l" + next.n + "/d" + next.d); };
    row.appendChild(b1);
    if (due) {
      var b2 = el("button", "btn sec", "Повторить ошибки (" + due + ")");
      b2.onclick = function () { go("/review"); };
      row.appendChild(b2);
    }
    hero.appendChild(row);
    app.appendChild(hero);

    var ws = vocab;
    var vcard = el("div", "card");
    vcard.innerHTML = "<h2>Словарь</h2>" +
      '<div class="muted">Закрытые слова включают прежнее расписание и вашу самооценку. ' +
      "Это не подтверждение знания. Новые карточки продолжают повторяться.</div>" + vocabBar(ws, loading);
    if (!loading && !S.calibrated) {
      vcard.appendChild(el("div", "note",
        "Слова пока берутся с самой ходовой ступени, поэтому попадается лёгкое. " +
        "Калибровка проходит по четыре слова с каждой ступени: знакомое закрывается сразу, " +
        "а стартовая группа слов выбирается по самооценке. Это не тест уровня языка."));
    }

    var vrow = el("div", "btnrow");
    if (!loading && !S.calibrated) {
      var vbc = el("button", "btn", "Подобрать слова");
      vbc.onclick = function () { go("/vocab/calibrate"); };
      vrow.appendChild(vbc);
    }
    var canStartNew = vocab.canStartNew;
    var vb = el("button", "btn" + (words && S.calibrated ? "" : " sec"),
      loading ? "Подтягиваю прогресс…" : words ? "Учить слова (" + words + ")" : canStartNew ? "Начать новые карточки" : "Повторы будут позже");
    vb.disabled = loading || (!words && !canStartNew);
    vb.onclick = function () { go(words ? "/vocab" : "/vocab/new"); };
    vrow.appendChild(vb);
    var rep0 = loading ? 0 : vocab.repeat;
    if (rep0) {
      var vb2 = el("button", "btn sec", "Повторить слова (" + rep0 + ")");
      vb2.onclick = function () { go("/vocab/repeat"); };
      vrow.appendChild(vb2);
    }
    vcard.appendChild(vrow);
    app.appendChild(vcard);

    var phrases = phraseTraining.summary(), pc = el("div", "card");
    pc.appendChild(el("h2", null, "Фразы для жизни"));
    pc.appendChild(el("p", "muted", window.PHRASE_TOPICS.length + " тем · " + phrases.total + " фраз для повседневного общения"));
    pc.insertAdjacentHTML("beforeend", vocabBar(phrases, loading));
    var phraseSession = window.Sessions.load("phrases");
    var phraseRepeat = phraseSession && phraseSession.mode === "repeat";
    var prow = el("div", "btnrow");
    var pb = el("button", "btn", "Учить");
    pb.disabled = loading || !!phraseRepeat || (!phraseSession && !phrases.pending);
    pb.onclick = function () { go("/phrases/train"); };
    prow.appendChild(pb);
    var pr = el("button", "btn sec", "Повторить");
    pr.disabled = loading || (!!phraseSession && !phraseRepeat) || (!phraseRepeat && !phrases.repeat);
    pr.onclick = function () { go("/phrases/repeat"); };
    prow.appendChild(pr);
    if (phraseSession && !loading) pc.appendChild(el("p", "muted", phraseRepeat ? "Продолжить повторение" : "Продолжить обучение"));
    pc.appendChild(prow); app.appendChild(pc);

    var list = el("div", "card");
    list.appendChild(el("h2", null, "Программа"));
    list.appendChild(el("div", "muted", "План из 15 уроков. Новые уроки добавляются поэтапно."));
    var holder = el("div", null);
    holder.style.marginTop = "14px";
    C.lessons.forEach(function (l) {
      var L = window["L" + l.n];
      var ok = l.status === "ready" && L;
      var pctL = ok && !loading ? lessonPct(l.n) : 0;
      var d = el("div", "lesson" + (pctL === 100 ? " done" : pctL > 0 ? " active" : ""));
      d.innerHTML =
        '<div class="num">' + l.n + "</div>" +
        "<div><div class=\"t\">" + esc(l.title) +
        (ok ? "" : '<span class="badge">скоро</span>') + "</div>" +
        '<div class="s">' + esc(l.ru) + "</div></div>" +
        '<div class="pct">' + (ok ? (loading ? "…" : pctL + "%") : l.days + " дн.") + "</div>";
      if (ok) d.onclick = function () { go("/l" + l.n); };
      else d.style.opacity = ".55", d.style.cursor = "default";
      holder.appendChild(d);
    });
    list.appendChild(holder);
    app.appendChild(list);
  }

  function findNext() {
    var C = window.COURSE;
    for (var i = 0; i < C.lessons.length; i++) {
      var l = C.lessons[i], L = window["L" + l.n];
      if (l.status !== "ready" || !L) continue;
      for (var d = 0; d < L.days.length; d++) if (!isDayDone(l.n, d)) return { n: l.n, d: d };
    }
    return null;
  }

  /* ---------- урок: список дней ---------- */
  function viewLesson(n) {
    var L = window["L" + n];
    if (!L) return go("/");
    var meta = window.COURSE.lessons.filter(function (x) { return x.n === n; })[0];
    tutorContext("lesson:" + n, function () {
      return { type: "lesson", title: L.title, description: L.ru,
        topics: L.grammar.map(function (g) { return g.title; }), words: L.words };
    });
    app.innerHTML = "";
    var c = el("div", "card");
    c.innerHTML =
      '<div class="kicker">Lektion ' + n + "</div>" +
      "<h2>" + esc(L.title) + "</h2>" +
      '<div class="muted">' + esc(L.ru) + "</div>" +
      '<div class="bar"><i style="width:' + lessonPct(n) + '%"></i></div>';
    app.appendChild(c);

    var d = el("div", "card");
    d.appendChild(el("h2", null, "Дни"));
    L.days.forEach(function (day, i) {
      var row = el("div", "day" + (isDayDone(n, i) ? " done" : ""));
      var open = dayLoad(n, i);
      var available = day.ex.filter(function (ex, index) { return !(S.deletedExercises || {})[dayKey(n, i) + "-" + index]; }).length;
      row.innerHTML =
        '<div class="tag">' + (open ? "продолжить" : isDayDone(n, i) ? "готово" : "день " + (i + 1)) + "</div>" +
        "<div><div style=\"font-weight:600\">" + esc(day.title) + "</div>" +
        '<div class="s muted">' + esc(day.sub || "") + " · " +
        (open ? "есть незавершённая сессия · " + available + " заданий" : available + " заданий") +
        "</div></div>";
      row.onclick = function () { go("/l" + n + "/d" + i); };
      d.appendChild(row);
    });
    app.appendChild(d);

    if (L.words && L.words.length) {
      var wc = el("div", "card");
      wc.appendChild(el("h2", null, "Слова урока"));
      var learnedN = 0;
      L.words.forEach(function (w) {
        var v = Store.vocabSchedule(S.vocab, "L" + n + ":" + w.de);
        if (v && v.learned) learnedN++;
      });
      wc.appendChild(el("div", "muted", L.words.length + " слов · закрыто " + learnedN +
        " · карточки идут общей очередью со всем курсом"));
      var wl = el("div", "wordlist");
      L.words.forEach(function (w) {
        var line = el("div", null, "<b>" + esc(w.de) + "</b> — <span>" + esc(w.ru) +
          "</span><i>повторение: " + esc(vocabWhen("L" + n + ":" + w.de + "|ru")) + "</i>");
        wl.appendChild(line);
      });
      wc.appendChild(wl);
      var wr = el("div", "btnrow");
      var wb = el("button", "btn sec", "Учить карточки");
      wb.onclick = function () { go("/vocab"); };
      wr.appendChild(wb);
      wc.appendChild(wr);
      app.appendChild(wc);
    }

    if (L.links && L.links.length) {
      var lk = el("div", "card");
      lk.appendChild(el("h2", null, "Оригинальные упражнения"));
      lk.appendChild(el("div", "muted", "Интерактивные задания на lehrerlenz.de — открываются в новой вкладке."));
      var box = el("div", "linklist");
      box.style.marginTop = "12px";
      L.links.forEach(function (x) {
        var a = document.createElement("a");
        a.href = x.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = x.t;
        box.appendChild(a);
      });
      lk.appendChild(box);
      app.appendChild(lk);
    }

    var back = el("div", "btnrow");
    var b = el("button", "btn sec", "← К программе");
    b.onclick = function () { go("/"); };
    back.appendChild(b);
    app.appendChild(back);
  }

  /* ---------- грамматика ---------- */
  function viewGrammar(n, gi) {
    var L = window["L" + n];
    var g = L && L.grammar[gi];
    if (!g) return go("/l" + n);
    tutorContext("grammar:" + n + ":" + gi, function () {
      var data = window.TutorContext.theory(g); data.type = "theory"; data.lesson = n; return data;
    });
    app.innerHTML = "";
    var c = el("div", "card");
    c.innerHTML = '<div class="kicker">Lektion ' + n + " · Теория</div><h2>" + esc(g.title) + "</h2>" +
      '<div class="gram">' + g.html + "</div>";
    app.appendChild(c);
    var row = el("div", "btnrow");
    var b = el("button", "btn", "Понятно, к заданиям");
    b.onclick = function () { history.back(); };
    row.appendChild(b);
    app.appendChild(row);
  }

  /* ---------- день: прохождение заданий ---------- */
  function viewDay(n, di) {
    var L = window["L" + n], day = L && L.days[di];
    if (!day) return go("/l" + n);
    if (Store.blocked()) return viewMore();
    working = true;
    var list = day.ex.slice(), run = window.Practice.load(n, di, list) || window.Practice.create(n, di, list);
    var i = run.i, api = null, answered = false, finished = false;
    function exerciseId(index) { return dayKey(n, di) + "-" + index; }
    function deleted(index) { return !!(S.deletedExercises || {})[exerciseId(index)]; }
    var view = routeId, theoryDetails = [];
    window.Practice.save(run);
    app.innerHTML = "";
    var head = el("div", "card");
    head.innerHTML = '<div class="kicker">Lektion ' + n + " · День " + (di + 1) + "</div><h2>" + esc(day.title) + "</h2>" +
      (day.sub ? '<div class="muted">' + esc(day.sub) + "</div>" : "");
    if (day.grammar != null) [].concat(day.grammar).forEach(function (gi) {
      var g = L.grammar[gi]; if (!g) return;
      var det = document.createElement("details"); det.className = "theory";
      det.innerHTML = "<summary>Теория: " + esc(g.title) + '</summary><div class="gram">' + g.html + "</div>";
      det.addEventListener("toggle", function () {
        if (det.open && api) api.hint();
      }); head.appendChild(det); theoryDetails.push({ node: det, grammar: g });
    });
    head.appendChild(el("div", "muted", "Ответы сохраняются. Результат относится к первой попытке; открытая теория отмечается как подсказка."));
    /* день пройден, а отметка не легла (сбой, перезагрузка) — засчитать руками
       с уже сохранёнными ответами; второе нажатие подтверждает */
    if (!isDayDone(n, di)) {
      var mrow = el("div", "btnrow"), mark = el("button", "btn sec", "Засчитать день"), armed = false;
      mark.onclick = function () {
        if (!armed) { armed = true; mark.textContent = "Точно засчитать? Нажми ещё раз"; return; }
        done(true);
      };
      mrow.appendChild(mark); head.appendChild(mrow);
    }
    app.appendChild(head);
    var card = el("div", "card"), pl = el("div", "progline");
    pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>'; card.appendChild(pl);
    var host = el("div", null); card.appendChild(host);
    var removePanel = el("div", "exercise-remove"); removePanel.hidden = true;
    removePanel.appendChild(el("div", "muted", "Удалить из курса и повторений без возможности возврата. Почему это задание не подходит?"));
    var reason = document.createElement("select"); reason.className = "big";
    reason.setAttribute("aria-label", "Причина удаления задания");
    ["Выбери причину", "Механическая работа", "Неоднозначное условие", "Слишком очевидно", "Не тренирует нужный навык", "Ошибка в задании", "Другая причина"].forEach(function (text, index) {
      var option = document.createElement("option"); option.value = index ? text : ""; option.textContent = text; reason.appendChild(option);
    });
    removePanel.appendChild(reason);
    var removalNote = document.createElement("textarea"); removalNote.className = "backup-text";
    removalNote.placeholder = "Что именно не так? Необязательно"; removalNote.maxLength = 600;
    removalNote.setAttribute("aria-label", "Замечание к заданию"); removePanel.appendChild(removalNote);
    var removeButtons = el("div", "btnrow"), confirmRemove = el("button", "btn", "Удалить навсегда"), cancelRemove = el("button", "btn sec", "Отмена");
    confirmRemove.disabled = true;
    reason.onchange = function () { confirmRemove.disabled = !reason.value; };
    cancelRemove.onclick = function () { removePanel.hidden = true; };
    removeButtons.appendChild(confirmRemove); removeButtons.appendChild(cancelRemove); removePanel.appendChild(removeButtons); card.appendChild(removePanel);
    var row = el("div", "btnrow sticky exercise-actions"), check = el("button", "btn primary-action", "Проверить"), next = el("button", "btn primary-action", "Дальше →");
    var skip = el("button", "btn sec", "Пропустить"), remove = el("button", "btn sec", "Удалить");
    row.appendChild(check); row.appendChild(next); row.appendChild(skip); row.appendChild(remove); card.appendChild(row); app.appendChild(card);
    function syncBar() { skip.style.display = answered ? "none" : ""; }
    function advance(omitted) {
      if (finished || view !== routeId || i >= list.length) return;
      var record = run.records[i] || (run.records[i] = {});
      if (!record.result) record.omitted = omitted;
      run.i = ++i; window.Practice.save(run); step();
    }
    skip.onclick = function () { if (!answered) advance("skipped"); };
    remove.onclick = function () {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      removePanel.hidden = false; reason.value = ""; removalNote.value = ""; confirmRemove.disabled = true;
      removePanel.scrollIntoView({ block: "nearest" });
    };
    confirmRemove.onclick = function () {
      if (!reason.value || finished || view !== routeId || i >= list.length) return;
      S = Store.mutate("exerciseDelete", { id: exerciseId(i), ex: list[i], reason: reason.value + (removalNote.value.trim() ? ": " + removalNote.value.trim() : "") });
      if (deleted(i)) advance("deleted");
    };
    function step() {
      removePanel.hidden = true;
      while (i < list.length && (deleted(i) || (run.records[i] && run.records[i].omitted))) {
        var omitted = run.records[i] || (run.records[i] = {});
        if (!omitted.result && deleted(i)) omitted.omitted = "deleted";
        run.i = ++i;
      }
      window.Practice.save(run);
      if (i >= list.length) return done();
      var record = run.records[i] || (run.records[i] = {});
      answered = !!record.result;
      tutorContext("exercise:" + exerciseId(i), function () {
        var data = window.TutorContext.exercise(list[i], api ? api.state().draft : record.draft, record.result, day.title);
        data.lesson = n; data.day = di + 1;
        data.openTheory = [];
        theoryDetails.forEach(function (item) {
          if (item.node.open) data.openTheory.push(window.TutorContext.theory(item.grammar));
        });
        return data;
      }, function () { if (api) api.hint(); });
      var visible = list.map(function (ex, index) { return index; }).filter(function (index) { return !deleted(index); });
      var position = visible.indexOf(i);
      pl.querySelector(".cnt").textContent = (position + 1) + " / " + visible.length;
      pl.querySelector("i").style.width = Math.round(position / visible.length * 100) + "%";
      api = attempts.day(run, i, list[i], host, {
        active: function () { return !finished && view === routeId && record === run.records[i] && !deleted(i); },
        onResult: function () { answered = true; check.style.display = "none"; next.style.display = ""; syncBar(); }
      });
      if (head.querySelector("details[open]")) api.hint();
      answered = !!api.state().result;
      check.style.display = !answered && api.state().canCheck ? "" : "none";
      next.style.display = answered ? "" : "none"; syncBar();
    }
    check.onclick = function () { if (api && !answered) api.check(); };
    next.onclick = function () { if (!answered || finished || view !== routeId) return; run.i = ++i; window.Practice.save(run); step(); };
    document.onkeydown = function (event) { if (event.key === "Enter" && answered) { event.preventDefault(); next.click(); } };
    /* manual — день засчитан кнопкой: результат считается только по сохранённым
       ответам, задания без ответа не идут в «не совпали» */
    function done(manual) {
      if (finished) return; finished = true; working = false; document.onkeydown = null;
      var stats = window.Practice.stats(run), of = stats.answered;
      tutorContext("day-result:" + run.id, function () {
        return { type: "result", title: "Итог дня: " + day.title, answered: stats.answered, correct: stats.correct, hints: stats.hints };
      });
      if (manual) {
        of = 0;
        run.records.forEach(function (record) { if (record && record.result) of++; });
        of = Math.max(of, stats.correct);
      }
      var op = { n: n, di: di, score: stats.correct, of: of, uncertain: stats.uncertain, hints: stats.hints, attemptId: run.id, records: run.records };
      if (manual) op.manual = true;
      /* ответов не было — в истории нечего показывать, остаётся только отметка дня */
      if (manual && !of) { delete op.attemptId; delete op.records; }
      if (manual || of) S = Store.mutate(!manual && stats.skipped ? "practiceDone" : "dayDone", op);
      if (of) touchStreak(); window.Practice.remove(n, di);
      app.innerHTML = "";
      showResultLayout();
      var c = el("div", "card hero result-card");
      c.innerHTML = manual
        ? '<div class="kicker">Lektion ' + n + " · День " + (di + 1) + " засчитан</div><h1>День засчитан вручную</h1>" +
          '<div class="muted">' + (of
            ? "Сохранилось ответов: " + of + ", из них совпали с ответами: " + stats.correct + ". Задания без ответа в результат не входят." +
              (stats.correct < of ? " Ошибки из этих ответов назначены на повторение." : "")
            : "Сохранённых ответов не было, поэтому результат не записан. День отмечен как пройденный.") + "</div>"
        : '<div class="kicker">Lektion ' + n + " · День " + (di + 1) + " · сессия завершена</div><h1>" + (of ? stats.correct + " из " + of + " совпали с ответами" : "Нет проверенных ответов") + "</h1>" +
        '<div class="muted">Это выполненная практика, не подтверждение уровня B1. Ошибки назначены на повторение спустя время.</div>';
      c.innerHTML +=
        (stats.skipped ? '<div class="note">Пропущено: ' + stats.skipped + '. Они не считаются ошибками и снова появятся в следующем прохождении. День с пропусками не получает новую отметку о завершении.</div>' : "") +
        (stats.deleted ? '<div class="note">Удалено из курса: ' + stats.deleted + ".</div>" : "") +
        (stats.uncertain ? '<div class="note">Переводов без подтвержденной оценки: ' + stats.uncertain + ". Другой вариант может быть верным.</div>" : "") +
        (stats.hints ? '<div class="note">Попыток с открытой теорией: ' + stats.hints + ". Проверьте навык позже без подсказки.</div>" : "");
      var buttons = el("div", "btnrow"), nx = findNext();
      if (nx) { var b1 = el("button", "btn", "Следующий день"); b1.onclick = function () { go("/l" + nx.n + "/d" + nx.d); }; buttons.appendChild(b1); }
      var b2 = el("button", "btn sec", "Пройти день заново"); b2.onclick = function () { window.Practice.remove(n, di); route(); };
      var b3 = el("button", "btn sec", "К программе"); b3.onclick = function () { go("/"); };
      buttons.appendChild(b2); buttons.appendChild(b3); c.appendChild(buttons); app.appendChild(c);
    }
    step();
  }

  /* Итог по центру; длинный блок остаётся в обычном потоке страницы. */
  function showResultLayout() {
    window.onresize = null;
    app.classList.remove("tight");
    app.classList.add("result-screen");
    window.scrollTo(0, 0);
  }

  /* ---------- повторение ---------- */
  function viewReview() {
    if (Store.blocked()) return viewMore();
    working = true;
    var saved = window.Sessions.load("review");
    var run = saved || window.ReviewPlan.create(E.shuffle(srsDue()), S);
    var i = run.i, view = routeId;
    app.innerHTML = "";
    if (!run.items.length) {
      var c0 = el("div", "card hero");
      c0.innerHTML = '<h1>Нечего повторять</h1><div class="muted">Сейчас срок повторения не подошел ни одной ошибке. Уже назначенные повторы остаются в очереди.</div>';
      var r0 = el("div", "btnrow"), bb = el("button", "btn", "К программе");
      bb.onclick = function () { go("/"); }; r0.appendChild(bb); c0.appendChild(r0); app.appendChild(c0);
      return;
    }
    function stash() { run.i = i; run.at = Date.now(); window.Sessions.save("review", run); }
    stash();
    var card = el("div", "card");
    card.innerHTML = '<div class="kicker">Повторение ошибок</div><div class="muted">Ввод сохраняется. Поздний повтор использует другое задание только при совпадении учебного правила.</div>';
    var pl = el("div", "progline"); pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>'; card.appendChild(pl);
    var host = el("div", null); card.appendChild(host);
    var row = el("div", "btnrow sticky"), check = el("button", "btn", "Проверить"), next = el("button", "btn sec", "Дальше →");
    row.appendChild(check); row.appendChild(next); card.appendChild(row); app.appendChild(card);
    var api = null, answered = false;
    function syncBar() { row.className = "btnrow sticky" + (check.style.display === "none" && next.style.display === "none" ? " empty" : ""); }
    function step() {
      if (view !== routeId) return;
      while (i < run.items.length) {
        var rec = run.records[i], checked = rec && (rec.result || (rec.draft && rec.draft.result));
        if (!window.ReviewPlan.deleted(run.items[i], S) && (checked || window.ReviewPlan.pending(run.items[i], S))) break;
        i++;
      }
      if (i >= run.items.length) { window.Sessions.clear("review"); return go("/"); }
      stash();
      var record = run.records[i] || (run.records[i] = {});
      answered = !!record.result;
      tutorContext("review:" + run.items[i].id, function () {
        return window.TutorContext.exercise(run.items[i].ex, api ? api.state().draft : record.draft, record.result, "Повторение ошибок");
      });
      pl.querySelector(".cnt").textContent = (i + 1) + " / " + run.items.length;
      pl.querySelector("i").style.width = Math.round(i / run.items.length * 100) + "%";
      api = attempts.review(run, i, host, {
        active: function () { return view === routeId && record === run.records[i]; },
        onResult: function () { answered = true; check.style.display = "none"; next.style.display = ""; syncBar(); }
      });
      answered = !!api.state().result;
      check.style.display = !answered && api.state().canCheck ? "" : "none"; next.style.display = answered ? "" : "none"; syncBar();
    }
    check.onclick = function () { if (api && !answered) api.check(); };
    next.onclick = function () { if (!answered || view !== routeId) return; i++; stash(); step(); };
    document.onkeydown = function (event) { if (event.key === "Enter" && answered) { event.preventDefault(); next.click(); } };
    step();
  }

  /* ---------- нижние вкладки ---------- */
  var tabs = document.querySelectorAll(".tab");

  Array.prototype.forEach.call(tabs, function (b) {
    if (!b.getAttribute("data-go")) return;
    b.onclick = function () { go(b.getAttribute("data-go")); };
  });

  /* Чат открывается поверх текущего экрана, сохраняя его контекст. */
  function syncTabs() {
    var h = curPath();
    var root = h.indexOf("/more") === 0 ? "/more" : "/";
    Array.prototype.forEach.call(tabs, function (b) {
      var mine = b.getAttribute("data-go");
      if (!mine) return;
      b.className = "tab" + (mine === root ? " on" : "");
    });
  }

  /* ---------- вкладка «Ещё» ---------- */
  function viewMore() {
    working = true;
    app.innerHTML = "";
    var c = el("div", "card");
    c.innerHTML = '<h2>Настройки</h2>';
    if (disposeUpdates) disposeUpdates();
    disposeUpdates = window.AppUpdates.mount(c);
    var rows = el("div", "rows");

    var dark = window.Theme.current() === "dark";
    var themeRow = el("button", "row",
      'Тёмная тема<span class="val">' + (dark ? "включена" : "выключена") + "</span>");
    themeRow.onclick = function () {
      window.Theme.set(window.Theme.current() === "dark" ? "light" : "dark");
      viewMore();
    };
    rows.appendChild(themeRow);

    var cloudRow = el("button", "row", 'Облако и вход<span class="val">Firebase →</span>');
    cloudRow.onclick = function () { go("/more/cloud"); };
    rows.appendChild(cloudRow);

    var acc = S.totalTried ? Math.round((S.totalCorrect / S.totalTried) * 100) : 0;
    rows.appendChild(el("div", "row static",
      'Верных ответов<span class="val">' + acc + "% из " + S.totalTried + "</span>"));
    rows.appendChild(el("div", "row static",
      'Ступень словаря<span class="val">' + (S.vocabLevel || 1) + " из " + V_LEVELS + "</span>"));
    var calRow = el("button", "row", 'Подобрать слова заново<span class="val">' +
      (S.calibrated ? "ступень " + (S.vocabLevel || 1) : "не проходилась") + "</span>");
    calRow.onclick = function () { go("/vocab/calibrate"); };
    rows.appendChild(calRow);

    var resetRow = el("button", "row danger", "Сбросить весь прогресс");
    resetRow.onclick = function () {
      if (!confirm("Сбросить весь прогресс? Действие необратимо.")) return;
      window.Sessions.clear(); dayClear();
      S = Store.mutate("reset", {});
      viewMore(); syncTabs();
    };
    rows.appendChild(resetRow);

    c.appendChild(rows);
    c.appendChild(el("h2", null, "Резервные копии"));
    c.appendChild(el("div", "muted", "JSON переносит прогресс, черновики занятий и незавершенные сессии слов и ошибок. Импорт заменяет текущий прогресс после проверки. Исходное хранилище можно скачать для восстановления поврежденных данных."));
    var copies = el("div", "btnrow");
    var showButton = el("button", "btn", "Показать прогресс текстом"); showButton.onclick = function () { showBackup(Store.exportBackup()); };
    var exportButton = el("button", "btn sec", "Скачать резервную копию"); exportButton.onclick = function () { var text = Store.exportBackup(); showBackup(text); download(text, "deutsch-progress.json"); };
    var rawButton = el("button", "btn sec", "Скачать исходное хранилище"); rawButton.onclick = function () { var text = Store.exportRaw(); showBackup(text); download(text, "deutsch-storage-original.json"); };
    var retryButton = el("button", "btn sec", "Повторить сохранение"); retryButton.onclick = function () { Store.flush(); window.Practice.flush(); window.Sessions.flush(); };
    copies.appendChild(showButton); copies.appendChild(exportButton); copies.appendChild(rawButton); copies.appendChild(retryButton); c.appendChild(copies);
    var rejected = Object.keys(S.deletedExercises || {});
    if (rejected.length) {
      var reportButton = el("button", "btn sec", "Скачать замечания к заданиям (" + rejected.length + ")");
      reportButton.onclick = function () {
        var report = { kind: "deutsch-exercise-feedback", exercises: rejected.map(function (id) {
          var entry = S.deletedExercises[id];
          return { id: id, type: entry.ex.type, reason: entry.reason, exercise: entry.ex };
        }) };
        var text = JSON.stringify(report, null, 2);
        showBackup(text); outputLabel.textContent = "Замечания к заданиям";
        copyMessage.textContent = "Передай этот файл в чат для чистки исходных уроков и обновления правил новых заданий. Это не резервная копия прогресса.";
        download(text, "deutsch-exercise-feedback.json");
      };
      copies.appendChild(reportButton);
    }
    var output = el("div"); output.hidden = true;
    var outputLabel = el("label", null, "Текст резервной копии"); outputLabel.htmlFor = "backup-export"; output.appendChild(outputLabel);
    var exportText = document.createElement("textarea"); exportText.id = "backup-export"; exportText.className = "backup-text"; exportText.readOnly = true; exportText.spellcheck = false; output.appendChild(exportText);
    var copyButton = el("button", "btn", "Копировать весь текст"); output.appendChild(copyButton);
    var copyMessage = el("div", "note"); copyMessage.setAttribute("role", "status"); output.appendChild(copyMessage); c.appendChild(output);
    function showBackup(text) {
      outputLabel.textContent = "Текст резервной копии";
      exportText.value = text; output.hidden = false;
      copyMessage.textContent = "Если скачивание недоступно, скопируйте весь текст и сохраните в заметках. Для переноса вставьте его в поле импорта на другом устройстве.";
    }
    function selectBackup() {
      exportText.focus(); exportText.select(); exportText.setSelectionRange(0, exportText.value.length);
      copyMessage.textContent = "Текст выделен. Нажмите на него и выберите «Скопировать» в меню телефона.";
    }
    copyButton.onclick = function () {
      if (!navigator.clipboard || !navigator.clipboard.writeText) { selectBackup(); return; }
      try {
        navigator.clipboard.writeText(exportText.value).then(function () {
          copyMessage.textContent = "Резервная копия скопирована. Сохраните её в заметках или вставьте в поле импорта на другом устройстве.";
        }, selectBackup);
      } catch (error) { selectBackup(); }
    };
    var label = el("label", null, "Вставьте JSON резервной копии"); label.htmlFor = "backup-json"; c.appendChild(label);
    var textarea = document.createElement("textarea"); textarea.id = "backup-json"; textarea.className = "backup-text"; textarea.maxLength = 10000000; c.appendChild(textarea);
    var message = el("div", "note"); message.setAttribute("role", "status"); message.hidden = true; c.appendChild(message);
    var importButton = el("button", "btn sec", "Проверить и импортировать");
    importButton.onclick = function () {
      try {
        var parsed = JSON.parse(textarea.value); window.ProgressData.object(parsed);
        if (parsed.kind === "de-b1-backup" && parsed.version != null && [1, 2].indexOf(parsed.version) < 0) throw new Error("Неизвестная версия резервной копии. Прогресс не изменен.");
        window.ProgressData.state(parsed.kind === "de-b1-backup" ? parsed.state : parsed);
        if (parsed.drafts) window.Practice.validateImport(parsed.drafts);
        window.Sessions.validateImport(parsed.sessions || {});
        if (!confirm("Заменить текущий прогресс резервной копией? Сначала сохраните текущий JSON файлом или текстом.")) return;
        S = Store.importBackup(textarea.value); message.textContent = "Резервная копия восстановлена.";
      } catch (error) { message.textContent = "Файл не прошел проверку. Текущий прогресс не изменен."; }
      message.hidden = false;
    }; c.appendChild(importButton);
    var attempts = (S.attempts || []).slice(-20).reverse();
    if (attempts.length) {
      c.appendChild(el("h2", null, "История попыток"));
      attempts.forEach(function (attempt) {
        var details = document.createElement("details");
        details.appendChild(el("summary", null, "Урок " + attempt.n + ", день " + (attempt.di + 1) + ": " + attempt.score + "/" + attempt.of + (attempt.manual ? ", засчитан вручную" : attempt.partial ? ", с пропусками" : "")));
        details.appendChild(el("div", "muted", new Date(attempt.at).toLocaleString("ru") + ". С теорией: " + (attempt.hints || 0) + ". Без подтвержденной оценки: " + (attempt.uncertain || 0) + "."));
        (attempt.records || []).forEach(function (record, index) {
          if (!record || !record.result || (S.deletedExercises || {})[dayKey(attempt.n, attempt.di) + "-" + index]) return;
          var draft = record.draft || {}, values = draft.values || draft.words;
          var input = values ? values.map(function (value) { return value || "∅"; }).join(" / ") : draft.choice != null ? "вариант " + (draft.choice + 1) : draft.solved ? "соединено пар: " + draft.solved.length : "ответ не записан в старом формате";
          var result = record.result.ok ? "верно" : record.result.verdict === "needs-review" ? "нужна проверка смысла" : "ошибка";
          details.appendChild(el("div", "muted", esc((index + 1) + ". " + input + " - " + result + (record.result.usedHint ? ", с теорией" : ""))));
        });
        c.appendChild(details);
      });
    }
    app.appendChild(c);
  }
  function download(text, name) {
    var url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    var link = document.createElement("a"); link.href = url; link.download = name; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var V_LEVELS = 5;
  var training = window.VocabTraining.create({
    store: Store, sessions: window.Sessions, config: window.SRS_CONFIG, course: window.COURSE,
    lesson: function (n) { return window["L" + n]; }, words: window.VOCAB || [], shuffle: E.shuffle,
    nextLesson: findNext, day: function () { return window.ProgressData.day(new Date()); }
  });
  var phraseTraining = window.PhraseTraining.create({ store: Store, sessions: window.Sessions,
    day: function () { return window.ProgressData.day(new Date()); } });
  function viewPhrases(mode) {
    if (Store.blocked()) return viewMore();
    working = true;
    if (!mode) {
      var saved = window.Sessions.load("phrases");
      mode = saved && saved.mode === "repeat" ? "repeat" : "train";
    }
    disposeVocab = window.PhraseView.mount(app, mode, { training: phraseTraining,
      go: function (path) { if (curPath() === path) route(); else go(path); },
      showResult: showResultLayout, context: tutorContext });
  }
  function vocabBar(stats, loading) { return window.VocabView.bar(stats, loading); }
  function viewVocab(mode) {
    if (Store.blocked()) return viewMore();
    working = true;
    var view = routeId;
    disposeVocab = window.VocabView.mount(app, mode, { training: training, active: function () { return view === routeId; },
      syncTabs: syncTabs, go: function (path) { if (curPath() === path) route(); else go(path); },
      showResult: showResultLayout, context: tutorContext });
  }
  var DAY_KEY = "de-b1-day-v1";


  function dayClear() { window.Practice.clear(); try { localStorage.removeItem(DAY_KEY); } catch (e) {} }
  function dayLoad(n, di) {
    var L = window["L" + n];
    return L && L.days[di] ? window.Practice.load(n, di, L.days[di].ex) : null;
  }

  function vocabWhen(key) {
    var v = Store.vocabSchedule(S.vocab, key.slice(0, -3));
    if (!v) return "новое слово";
    if (v.learned) return "закрыто";
    if (v.pairRu) return "½ интервала · осталось немецкий → русский";
    var distance = v.due - Date.now();
    if (distance > 0 && distance < 3600e3) return "через " + Math.ceil(distance / 60000) + " мин.";
    if (distance >= 3600e3 && distance < 864e5) return "через " + Math.ceil(distance / 3600e3) + " ч.";
    var d = Math.ceil(distance / 864e5);
    if (d <= 0) return "снова сегодня";
    if (d === 1) return "через день";
    if (d < 5) return "через " + d + " дня";
    if (d < 31) return "через " + d + " дней";
    return "через месяц";
  }

  /* ---------- предупреждение о сохранении ----------
     Вся механика в js/sync.js. Здесь только показ ошибки хранилища. */
  Store.onStatus(function () {
    var warning = document.getElementById("storage-warning");
    if (warning) { var text = Store.storageError(); warning.hidden = !text; warning.querySelector("span").textContent = text; }
  });

  route();
  Store.start();
  window.AppUpdates.start();
  window.Cloud.start();
})();
