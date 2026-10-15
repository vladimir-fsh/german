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
  var working = false, routeId = 0, disposeCloud = null, disposeUpdates = null;

  Store.onChange(function (next) {
    S = next;
    if (redrawable()) route();
    syncTabs();
  });

  /* Перерисовывать можно там, где нет незавершённого прохода: экран задания
     или карточки пересобирать нельзя, иначе ответ пропадёт на полуслове.
     Списки и главная перерисовываются всегда — именно на них видно прогресс. */
  /* Текущий маршрут. Всё, что не похоже на наш маршрут, считается главной. */
  var ROUTE_RE = /^\/(vocab(\/(new|repeat|calibrate))?|review|more(\/cloud)?|l\d+(\/(g|d)\d+)?)?$/;
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
  function srsAdd(id, ex, n) { S = Store.mutate("srsAdd", { id: id, ex: ex, n: n }); }
  function srsDue() {
    var now = Date.now(), out = [];
    for (var k in S.srs) if (S.srs[k].due <= now) out.push({ id: k, r: S.srs[k] });
    return out;
  }

  /* ---------- маршруты ---------- */
  function go(hash) { location.hash = hash; }
  window.addEventListener("hashchange", route);

  function route() {
    if (disposeUpdates) { disposeUpdates(); disposeUpdates = null; }
    if (disposeCloud) { disposeCloud(); disposeCloud = null; }
    routeId++; working = false; document.onkeydown = null;
    var h = curPath();
    var m;
    window.scrollTo(0, 0);
    window.onresize = null;
    app.classList.remove("tight", "result-screen");
    syncTabs();
    if (h === "/") return viewHome();
    if (h === "/review") return viewReview();
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
    var words = vocabPending();
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

    var ws = vocabWordStats();
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
    var canStartNew = vocabPlan("new").length > 0;
    var vb = el("button", "btn" + (words && S.calibrated ? "" : " sec"),
      loading ? "Подтягиваю прогресс…" : words ? "Учить слова (" + words + ")" : canStartNew ? "Начать новые карточки" : "Повторы будут позже");
    vb.disabled = loading || (!words && !canStartNew);
    vb.onclick = function () { go(words ? "/vocab" : "/vocab/new"); };
    vrow.appendChild(vb);
    var rep0 = loading ? 0 : vocabRepeatPending();
    if (rep0) {
      var vb2 = el("button", "btn sec", "Повторить слова (" + rep0 + ")");
      vb2.onclick = function () { go("/vocab/repeat"); };
      vrow.appendChild(vb2);
    }
    vcard.appendChild(vrow);
    app.appendChild(vcard);

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
    var view = routeId;
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
        if (det.open && i < list.length) { var record = run.records[i] || (run.records[i] = {}); record.usedHint = true; window.Practice.save(run); }
      }); head.appendChild(det);
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
    function count(record, index) {
      var token = run.id + ":" + index;
      if (!S.answered[token]) S = Store.mutate("answer", { ok: record.result.ok, verdict: record.result.verdict, attemptId: token });
    }
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
      if (head.querySelector("details[open]")) record.usedHint = true;
      answered = !!record.result;
      var visible = list.map(function (ex, index) { return index; }).filter(function (index) { return !deleted(index); });
      var position = visible.indexOf(i);
      pl.querySelector(".cnt").textContent = (position + 1) + " / " + visible.length;
      pl.querySelector("i").style.width = Math.round(position / visible.length * 100) + "%";
      api = E.render(list[i], host, function (ok, result) {
        if (finished || view !== routeId || record !== run.records[i] || record.omitted || deleted(i)) return;
        if (!record.result) {
          record.result = result; window.Practice.save(run); count(record, i);
          if (!ok && result.verdict !== "needs-review") srsAdd("L" + n + "D" + di + "-" + i, list[i], n);
        }
        answered = true; check.style.display = "none"; next.style.display = ""; syncBar();
      }, {
        draft: record.draft, isHinted: function () { return record.usedHint; },
        onDraft: function (draft) { if (record.omitted || record !== run.records[i]) return; record.draft = draft; window.Practice.save(run); }
      });
      if (api.result && !record.result) { record.result = api.result; window.Practice.save(run); }
      answered = !!record.result;
      if (record.result) count(record, i);
      check.style.display = !answered && api.check ? "" : "none";
      next.style.display = answered ? "" : "none"; syncBar();
    }
    check.onclick = function () { if (api && api.check && !answered) api.check(); };
    next.onclick = function () { if (!answered || finished || view !== routeId) return; run.i = ++i; window.Practice.save(run); step(); };
    document.onkeydown = function (event) { if (event.key === "Enter" && answered) { event.preventDefault(); next.click(); } };
    /* manual — день засчитан кнопкой: результат считается только по сохранённым
       ответам, задания без ответа не идут в «не совпали» */
    function done(manual) {
      if (finished) return; finished = true; working = false; document.onkeydown = null;
      var stats = window.Practice.stats(run), of = stats.answered;
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
    function count(record) {
      var grade = window.ReviewPlan.grade(run, i, record.result);
      if (!S.answered[grade.attemptId]) S = Store.mutate("reviewAnswer", grade);
    }
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
      if (!record.result && record.draft && record.draft.result) record.result = record.draft.result;
      answered = !!record.result;
      pl.querySelector(".cnt").textContent = (i + 1) + " / " + run.items.length;
      pl.querySelector("i").style.width = Math.round(i / run.items.length * 100) + "%";
      api = E.render(run.items[i].ex, host, function (ok, result) {
        if (view !== routeId) return;
        if (!record.result) { record.result = result; stash(); }
        count(record); answered = true;
        check.style.display = "none"; next.style.display = ""; syncBar();
      }, { draft: record.draft, onDraft: function (draft) { record.draft = draft; stash(); } });
      if (api.result && !record.result) { record.result = api.result; stash(); }
      answered = !!record.result;
      if (record.result) count(record);
      check.style.display = !answered && api.check ? "" : "none"; next.style.display = answered ? "" : "none"; syncBar();
    }
    check.onclick = function () { if (api && api.check && !answered) api.check(); };
    next.onclick = function () { if (!answered || view !== routeId) return; i++; stash(); step(); };
    document.onkeydown = function (event) { if (event.key === "Enter" && answered) { event.preventDefault(); next.click(); } };
    step();
  }

  /* ---------- нижние вкладки ---------- */
  var tabs = document.querySelectorAll(".tab");

  Array.prototype.forEach.call(tabs, function (b) {
    b.onclick = function () { go(b.getAttribute("data-go")); };
  });

  /* подсветка активной вкладки и счётчики на значках */
  function syncTabs() {
    var h = curPath();
    var root = h === "/" || /^\/l\d+/.test(h) ? "/"
      : h.indexOf("/vocab") === 0 ? "/vocab"
      : h.indexOf("/review") === 0 ? "/review"
      : h.indexOf("/more") === 0 ? "/more" : "/";
    Array.prototype.forEach.call(tabs, function (b) {
      var mine = b.getAttribute("data-go");
      b.className = "tab" + (mine === root ? " on" : "");
      var badge = b.querySelector(".tbadge");
      if (!badge || mine === "/more") return;
      var n = mine === "/vocab" ? vocabPending() : srsDue().length;
      badge.textContent = n > 99 ? "99+" : n;
      badge.hidden = !n;
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

  /* ---------- карточки слов ----------
     Первый ответ меняет расписание через vocabWordReview. Повторы внутри
     сессии помогают извлечению, но не увеличивают интервал. Параметры
     короткого обучения и дневного лимита заданы в srs-config.js. */
  var CFG = window.SRS_CONFIG || {};
  var V_SESSION = CFG.sessionNew || 10;   /* потолок обычной сессии */
  var V_NEW = CFG.sessionNew || 10;       /* столько новых даёт добор по кнопке */

  var V_LEVELS = 5;

  /* слова уроков (f = 0, идут первыми) плюс общий словарь A2–B1 со группами словаря */
  function vocabPool() {
    var out = [];
    (window.COURSE.lessons || []).forEach(function (l) {
      if (l.status !== "ready") return;
      var L = window["L" + l.n];
      if (!L || !L.words) return;
      L.words.forEach(function (w) { out.push({ n: l.n, w: w, key: "L" + l.n + ":" + w.de, f: 0 }); });
    });
    (window.VOCAB || []).forEach(function (w) {
      out.push({ n: null, w: w, key: "V:" + (w.id || w.de), f: w.f || 1 });
    });
    return out;
  }

  /* Оба вида карточек нужны для восстановления сессий. Расписание общее. */
  function vocabCards() {
    var out = [];
    vocabPool().forEach(function (it) {
      out.push({ n: it.n, w: it.w, f: it.f, dir: "de", key: it.key + "|de" });
      out.push({ n: it.n, w: it.w, f: it.f, dir: "ru", key: it.key + "|ru" });
    });
    return out;
  }

  /* новые слова: сначала лексика урока, потом общий словарь — ближе всего
     к текущей группе словаря */
  function vocabSortFresh(fresh) {
    var lvl = S.vocabLevel || 1;
    return fresh.sort(function (a, b) {
      if ((a.f === 0) !== (b.f === 0)) return a.f === 0 ? -1 : 1;
      if (a.f === 0) return 0;
      var da = Math.abs(a.f - lvl), db = Math.abs(b.f - lvl);
      if (da !== db) return da - db;
      return a.f - b.f;
    });
  }

  function vocabSplit() {
    var now = Date.now(), due = [], fresh = [], learned = 0;
    vocabCards().forEach(function (it) {
      var v = window.Store.vocabSchedule(S.vocab, it.key.slice(0, -3));
      var dir = window.Store.vocabPaired(v) && v.pairRu ? "de" : "ru";
      if (it.dir !== dir) return;
      if (!v) {
        fresh.push(it);
        return;
      }
      if (v.learned) { learned++; return; }
      if ((v.due || 0) <= now) due.push(it);
    });
    due.sort(function (a, b) { return (vocabSchedule(a).due || 0) - (vocabSchedule(b).due || 0); });
    return { due: due, fresh: vocabSortFresh(fresh), learned: learned };
  }

  function vocabSchedule(it) { return window.Store.vocabSchedule(S.vocab, it.key.slice(0, -3)); }

  /* В начальную очередь попадает одна сторона слова.
     Вторая половина длинного интервала добавляется в конец после ответа. */
  function vocabOnePerWord(items, taken) {
    var out = [];
    items.forEach(function (it) {
      var base = it.key.slice(0, -3);   /* ключ без "|de" / "|ru" */
      if (taken[base]) return;
      taken[base] = true;
      out.push(it);
    });
    return out;
  }

  /* состав сессии: не больше десяти карточек за раз. Сначала то, что пора
     повторить, остаток добивается новыми словами. Когда повторять нечего —
     сессия целиком из новых, и добор идёт по кнопке.
     mode === "new" — добор десяти новых слов по запросу, без повторений. */
  function vocabNewRemaining() {
    var today = window.ProgressData.day(new Date()), introduced = {};
    Object.keys(S.vocab).forEach(function (key) {
      var v = S.vocab[key];
      if (v.introducedDay === today) introduced[key.slice(0, -3)] = true;
    });
    return Math.max(0, (CFG.maxNewPerDay || 10) - Object.keys(introduced).length);
  }

  function vocabPlan(mode) {
    var sp = vocabSplit(), taken = {}, budget = vocabNewRemaining();
    var due = mode === "new" ? [] : vocabOnePerWord(sp.due, taken).slice(0, V_SESSION);
    if (due.length >= V_SESSION || sp.due.length > (CFG.newBacklogLimit || 20)) return due;
    var current = findNext();
    var fresh = vocabOnePerWord(sp.fresh, taken).filter(function (it) {
      var started = S.vocab[it.key.slice(0, -3) + "|de"] || S.vocab[it.key.slice(0, -3) + "|ru"];
      if (started) return true;
      if (it.n && current && it.n > current.n) return false;
      if (budget <= 0) return false;
      budget--; return true;
    }).slice(0, mode === "new" ? V_NEW : V_SESSION - due.length);
    return due.concat(fresh);
  }

  /* Повторение: только то, чему пришёл срок. Промах уже назначил слову свой
     интервал, поэтому отдельного списка «свежие ошибки» нет.
     Порядок: короткий интервал вперёд, при равных — что свежее, затем что
     просрочено дольше. Потолок сессии — 20 слов. */
  var V_REPEAT = CFG.sessionRepeat || 20;
  function vocabRepeatPlan() {
    var pool = vocabSplit().due, taken = {};
    pool.sort(function (a, b) {
      var va = vocabSchedule(a), vb = vocabSchedule(b);
      if ((va.iv || 0) !== (vb.iv || 0)) return (va.iv || 0) - (vb.iv || 0);
      if ((vb.t || 0) !== (va.t || 0)) return (vb.t || 0) - (va.t || 0);
      return (va.due || 0) - (vb.due || 0);
    });
    return vocabOnePerWord(pool, taken).slice(0, V_REPEAT);
  }

  function vocabRepeatPending() { return vocabRepeatPlan().length; }

  /* Калибровка: по четыре незнакомых слова из каждой группы словаря.
     Ответы не влияют на расписание — знакомое сразу закрывается, незнакомое
     остаётся нетронутым. По долям знакомого выставляется стартовая ступень. */
  var CALIB_PER_LEVEL = 4;

  function vocabCalibPlan() {
    var out = [];
    for (var lvl = 1; lvl <= V_LEVELS; lvl++) {
      var bucket = [];
      (window.VOCAB || []).forEach(function (w) {
        if ((w.f || 1) !== lvl) return;
        var base = "V:" + (w.id || w.de), key = base + "|ru";
        if (window.Store.vocabSchedule(S.vocab, base)) return;
        bucket.push({ n: null, w: w, f: w.f, dir: "ru", key: key });
      });
      out = out.concat(E.shuffle(bucket).slice(0, CALIB_PER_LEVEL));
    }
    return out;
  }

  function vocabSession(mode) {
    if (mode === "repeat") return E.shuffle(vocabRepeatPlan());
    if (mode === "calib") return vocabCalibPlan();   /* порядок от простого к редкому */
    return E.shuffle(vocabPlan(mode));
  }

  /* Незакрытая сессия переживает перезагрузку: очередь, позиция, счётчик
     и слова, которые ещё надо прокрутить, лежат на диске.
     Хранится отдельно от прогресса и не синхронизируется — это состояние
     конкретной вкладки, а не то, что ты выучил. */
  var DAY_KEY = "de-b1-day-v1";


  function dayClear() { window.Practice.clear(); try { localStorage.removeItem(DAY_KEY); } catch (e) {} }
  function dayLoad(n, di) {
    var L = window["L" + n];
    return L && L.days[di] ? window.Practice.load(n, di, L.days[di].ex) : null;
  }

  function sessionLoad() {
    var raw = window.Sessions.load("vocab");
    return raw && raw.i < raw.keys.length ? raw : null;
  }
  function sessionSave(st) { window.Sessions.save("vocab", st); }
  function sessionClear() { window.Sessions.clear("vocab"); }

  /* если новые слова уходят с первого раза — берём следующую порцию реже
     встречающихся; если сыплешься — возвращаемся к более ходовым */
  function vocabTuneLevel(seen, known) {
    if (seen < 4) return null;
    var lvl = S.vocabLevel || 1, share = known / seen, moved = null;
    if (share >= 0.7 && lvl < V_LEVELS) { lvl++; moved = "up"; }
    else if (share <= 0.3 && lvl > 1) { lvl--; moved = "down"; }
    if (moved) S = Store.mutate("vocabLevel", { level: lvl });
    return moved;
  }

  function vocabPending() { return vocabPlan().length; }

  /* firstTry === false — ответ-повтор внутри сессии, расписание не трогаем */
  function vocabGrade(it, ok, firstTry, expectedDue) {
    if (firstTry) S = Store.mutate("vocabWordReview", { key: it.key, ok: ok, expectedDue: expectedDue, day: window.ProgressData.day(new Date()) });
  }

  /* Закрытые ранее слова включают самооценку, поэтому это не доказанное знание. */
  function vocabWordStats() {
    var pool = vocabPool(), learned = 0, started = 0;
    pool.forEach(function (it) {
      var v = Store.vocabSchedule(S.vocab, it.key);
      if (v && v.learned) learned++;
      else if (v) started++;
    });
    return { total: pool.length, learned: learned, started: started };
  }

  function vocabBar(ws, loading) {
    var pct = ws.total ? Math.round((ws.learned / ws.total) * 100) : 0;
    function v(x) { return loading ? "—" : x; }
    return '<div class="bar"><i style="width:' + (loading ? 0 : pct) + '%"></i></div>' +
      '<div class="stats">' +
      '<div class="stat"><b>' + v(ws.learned) + "</b><span>закрыто</span></div>" +
      '<div class="stat"><b>' + v(ws.started) + "</b><span>в работе</span></div>" +
      '<div class="stat"><b>' + v(ws.total - ws.learned - ws.started) + "</b><span>не начато</span></div>" +
      '<div class="stat"><b>' + (loading ? "—" : pct + "%") + "</b><span>словаря</span></div>" +
      "</div>";
  }

  function vocabWhen(key) {
    var v = Store.vocabSchedule(S.vocab, key.slice(0, -3));
    if (!v) return "новое слово";
    if (v.learned) return "закрыто";
    if (v.pairRu) return "½ интервала · осталось немецкий → русский";
    var distance = v.due - Date.now();
    if (distance > 0 && distance < 3600e3) return "через " + Math.ceil(distance / 60000) + " мин.";
    var d = Math.ceil(distance / 864e5);
    if (d <= 0) return "снова сегодня";
    if (d === 1) return "через день";
    if (d < 5) return "через " + d + " дня";
    if (d < 31) return "через " + d + " дней";
    return "через месяц";
  }

  /* В старой сессии могли остаться независимые немецкие карточки.
     Выполненная часть сохраняется; оставшаяся получает актуальное направление. */
  function vocabResume(saved, byKey) {
    if (!saved || saved.policy === 2) return saved;
    saved = JSON.parse(JSON.stringify(saved));
    var keys = saved.keys.slice(0, saved.i), taken = {}, newKeys = [];
    saved.keys.slice(saved.i).forEach(function (key) {
      var base = key.slice(0, -3), v = Store.vocabSchedule(S.vocab, base);
      if (taken[base] || (v && v.learned)) return;
      taken[base] = true;
      var dir = Store.vocabPaired(v) && v.pairRu ? "de" : "ru";
      var next = base + "|" + dir;
      if (!byKey[next]) return;
      keys.push(next);
      if (!v) newKeys.push(next);
      if (key !== next && saved.first) delete saved.first[next];
    });
    saved.keys = keys; saved.newKeys = newKeys; saved.policy = 2;
    return saved;
  }

  /* ---------- экран карточек ---------- */
  function viewVocab(mode) {
    if (Store.blocked()) return viewMore();
    working = true;
    var byKey = {};
    vocabCards().forEach(function (c) { byKey[c.key] = c; });

    var calib = mode === "calib";
    var calibStat = {};   /* ступень → {показано, знакомо} */
    var saved = sessionLoad();
    if (saved && (saved.mode || "") !== (mode || "")) saved = null;
    saved = vocabResume(saved, byKey);
    if (saved) calibStat = saved.calibStat || {};
    var list, startI = 0, startDone = 0, startFirst = {}, startNewSeen = 0, startNewKnown = 0;

    if (saved) {
      /* продолжаем прерванную сессию */
      list = [];
      saved.keys.forEach(function (k) { if (byKey[k]) list.push(byKey[k]); });
      var newKeys = saved.newKeys || [];
      list.forEach(function (it) { it.isNew = newKeys.indexOf(it.key) >= 0; });
      startI = Math.min(saved.i || 0, list.length);
      startDone = saved.done || 0;
      startFirst = saved.first || {};
      startNewSeen = saved.newSeen || 0;
      startNewKnown = saved.newKnown || 0;
    } else {
      list = vocabSession(mode);
      list.forEach(function (it) { it.isNew = !vocabSchedule(it); });
    }

    app.innerHTML = "";

    if (!list.length) {
      var head = el("div", "card");
      head.innerHTML = '<div class="kicker">Словарь</div><h2>Карточки слов</h2>';
      app.appendChild(head);

      var sp = vocabSplit();
      var ws0 = vocabWordStats();
      head.appendChild(el("div", "muted", calib
        ? "Все слова словаря уже в работе — калибровать нечего."
        : mode === "repeat"
        ? "Повторять нечего: ни одному слову сейчас не подошёл срок."
        : sp.fresh.length
          ? "Всё, что пора повторить, пройдено. Можно взять новые слова."
          : "Слова кончились: весь словарь уже в работе."));
      head.insertAdjacentHTML("beforeend", vocabBar(ws0));
      head.appendChild(el("div", "note", "Новых слов можно начать сегодня: " + vocabNewRemaining() + ". Сначала повторите просроченные карточки."));
      var r0 = el("div", "btnrow");
      if (vocabPlan("new").length) {
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

    var total = list.length;
    var doneCnt = startDone;
    var firstAnswered = startFirst;   /* key → на этом слове уже был первый ответ */
    var newSeen = startNewSeen, newKnown = startNewKnown;   /* статистика по новым словам сессии */

    function stash() {
      sessionSave({
        at: Date.now(), policy: 2, mode: mode || "", i: i, done: doneCnt,
        keys: list.map(function (it) { return it.key; }),
        newKeys: list.filter(function (it) { return it.isNew; }).map(function (it) { return it.key; }),
        first: firstAnswered, newSeen: newSeen, newKnown: newKnown, peeked: peeked, calibStat: calibStat
      });
    }

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

    /* высота ровно по окну: ни вертикальной полосы, ни прыжков адресной строки */
    function fitScreen() {
      card.style.height = "auto";
      var top = card.getBoundingClientRect().top;
      var bar = document.getElementById("tabbar");
      var barH = bar ? bar.offsetHeight : 0;
      card.style.height = Math.max(280, window.innerHeight - top - barH - 12) + "px";
    }
    fitScreen();
    window.onresize = fitScreen;

    var i = startI, revealed = false, busy = false, view = routeId, expectedDue = 0;

    var peeked = false, lastAnswer = null;
    var undoButton = el('button', 'btn sec vundo', 'Вернуть предыдущее');
    undoButton.disabled = true;
    card.appendChild(undoButton);
    function wordEntries(key) {
      var entries = {};
      ['|ru', '|de'].forEach(function (dir) { entries[key + dir] = S.vocab[key + dir] || null; });
      return JSON.parse(JSON.stringify(entries));
    }
    function rememberAnswer() {
      var key = list[i].key.slice(0, -3);
      lastAnswer = {
        list: list.slice(), i: i, done: doneCnt, total: total,
        first: JSON.parse(JSON.stringify(firstAnswered)), newSeen: newSeen, newKnown: newKnown,
        calibStat: JSON.parse(JSON.stringify(calibStat)), peeked: peeked,
        op: { key: key, before: wordEntries(key), beforeLevel: S.vocabLevel || 1, beforeCalibrated: !!S.calibrated }
      };
    }
    function rememberResult() {
      if (!lastAnswer) return;
      lastAnswer.op.after = wordEntries(lastAnswer.op.key);
      lastAnswer.op.afterLevel = S.vocabLevel || 1;
      lastAnswer.op.afterCalibrated = !!S.calibrated;
    }
    undoButton.onclick = function () {
      if (busy || !lastAnswer) return;
      var previous = lastAnswer;
      S = Store.mutate('vocabUndo', previous.op);
      if (JSON.stringify(wordEntries(previous.op.key)) !== JSON.stringify(previous.op.before)) {
        undoButton.textContent = 'Слово уже изменено на другом устройстве';
        undoButton.disabled = true;
        lastAnswer = null;
        return;
      }
      list = previous.list; i = previous.i; doneCnt = previous.done; total = previous.total;
      firstAnswered = previous.first; newSeen = previous.newSeen; newKnown = previous.newKnown;
      calibStat = previous.calibStat;
      lastAnswer = null;
      app.innerHTML = '';
      app.classList.remove('result-screen'); app.classList.add('tight');
      app.appendChild(card); card.appendChild(undoButton);
      window.onresize = fitScreen;
      step();
      peeked = previous.peeked;
      if (peeked) { revealed = true; host.querySelector('.vflip').classList.add('flipped'); }
      undoButton.disabled = true;
      undoButton.textContent = 'Вернуть предыдущее';
      stash(); syncTabs();
    };

    var finishGesture = null;
    /* Ответ и позиция сохраняются до эффекта, следующий свайп блокируется. */
    function advance(source, ok, schedule) {
      busy = true;
      rememberResult();
      undoButton.disabled = true;
      if (finishGesture) finishGesture(source === "known-swipe" || (calib && ok) ? "known" : ok ? "good" : "bad", schedule);
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(function () {
        if (view !== routeId) return;
        busy = false;
        undoButton.disabled = false;
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
      if (i >= list.length) return finish();
      var it = list[i];
      revealed = false;
      var schedule = vocabSchedule(it), paired = Store.vocabPaired(schedule);
      expectedDue = schedule ? schedule.due || 0 : 0;
      intervalProgress.textContent = calib ? "Русский → немецкий" : paired
        ? "Интервал: " + (schedule.pairRu ? "½" : "0") + " из 1 · " + (it.dir === "ru" ? "русский → немецкий" : "немецкий → русский")
        : it.dir === "ru" ? "Русский → немецкий" : "Немецкий → русский";

      pl.querySelector(".cnt").textContent = doneCnt + " / " + total;
      pl.querySelector("i").style.width = Math.round((doneCnt / total) * 100) + "%";

      host.innerHTML = "";
      var stage = el("div", "vstage");
      var deck = el("div", "vdeck");

      var slot = el("div", "vslot vtop");
      var drag = el("div", "vdrag");
      var flip = el("div", "vflip");
      flip.appendChild(faceFront(it));
      flip.appendChild(faceBack(it));
      drag.appendChild(flip);
      slot.appendChild(drag);
      deck.appendChild(slot);

      stage.appendChild(deck);
      host.appendChild(stage);
      fitScreen();

      bindCard(drag, flip);

      peeked = !!(saved && saved.i === i && saved.peeked);
      saved = null;
    }

    /* Отпускание сохраняет ответ; рамка получает фактическое расписание. */
    function bindCard(drag, flip) {
      var x0 = 0, y0 = 0, dx = 0, dy = 0, pointer = null, axis = "", locked = false, moved = false;
      var lastX = 0, lastT = 0, vx = 0, scrollBody = null, scrollStart = 0;
      var W = Math.max(46, Math.min(90, window.innerWidth * 0.18));
      var UP = Math.max(70, Math.min(120, window.innerHeight * 0.12));
      var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function reset() {
        drag.classList.remove("held");
        drag.style.transition = reduced ? "none" : "transform .28s cubic-bezier(.2,.8,.3,1)";
        drag.style.transform = "";
      }
      finishGesture = function (kind, schedule) {
        var direction = kind === "bad" ? -1 : 1;
        window.VocabFrames.update(drag, schedule);
        drag.classList.remove("held");
        drag.classList.add("vcommit-" + kind);
        /* На время эффекта остаёмся в точке отпускания, без возврата к центру. */
        if (!reduced) setTimeout(function () {
          if (view !== routeId) return;
          drag.style.transition = "transform .24s ease-in, opacity .24s ease-in";
          drag.style.transform = "translate(" + (kind === "known" ? 0 : direction * 170) + "px," + (kind === "known" ? -180 : -8) + "px) rotate(" + (kind === "known" ? 0 : direction * 8) + "deg) scale(.92)";
          drag.style.opacity = 0;
        }, 210);
      };

      drag.addEventListener("pointerdown", function (e) {
        if (busy || pointer !== null || e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
        scrollBody = flip.classList && flip.classList.contains('flipped') ? flip.querySelector('.vback .vinner') : null;
        if (scrollBody && scrollBody.scrollHeight <= scrollBody.clientHeight + 1) scrollBody = null;
        scrollStart = scrollBody ? scrollBody.scrollTop : 0;
        pointer = e.pointerId;
        axis = ""; locked = false; moved = false; dx = 0; dy = 0; vx = 0;
        x0 = lastX = e.clientX; y0 = e.clientY; lastT = Date.now();
        try { drag.setPointerCapture(pointer); } catch (err) {}
        drag.style.transition = "none";
        drag.classList.add("held");
      });
      drag.addEventListener("pointermove", function (e) {
        if (pointer !== e.pointerId || busy) return;
        dx = e.clientX - x0; dy = e.clientY - y0;
        if (!locked) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? "y" : "x";
          if (Math.max(Math.abs(dx), Math.abs(dy)) >= 40) locked = true;
        }
        moved = true;
        if (axis === 'y' && scrollBody) {
          scrollBody.scrollTop = scrollStart - dy;
          return;
        }
        var now = Date.now(), dt = now - lastT;
        if (dt > 0) vx = (e.clientX - lastX) / dt;
        lastX = e.clientX; lastT = now;
        var vertical = axis === "y", allowed = !vertical || (!calib && dy < 0);
        var ox = vertical ? dx * .1 : Math.max(-120, Math.min(120, dx * .65));
        var oy = vertical ? (allowed ? Math.max(-110, dy * .65) : dy * .12) : dy * .12;
        drag.style.transform = reduced ? "" : "translate(" + ox + "px," + oy + "px) rotate(" + (vertical ? 0 : ox * .035) + "deg)";
      });
      function release(e) {
        if (pointer !== e.pointerId) return;
        pointer = null;
        if (busy || view !== routeId) return;
        drag.classList.remove("held");
        var cancelled = e.type !== "pointerup";
        if (moved && axis === 'y' && scrollBody) { reset(); return; }
        if (!cancelled && moved) {
          if (axis === "y" && !calib && dy <= -UP) { answerKnown("known-swipe"); return; }
          var flick = Date.now() - lastT < 100 && Math.abs(vx) > .5 && Math.abs(dx) > 24 && (vx > 0) === (dx > 0);
          if (axis === "x" && (Math.abs(dx) >= W || flick)) { answer(dx > 0, "swipe"); return; }
        }
        reset();
        if (!cancelled && !moved) flipCard();
      }
      drag.addEventListener("pointerup", release);
      drag.addEventListener("pointercancel", release);
      drag.addEventListener("lostpointercapture", release);
    }

    function flipCard() {
      if (busy || view !== routeId) return;
      var flip = host.querySelector(".vflip");
      if (!flip) return;
      revealed = true;
      peeked = true; stash();   /* Подсказка сохраняется при переходах и перезагрузке. */
      flip.classList.toggle("flipped");
    }

    /* «уже знаю»: слово закрывается целиком, обоими направлениями */
    function answerKnown(source) {
      if (busy || view !== routeId) return;
      if (peeked) { answer(true, "swipe"); return; }
      rememberAnswer();
      var it = list[i];
      var base = it.key.slice(0, -3);
      if (!firstAnswered[it.key] && it.isNew) { newSeen++; newKnown++; }
      firstAnswered[it.key] = true;
      if (calib) bumpCalib(it, true);
      S = Store.mutate("vocabKnown", { key: base });
      syncTabs();
      doneCnt++;
      i++; peeked = false;
      stash();
      advance(source, true, vocabSchedule(it));
    }

    function bumpCalib(it, known) {
      var lvl = it.f || 1;
      var st = calibStat[lvl] || (calibStat[lvl] = { shown: 0, known: 0 });
      st.shown++;
      if (known) st.known++;
    }

    function answer(ok, source) {
      if (busy || view !== routeId) return;
      if (calib && peeked) ok = false;
      rememberAnswer();
      var it = list[i];
      if (calib) {
        /* калибровка ничего не планирует: знакомое закрываем, незнакомое не трогаем */
        bumpCalib(it, ok);
        if (ok) S = Store.mutate("vocabKnown", { key: it.key.slice(0, -3) });
        doneCnt++;
        i++; peeked = false;
        stash();
        advance(source, ok, vocabSchedule(it));
        return;
      }
      var first = !firstAnswered[it.key];
      firstAnswered[it.key] = true;
      if (first && it.isNew) { newSeen++; if (ok) newKnown++; }
      vocabGrade(it, ok, first, expectedDue);
      var schedule = vocabSchedule(it);
      if (first && ok && it.dir === "ru" && Store.vocabPaired(schedule) && schedule.pairRu) {
        var other = byKey[it.key.slice(0, -3) + "|de"];
        if (!list.slice(i + 1).some(function (item) { return item.key === other.key; })) {
          /* Вторую половину проверяем в конце круга. */
          other.isNew = false;
          list.push(other); total++;
        }
      }
      syncTabs();
      if (ok) {
        doneCnt++;
        i++;
      } else {
        /* не вспомнил — слово уходит в конец очереди, то есть вернётся
           только после того, как пройден весь круг из десяти */
        list.splice(i, 1);
        list.push(it);
      }
      peeked = false;
      stash();
      advance(source, ok, schedule);
    }

    document.onkeydown = function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target && e.target.tagName)) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard(); }
      else if (e.key === "1") { e.preventDefault(); answer(true); }
      else if (e.key === "2") { e.preventDefault(); answer(false); }
    };

    function finish() {
      document.onkeydown = null;
      sessionClear();

      if (calib) return finishCalib();

      var moved = vocabTuneLevel(newSeen, newKnown);
      rememberResult();
      var sp = vocabSplit();
      app.innerHTML = "";
      var ws = vocabWordStats();
      showResultLayout();
      var c = el("div", "card hero result-card");
      var ending = total % 100 >= 11 && total % 100 <= 14 ? "карточек пройдено"
        : total % 10 === 1 ? "карточка пройдена" : total % 10 >= 2 && total % 10 <= 4 ? "карточки пройдены" : "карточек пройдено";
      c.innerHTML = '<div class="kicker">Сессия закрыта</div><h1>' + total + " " + ending + "</h1>" +
        '<div class="muted">Ступень словаря: ' + S.vocabLevel + " из " + V_LEVELS +
        (moved === "up" ? " — новые слова шли легко, дальше беру следующую группу словаря."
          : moved === "down" ? " — новые слова буксовали, возвращаюсь к предыдущей группе словаря." : "") +
        (sp.due.length ? "<br>Ждут повторения прямо сейчас: " + sp.due.length + "." : "") + "</div>" +
        vocabBar(ws);
      var r = el("div", "btnrow");
      var repLeft = vocabRepeatPending();
      if (repLeft) {
        var br = el("button", "btn", "Повторить слова (" + repLeft + ")");
        br.onclick = function () { sessionClear(); location.hash = "/vocab/repeat"; route(); };
        r.appendChild(br);
      }
      if (vocabPlan("new").length) {
        var bn2 = el("button", "btn" + (repLeft ? " sec" : ""), "Начать новые карточки");
        bn2.onclick = function () { sessionClear(); location.hash = "/vocab/new"; route(); };
        r.appendChild(bn2);
      }
      var b = el("button", "btn sec", "На главную");
      b.onclick = function () { go("/"); };
      r.appendChild(b);
      if (lastAnswer) r.appendChild(undoButton);
      c.appendChild(r);
      app.appendChild(c);
    }

    step();
    stash();

    /* Итог калибровки: ступень — самая высокая, где знакомо хотя бы половину,
       плюс одна сверху, чтобы было куда расти. */
    function finishCalib() {
      var lvl = 1, known = 0, shown = 0;
      for (var k = 1; k <= V_LEVELS; k++) {
        var st = calibStat[k];
        if (!st || !st.shown) continue;
        known += st.known; shown += st.shown;
        if (st.known / st.shown >= 0.5) lvl = k;
      }
      lvl = known ? Math.min(V_LEVELS, lvl + (known === shown ? 2 : 1)) : 1;
      S = Store.mutate("calibrate", { level: lvl });
      rememberResult();
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
        '<div class="muted">Знакомые слова закрыты сразу и в очередь не попадут — ' +
        "их " + known + " из " + shown + ".<br>Новые слова теперь берутся с этой ступени.</div>" +
        '<div class="muted" style="margin-top:10px">' + rows + "</div>";
      var r = el("div", "btnrow");
      var b = el("button", "btn", "Учить слова");
      b.onclick = function () { go("/vocab"); };
      var b2 = el("button", "btn sec", "На главную");
      b2.onclick = function () { go("/"); };
      r.appendChild(b); r.appendChild(b2);
      if (lastAnswer) r.appendChild(undoButton);
      c.appendChild(r);
      app.appendChild(c);
    }
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
