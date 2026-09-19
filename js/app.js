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

  Store.onChange(function (next) {
    S = next;
    /* перерисовываем только там, где нет незавершённого прохода */
    var h = location.hash.replace(/^#/, "") || "/";
    if (h === "/" || /^\/l\d+$/.test(h) || h === "/more") route();
    syncTabs();
  });

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
    var today = new Date().toISOString().slice(0, 10);
    if (S.lastDay === today) return;
    S = Store.mutate("touchDay", { day: today });
  }

  /* очередь повторения: id -> {box, due, ex, lesson} */
  function srsAdd(id, ex, n) { S = Store.mutate("srsAdd", { id: id, ex: ex, n: n }); }
  function srsHit(id, ok) { if (S.srs[id]) S = Store.mutate("srsHit", { id: id, ok: ok }); }
  function srsDue() {
    var now = Date.now(), out = [];
    for (var k in S.srs) if (S.srs[k].due <= now) out.push({ id: k, r: S.srs[k] });
    return out;
  }

  /* ---------- маршруты ---------- */
  function go(hash) { location.hash = hash; }
  window.addEventListener("hashchange", route);

  function route() {
    var h = location.hash.replace(/^#/, "") || "/";
    var m;
    window.scrollTo(0, 0);
    window.onresize = null;
    app.classList.remove("tight");
    syncTabs();
    if (h === "/") return viewHome();
    if (h === "/review") return viewReview();
    if (h === "/vocab") return viewVocab();
    if (h === "/vocab/new") return viewVocab("new");
    if (h === "/vocab/repeat") return viewVocab("repeat");
    if (h === "/vocab/calibrate") return viewVocab("calib");
    if (h === "/more") return viewMore();
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

    app.innerHTML = "";
    var hero = el("div", "card hero");
    hero.innerHTML =
      '<div class="kicker">' + esc(C.pace) + "</div>" +
      "<h1>" + esc(C.title) + "</h1>" +
      '<div class="muted">Курс собран на базе упражнений lehrerlenz.de, Lektionen 18–32. ' +
      "Готовые уроки идут по порядку; остальные подключаются по мере готовности.</div>" +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="stats">' +
      '<div class="stat"><b>' + doneDays + " / " + totalDays + "</b><span>дней пройдено</span></div>" +
      '<div class="stat"><b>' + S.streak + "</b><span>дней подряд</span></div>" +
      '<div class="stat"><b>' + acc + "%</b><span>верных ответов</span></div>" +
      '<div class="stat"><b>' + due + "</b><span>на повторение</span></div>" +
      '<div class="stat"><b>' + words + "</b><span>карточек на сегодня</span></div>" +
      "</div>";
    var row = el("div", "btnrow");
    var next = findNext();
    var b1 = el("button", "btn", next ? "Продолжить: урок " + next.n + ", день " + (next.d + 1) : "Все готовые уроки пройдены");
    b1.disabled = !next;
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
      '<div class="muted">Слово засчитывается выученным, когда прошло всю лестницу интервалов ' +
      "в обе стороны: и с немецкого, и на немецкий.</div>" + vocabBar(ws);
    if (!S.calibrated) {
      vcard.appendChild(el("div", "note",
        "Слова пока берутся с самой ходовой ступени, поэтому попадается лёгкое. " +
        "Калибровка проходит по четыре слова с каждой ступени: знакомое закрывается сразу, " +
        "а стартовый уровень выставляется по результату."));
    }

    var vrow = el("div", "btnrow");
    if (!S.calibrated) {
      var vbc = el("button", "btn", "Подобрать уровень");
      vbc.onclick = function () { go("/vocab/calibrate"); };
      vrow.appendChild(vbc);
    }
    var vb = el("button", "btn" + (words && S.calibrated ? "" : " sec"), words ? "Учить слова (" + words + ")" : "Взять 10 новых слов");
    vb.onclick = function () { go(words ? "/vocab" : "/vocab/new"); };
    vrow.appendChild(vb);
    var rep0 = vocabRepeatPending();
    if (rep0) {
      var vb2 = el("button", "btn sec", "Повторить слова (" + rep0 + ")");
      vb2.onclick = function () { go("/vocab/repeat"); };
      vrow.appendChild(vb2);
    }
    vcard.appendChild(vrow);
    app.appendChild(vcard);

    var list = el("div", "card");
    list.appendChild(el("h2", null, "Программа"));
    list.appendChild(el("div", "muted", "15 уроков от склонения прилагательных до свободной речи на уровне B1."));
    var holder = el("div", null);
    holder.style.marginTop = "14px";
    C.lessons.forEach(function (l) {
      var L = window["L" + l.n];
      var ok = l.status === "ready" && L;
      var pctL = ok ? lessonPct(l.n) : 0;
      var d = el("div", "lesson" + (pctL === 100 ? " done" : pctL > 0 ? " active" : ""));
      d.innerHTML =
        '<div class="num">' + l.n + "</div>" +
        "<div><div class=\"t\">" + esc(l.title) +
        (ok ? "" : '<span class="badge">скоро</span>') + "</div>" +
        '<div class="s">' + esc(l.ru) + "</div></div>" +
        '<div class="pct">' + (ok ? pctL + "%" : l.days + " дн.") + "</div>";
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
      var open = isDayDone(n, i) ? null : dayLoad(n, i);
      row.innerHTML =
        '<div class="tag">' + (isDayDone(n, i) ? "готово" : open ? "продолжить" : "день " + (i + 1)) + "</div>" +
        "<div><div style=\"font-weight:600\">" + esc(day.title) + "</div>" +
        '<div class="s muted">' + esc(day.sub || "") + " · " +
        (open ? "остановился на " + open.i + " из " + day.ex.length : day.ex.length + " заданий") +
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
        var a = S.vocab["L" + n + ":" + w.de + "|de"], b = S.vocab["L" + n + ":" + w.de + "|ru"];
        if (a && a.learned && b && b.learned) learnedN++;
      });
      wc.appendChild(el("div", "muted", L.words.length + " слов · выучено " + learnedN +
        " · карточки идут общей очередью со всем курсом"));
      var wl = el("div", "wordlist");
      L.words.forEach(function (w) {
        var line = el("div", null, "<b>" + esc(w.de) + "</b> — <span>" + esc(w.ru) +
          "</span><i>узнать: " + esc(vocabWhen("L" + n + ":" + w.de + "|de")) +
          " · вспомнить: " + esc(vocabWhen("L" + n + ":" + w.de + "|ru")) + "</i>");
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
    var L = window["L" + n];
    var day = L && L.days[di];
    if (!day) return go("/l" + n);
    var list = day.ex.slice();
    var saved = dayLoad(n, di);
    var i = saved ? Math.min(saved.i || 0, list.length - 1) : 0;
    var correct = saved ? (saved.correct || 0) : 0;
    app.innerHTML = "";

    var head = el("div", "card");
    head.innerHTML =
      '<div class="kicker">Lektion ' + n + " · День " + (di + 1) + "</div>" +
      "<h2>" + esc(day.title) + "</h2>" +
      (day.sub ? '<div class="muted">' + esc(day.sub) + "</div>" : "");
    if (day.grammar != null) {
      (Array.isArray(day.grammar) ? day.grammar : [day.grammar]).forEach(function (gi) {
        var g = L.grammar[gi];
        if (!g) return;
        var det = document.createElement("details");
        det.className = "theory";
        det.innerHTML = "<summary>Теория: " + esc(g.title) + '</summary><div class="gram">' + g.html + "</div>";
        head.appendChild(det);
      });
    }
    app.appendChild(head);

    var card = el("div", "card");
    var pl = el("div", "progline");
    pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>';
    card.appendChild(pl);
    var host = el("div", null);
    card.appendChild(host);
    var row = el("div", "btnrow sticky");
    var check = el("button", "btn", "Проверить");
    var next = el("button", "btn sec", "Дальше →");
    next.style.display = "none";
    /* нижняя панель прилипает к экрану телефона; без видимых кнопок прячем её */
    function syncBar() {
      var vis = check.style.display !== "none" || next.style.display !== "none";
      row.className = "btnrow sticky" + (vis ? "" : " empty");
    }
    row.appendChild(check); row.appendChild(next);
    card.appendChild(row);
    app.appendChild(card);

    var api = null, answered = false;

    function step() {
      answered = false;
      next.style.display = "none";
      check.style.display = "";
      check.disabled = false;
      pl.querySelector(".cnt").textContent = (i + 1) + " / " + list.length;
      pl.querySelector("i").style.width = Math.round((i / list.length) * 100) + "%";
      var ex = list[i];
      api = E.render(ex, host, function (ok) {
        answered = true;
        if (ok) correct++;
        S = Store.mutate("answer", { ok: ok });
        var id = "L" + n + "D" + di + "-" + i;
        if (!ok) srsAdd(id, ex, n);
        /* позиция в дне переживает перезагрузку: день засчитывается только
           на последнем задании, терять 14 ответов из 16 нельзя */
        daySave({ n: n, di: di, i: i + 1, correct: correct, at: Date.now() });
        check.style.display = "none";
        next.style.display = "";
        syncBar();
        next.focus();
      });
      check.style.display = api.check ? "" : "none";
      syncBar();
    }

    check.onclick = function () { if (api && api.check) api.check(); };
    next.onclick = function () {
      i++;
      if (i >= list.length) return done();
      step();
    };
    document.onkeydown = function (e) {
      if (e.key !== "Enter") return;
      if (answered) { e.preventDefault(); next.click(); }
    };

    function done() {
      document.onkeydown = null;
      dayClear();
      S = Store.mutate("dayDone", { n: n, di: di, score: correct, of: list.length });
      touchStreak();
      var pctD = Math.round((correct / list.length) * 100);
      app.innerHTML = "";
      var c = el("div", "card hero");
      c.innerHTML =
        '<div class="kicker">Lektion ' + n + " · День " + (di + 1) + " пройден</div>" +
        "<h1>" + correct + " из " + list.length + " верно</h1>" +
        '<div class="muted">' + (pctD >= 85 ? "Отличный результат. Можно идти дальше."
          : pctD >= 60 ? "Нормально. Ошибки попали в повторение — вернись к ним завтра."
            : "Слабовато. Перечитай теорию и пройди день ещё раз.") + "</div>";
      var row2 = el("div", "btnrow");
      var nx = findNext();
      if (nx) {
        var b1 = el("button", "btn", "Следующий день");
        b1.onclick = function () { go("/l" + nx.n + "/d" + nx.d); };
        row2.appendChild(b1);
      }
      var b2 = el("button", "btn sec", "Пройти день заново");
      b2.onclick = function () { dayClear(); viewDay(n, di); };
      var b3 = el("button", "btn sec", "К программе");
      b3.onclick = function () { go("/"); };
      row2.appendChild(b2); row2.appendChild(b3);
      c.appendChild(row2);
      app.appendChild(c);
    }

    step();
  }

  /* ---------- повторение ---------- */
  function viewReview() {
    var due = E.shuffle(srsDue());
    app.innerHTML = "";
    if (!due.length) {
      var c0 = el("div", "card hero");
      c0.innerHTML = "<h1>Нечего повторять</h1><div class=\"muted\">Ошибок в очереди нет. Возвращайся после новых заданий.</div>";
      var r0 = el("div", "btnrow");
      var bb = el("button", "btn", "К программе");
      bb.onclick = function () { go("/"); };
      r0.appendChild(bb); c0.appendChild(r0);
      app.appendChild(c0);
      return;
    }
    var i = 0;
    var card = el("div", "card");
    card.innerHTML = '<div class="kicker">Повторение ошибок</div>';
    var pl = el("div", "progline");
    pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>';
    card.appendChild(pl);
    var host = el("div", null);
    card.appendChild(host);
    var row = el("div", "btnrow sticky");
    var check = el("button", "btn", "Проверить");
    var next = el("button", "btn sec", "Дальше →");
    next.style.display = "none";
    /* нижняя панель прилипает к экрану телефона; без видимых кнопок прячем её */
    function syncBar() {
      var vis = check.style.display !== "none" || next.style.display !== "none";
      row.className = "btnrow sticky" + (vis ? "" : " empty");
    }
    row.appendChild(check); row.appendChild(next);
    card.appendChild(row);
    app.appendChild(card);
    var api = null, answered = false;

    function step() {
      answered = false;
      next.style.display = "none"; check.style.display = "";
      pl.querySelector(".cnt").textContent = (i + 1) + " / " + due.length;
      pl.querySelector("i").style.width = Math.round((i / due.length) * 100) + "%";
      var item = due[i];
      api = E.render(item.r.ex, host, function (ok) {
        answered = true;
        S = Store.mutate("answer", { ok: ok });
        srsHit(item.id, ok);
        check.style.display = "none"; next.style.display = ""; syncBar(); next.focus();
      });
      check.style.display = api.check ? "" : "none";
      syncBar();
    }
    check.onclick = function () { if (api && api.check) api.check(); };
    next.onclick = function () {
      i++;
      if (i >= due.length) { document.onkeydown = null; return go("/"); }
      step();
    };
    document.onkeydown = function (e) {
      if (e.key === "Enter" && answered) { e.preventDefault(); next.click(); }
    };
    step();
  }

  /* версия сборки — чтобы было видно, доехала ли до устройства свежая публикация */
  (function () {
    var e = document.getElementById("ver");
    if (e) e.textContent = window.APP_VERSION || "";
  })();

  /* ---------- нижние вкладки ---------- */
  var tabs = document.querySelectorAll(".tab");

  Array.prototype.forEach.call(tabs, function (b) {
    b.onclick = function () { go(b.getAttribute("data-go")); };
  });

  /* подсветка активной вкладки и счётчики на значках */
  function syncTabs() {
    var h = location.hash.replace(/^#/, "") || "/";
    var root = h === "/" || /^\/l\d+/.test(h) ? "/"
      : h.indexOf("/vocab") === 0 ? "/vocab"
      : h.indexOf("/review") === 0 ? "/review"
      : h.indexOf("/more") === 0 ? "/more" : "/";
    Array.prototype.forEach.call(tabs, function (b) {
      var mine = b.getAttribute("data-go");
      b.className = "tab" + (mine === root ? " on" : "");
      var badge = b.querySelector(".tbadge");
      if (!badge) return;
      var n = mine === "/vocab" ? vocabPending() : srsDue().length;
      badge.textContent = n > 99 ? "99+" : n;
      badge.hidden = !n;
    });
  }

  /* ---------- вкладка «Ещё» ---------- */
  function viewMore() {
    app.innerHTML = "";
    var c = el("div", "card");
    c.innerHTML = '<div class="kicker">Настройки</div><h2>Ещё</h2>';
    var rows = el("div", "rows");

    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var themeRow = el("button", "row",
      'Тёмная тема<span class="val">' + (dark ? "включена" : "выключена") + "</span>");
    themeRow.onclick = function () {
      var nextT = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextT);
      try { localStorage.setItem("de-theme", nextT); } catch (e) {}
      viewMore();
    };
    rows.appendChild(themeRow);

    rows.appendChild(el("div", "row static",
      'Синхронизация<span class="val sync" id="sync">' + esc(syncText || "только это устройство") + "</span>"));

    var acc = S.totalTried ? Math.round((S.totalCorrect / S.totalTried) * 100) : 0;
    rows.appendChild(el("div", "row static",
      'Верных ответов<span class="val">' + acc + "% из " + S.totalTried + "</span>"));
    rows.appendChild(el("div", "row static",
      'Ступень частотности<span class="val">' + (S.vocabLevel || 1) + " из " + V_LEVELS + "</span>"));
    var calRow = el("button", "row", 'Подобрать уровень заново<span class="val">' +
      (S.calibrated ? "ступень " + (S.vocabLevel || 1) : "не проходилась") + "</span>");
    calRow.onclick = function () { go("/vocab/calibrate"); };
    rows.appendChild(calRow);

    var resetRow = el("button", "row danger", "Сбросить весь прогресс");
    resetRow.onclick = function () {
      if (!confirm("Сбросить весь прогресс? Действие необратимо.")) return;
      sessionClear(); dayClear();
      S = Store.mutate("reset", {});
      viewMore(); syncTabs();
    };
    rows.appendChild(resetRow);

    c.appendChild(rows);
    app.appendChild(c);
  }
  try {
    var t = localStorage.getItem("de-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}

  /* ---------- карточки слов ----------
     Лестница интервалов: 1 → 3 → 7 → 14 → 30 дней. Верный ответ с первого
     раза поднимает на ступень; ответ на вершине (30 дней) закрывает слово
     совсем. «Не знаю» с первого раза опускает на ступень вниз, и дальнейшие
     ответы в этой же сессии на интервал уже не влияют — слово просто
     крутится в сессии, пока не вспомнится. */
  var VLADDER = Store.LADDER;
  var V_SESSION = 10;   /* потолок всей сессии */
  var V_NEW = 10;       /* столько новых даёт добор по кнопке */

  var V_LEVELS = 5;

  /* слова уроков (f = 0, идут первыми) плюс общий словарь A2–B1 со ступенями частотности */
  function vocabPool() {
    var out = [];
    (window.COURSE.lessons || []).forEach(function (l) {
      if (l.status !== "ready") return;
      var L = window["L" + l.n];
      if (!L || !L.words) return;
      L.words.forEach(function (w) { out.push({ n: l.n, w: w, key: "L" + l.n + ":" + w.de, f: 0 }); });
    });
    (window.VOCAB || []).forEach(function (w) {
      out.push({ n: null, w: w, key: "V:" + w.de, f: w.f || 1 });
    });
    return out;
  }

  /* каждое слово даёт две независимые карточки: узнавание и извлечение */
  function vocabCards() {
    var out = [];
    vocabPool().forEach(function (it) {
      out.push({ n: it.n, w: it.w, f: it.f, dir: "de", key: it.key + "|de" });
      out.push({ n: it.n, w: it.w, f: it.f, dir: "ru", key: it.key + "|ru" });
    });
    return out;
  }

  /* новые слова: сначала лексика урока, потом общий словарь — ближе всего
     к текущей ступени частотности */
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
      var v = S.vocab[it.key];
      if (!v) {
        /* обратное направление открывается только после того, как слово
           хотя бы раз узнал с немецкого — иначе вспоминать нечего */
        if (it.dir === "ru") {
          var base = S.vocab[it.key.slice(0, -3) + "|de"];
          if (!base || !(base.reps > 0)) return;
        }
        fresh.push(it);
        return;
      }
      if (v.learned) { learned++; return; }
      if ((v.due || 0) <= now) due.push(it);
    });
    due.sort(function (a, b) { return (S.vocab[a.key].due || 0) - (S.vocab[b.key].due || 0); });
    return { due: due, fresh: vocabSortFresh(fresh), learned: learned };
  }

  /* одно слово — одна карточка за сессию: узнавание и извлечение
     не должны идти подряд, иначе второе направление решается по памяти о первом */
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
  function vocabPlan(mode) {
    var sp = vocabSplit(), taken = {};
    if (mode === "new") return vocabOnePerWord(sp.fresh, taken).slice(0, V_NEW);
    var due = vocabOnePerWord(sp.due, taken).slice(0, V_SESSION);
    if (due.length >= V_SESSION) return due;
    var fresh = vocabOnePerWord(sp.fresh, taken).slice(0, V_SESSION - due.length);
    return due.concat(fresh);
  }

  /* Повторение: только то, чему пришёл срок. Промах уже назначил слову свой
     интервал, поэтому отдельного списка «свежие ошибки» нет.
     Порядок: короткий интервал вперёд, при равных — что свежее, затем что
     просрочено дольше. Потолок сессии — 20 слов. */
  var V_REPEAT = 20;

  function vocabRepeatPlan() {
    var now = Date.now(), pool = [], taken = {};
    vocabCards().forEach(function (it) {
      var v = S.vocab[it.key];
      if (!v || v.learned) return;
      if ((v.due || 0) <= now) pool.push(it);
    });
    pool.sort(function (a, b) {
      var va = S.vocab[a.key], vb = S.vocab[b.key];
      if ((va.iv || 0) !== (vb.iv || 0)) return (va.iv || 0) - (vb.iv || 0);
      if ((vb.t || 0) !== (va.t || 0)) return (vb.t || 0) - (va.t || 0);
      return (va.due || 0) - (vb.due || 0);
    });
    return vocabOnePerWord(pool, taken).slice(0, V_REPEAT);
  }

  function vocabRepeatPending() { return vocabRepeatPlan().length; }

  /* Калибровка: по четыре незнакомых слова с каждой ступени частотности.
     Ответы не влияют на расписание — знакомое сразу закрывается, незнакомое
     остаётся нетронутым. По долям знакомого выставляется стартовая ступень. */
  var CALIB_PER_LEVEL = 4;

  function vocabCalibPlan() {
    var out = [];
    for (var lvl = 1; lvl <= V_LEVELS; lvl++) {
      var bucket = [];
      (window.VOCAB || []).forEach(function (w) {
        if ((w.f || 1) !== lvl) return;
        if (S.vocab["V:" + w.de + "|de"]) return;
        bucket.push({ n: null, w: w, f: w.f, dir: "de", key: "V:" + w.de + "|de" });
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
  var SESSION_KEY = "de-b1-session-v1";
  var DAY_KEY = "de-b1-day-v1";
  var SESSION_TTL = 12 * 3600e3;

  function daySave(st) { try { localStorage.setItem(DAY_KEY, JSON.stringify(st)); } catch (e) {} }
  function dayClear() { try { localStorage.removeItem(DAY_KEY); } catch (e) {} }
  function dayLoad(n, di) {
    try {
      var raw = JSON.parse(localStorage.getItem(DAY_KEY));
      if (!raw || raw.n !== n || raw.di !== di) return null;
      if (Date.now() - (raw.at || 0) > SESSION_TTL) return null;
      return raw;
    } catch (e) { return null; }
  }

  function sessionLoad() {
    try {
      var raw = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (!raw || !raw.keys || Date.now() - (raw.at || 0) > SESSION_TTL) return null;
      if (raw.i >= raw.keys.length) return null;
      return raw;
    } catch (e) { return null; }
  }
  function sessionSave(st) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(st)); } catch (e) {} }
  function sessionClear() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

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
  function vocabGrade(it, ok, firstTry, fast) {
    if (firstTry) S = Store.mutate("vocabGrade", { key: it.key, ok: ok, fast: !!fast });
  }

  /* слово выучено, только когда оба направления прошли всю лестницу интервалов */
  function vocabWordStats() {
    var pool = vocabPool(), learned = 0, started = 0;
    pool.forEach(function (it) {
      var a = S.vocab[it.key + "|de"], b = S.vocab[it.key + "|ru"];
      if (a && a.learned && b && b.learned) learned++;
      else if (a || b) started++;
    });
    return { total: pool.length, learned: learned, started: started };
  }

  function vocabBar(ws) {
    var pct = ws.total ? Math.round((ws.learned / ws.total) * 100) : 0;
    return '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="stats">' +
      '<div class="stat"><b>' + ws.learned + "</b><span>выучено</span></div>" +
      '<div class="stat"><b>' + ws.started + "</b><span>в работе</span></div>" +
      '<div class="stat"><b>' + (ws.total - ws.learned - ws.started) + "</b><span>не начато</span></div>" +
      '<div class="stat"><b>' + pct + "%</b><span>словаря</span></div>" +
      "</div>";
  }

  function vocabWhen(key) {
    var v = S.vocab[key];
    if (!v) return "новое слово";
    if (v.learned) return "выучено";
    var d = Math.round((v.due - Date.now()) / 864e5);
    if (d <= 0) return "снова сегодня";
    if (d === 1) return "через день";
    if (d < 5) return "через " + d + " дня";
    if (d < 31) return "через " + d + " дней";
    return "через месяц";
  }

  /* ---------- экран карточек ---------- */
  function viewVocab(mode) {
    var byKey = {};
    vocabCards().forEach(function (c) { byKey[c.key] = c; });

    var calib = mode === "calib";
    var calibStat = {};   /* ступень → {показано, знакомо} */
    var saved = (mode === "new" || calib) ? null : sessionLoad();
    if (saved && (saved.mode || "") !== (mode || "")) saved = null;
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
      list.forEach(function (it) { it.isNew = !S.vocab[it.key]; });
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
      var r0 = el("div", "btnrow");
      if (sp.fresh.length) {
        var bn = el("button", "btn", "Взять 10 новых слов");
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
        at: Date.now(), mode: mode || "", i: i, done: doneCnt,
        keys: list.map(function (it) { return it.key; }),
        newKeys: list.filter(function (it) { return it.isNew; }).map(function (it) { return it.key; }),
        first: firstAnswered, newSeen: newSeen, newKnown: newKnown
      });
    }

    var card = el("div", "vscreen");
    var pl = el("div", "progline");
    pl.innerHTML = '<span class="cnt"></span><span class="bar"><i></i></span>';
    card.appendChild(pl);
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

    var i = startI, revealed = false, busy = false;

    /* Быстрый ответ — знак того, что слово уже знакомо: оно перескакивает
       ступеньку лестницы интервалов. Подсмотрел перевод — ответ быстрым
       не считается, это уже не «знал», а «узнал». */
    var FAST_MS = 2000;
    var shownAt = 0, peeked = false;

    function answeredFast() { return !peeked && (Date.now() - shownAt) <= FAST_MS; }

    function faceFront(it) {
      var f = el("div", "vface vfront");
      var inner = el("div", "vinner");
      inner.appendChild(el("div", "vword", esc(it.dir === "de" ? it.w.de : it.w.ru)));
      f.appendChild(inner);
      return f;
    }

    function faceBack(it) {
      var de2ru = it.dir === "de";
      var b = el("div", "vface vback");
      var inner = el("div", "vinner");
      inner.innerHTML = '<div class="vword vsmall">' + esc(de2ru ? it.w.ru : it.w.de) + "</div>" +
        (it.w.ex ? '<div class="vex">' + esc(it.w.ex) +
          (it.w.exru ? "<i>" + esc(it.w.exru) + "</i>" : "") + "</div>" : "") +
        (it.w.reg ? '<div class="vreg">' + esc(it.w.reg) + "</div>" : "");
      b.appendChild(inner);
      return b;
    }

    function step() {
      if (i >= list.length) return finish();
      var it = list[i];
      revealed = false;

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
      var tint = el("div", "vtint");
      drag.appendChild(flip); drag.appendChild(tint);
      slot.appendChild(drag);
      deck.appendChild(slot);

      stage.appendChild(deck);
      host.appendChild(stage);
      host.appendChild(el("div", "vlegend", calib
        ? '<span class="l">← не знаю</span><span class="r">знаю →</span>'
        : '<span class="l">← не помню</span>' +
          '<span class="u">↑ уже знаю</span>' +
          '<span class="r">знаю →</span>'));

      bindCard(drag, flip, tint);

      shownAt = Date.now();
      peeked = false;
    }

    /* Жесты и физика.
       Тап — переворот. Свайп вправо — «знаю», влево — «не помню».
       Угол наклона зависит от точки захвата: держишь карточку за низ —
       уводит в другую сторону, как настоящую бумагу вокруг опоры.
       За порогом ход сжимается (резина), при отпускании либо вылет со
       скоростью броска, либо возврат пружиной с лёгким перелётом. */
    function bindCard(drag, flip, tint) {
      var x0 = 0, y0 = 0, dx = 0, on = false, axis = "", axisLocked = false, moved = false;
      var lastX = 0, lastT = 0, vx = 0, dyLast = 0, anchor = 1;
      var W = Math.max(46, Math.min(90, window.innerWidth * 0.15));
      var UP = Math.max(70, Math.min(140, window.innerHeight * 0.12));   /* порог «уже знаю» */
      var LIMIT = W * 2.2;   /* дальше хода почти нет, карточка упирается */

      function damp(v) {
        var a = Math.abs(v);
        if (a <= LIMIT) return v;
        return (v < 0 ? -1 : 1) * (LIMIT + (a - LIMIT) * 0.32);
      }

      function paint(ox, oy, rot, lift) {
        drag.style.transform = "translate(" + ox.toFixed(1) + "px," + oy.toFixed(1) +
          "px) rotate(" + rot.toFixed(2) + "deg) scale(" + lift.toFixed(3) + ")";
      }

      drag.addEventListener("pointerdown", function (e) {
        if (busy) return;
        on = true; axis = ""; axisLocked = false; moved = false; dx = 0; vx = 0;
        x0 = e.clientX; y0 = e.clientY;
        lastX = e.clientX; lastT = Date.now();
        /* точка захвата: выше середины — поворот в сторону движения, ниже — против */
        var r = drag.getBoundingClientRect();
        anchor = e.clientY < r.top + r.height / 2 ? 1 : -1;
        try { drag.setPointerCapture(e.pointerId); } catch (err) {}
        drag.style.transition = "none";
        drag.classList.add("held");
      });

      drag.addEventListener("pointermove", function (e) {
        if (!on) return;
        dx = e.clientX - x0;
        var dy = e.clientY - y0;
        dyLast = dy;
        /* Ось выбирается по соотношению сторон и не фиксируется, пока жест
           короткий: палец идёт по дуге, и первые пиксели часто вертикальные.
           Только после сорока пикселей направление считается решённым. */
        if (!axisLocked) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? "y" : "x";
          if (Math.max(Math.abs(dx), Math.abs(dy)) >= 40) axisLocked = true;
        }

        /* вверх — «уже знаю»: слово закрывается целиком, без лестницы интервалов.
           В калибровке жеста нет: там «знаю» и так закрывает слово. */
        if (axis === "y") {
          if (calib) return;
          moved = true;
          var up = Math.min(0, dy);
          var pu = Math.min(1, -up / UP);
          paint(dx * 0.2, up, 0, 1.03);
          tint.className = "vtint known";
          tint.style.opacity = Math.min(0.8, pu);
          return;
        }
        moved = true;
        var now = Date.now(), dt = now - lastT;
        if (dt > 0) { vx = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = now; }

        var ox = damp(dx), p = Math.min(1, Math.abs(dx) / W);
        paint(ox, dy * 0.35, (ox / W) * 7 * anchor, 1.03);

        /* содержимое отстаёт от карточки — появляется глубина.
           Двигаем внутреннюю обёртку: на самом .vflip висит поворот,
           и запись в его transform распрямила бы перевёрнутую карточку. */
        var inners = drag.querySelectorAll(".vinner");
        for (var q = 0; q < inners.length; q++) {
          inners[q].style.transform = "translateX(" + (-ox * 0.05).toFixed(1) + "px)";
        }

        tint.className = "vtint " + (dx > 0 ? "good" : "bad");
        tint.style.opacity = Math.min(0.8, p);

      });

      function release() {
        if (!on) return;
        on = false;
        drag.classList.remove("held");

        if (axis === "y") {
          if (!calib && dyLast <= -UP) {
            busy = true;
            drag.style.transition = "transform .26s cubic-bezier(.3,.1,.5,1), opacity .26s linear";
            drag.style.transform = "translate(0," + -(window.innerHeight + 200) + "px) scale(.9)";
            drag.style.opacity = "0";
            setTimeout(function () { busy = false; answerKnown(); }, 200);
            return;
          }
          drag.style.transition = "transform .42s cubic-bezier(.18,.89,.32,1.28)";
          drag.style.transform = "";
          tint.style.opacity = 0;
          return;
        }

        var flick = Math.abs(vx) > 0.4 && Math.abs(dx) > 22 && (vx > 0) === (dx > 0);

        if (moved && (Math.abs(dx) >= W || flick)) {
          var know = dx > 0;
          busy = true;
          /* чем резче бросок, тем быстрее улетает */
          var speed = Math.min(2.2, Math.max(0.35, Math.abs(vx)));
          var ms = Math.round(Math.max(150, 420 - speed * 140));
          drag.style.transition = "transform " + ms + "ms cubic-bezier(.3,.1,.5,1), opacity " + ms + "ms linear";
          drag.style.transform = "translate(" + (know ? 1 : -1) * (window.innerWidth + 260) +
            "px," + (dyLast * 0.35 - 30).toFixed(1) + "px) rotate(" +
            (know ? 16 : -16) * anchor + "deg)";
          drag.style.opacity = "0";
          setTimeout(function () { busy = false; answer(know); }, Math.min(ms, 220));
          return;
        }

        /* не дотянул — возврат пружиной с небольшим перелётом */
        drag.style.transition = "transform .42s cubic-bezier(.18,.89,.32,1.28)";
        drag.style.transform = "";
        var back = drag.querySelectorAll(".vinner");
        for (var z = 0; z < back.length; z++) {
          back[z].style.transition = "transform .42s cubic-bezier(.18,.89,.32,1.28)";
          back[z].style.transform = "";
        }
        tint.style.opacity = 0;
        if (!moved) flipCard();
      }

      drag.addEventListener("pointerup", release);
      drag.addEventListener("pointercancel", release);
    }

    function flipCard() {
      var flip = host.querySelector(".vflip");
      if (!flip) return;
      revealed = true;
      peeked = true;   /* подсмотрел перевод — быстрым ответ уже не считается */
      flip.classList.toggle("flipped");
    }

    /* «уже знаю»: слово закрывается целиком, обоими направлениями */
    function answerKnown() {
      if (busy) return;
      var it = list[i];
      var base = it.key.slice(0, -3);
      if (!firstAnswered[it.key] && it.isNew) { newSeen++; newKnown++; }
      firstAnswered[it.key] = true;
      if (calib) bumpCalib(it, true);
      S = Store.mutate("vocabKnown", { key: base });
      syncTabs();
      doneCnt++;
      i++;
      stash();
      step();
    }

    function bumpCalib(it, known) {
      var lvl = it.f || 1;
      var st = calibStat[lvl] || (calibStat[lvl] = { shown: 0, known: 0 });
      st.shown++;
      if (known) st.known++;
    }

    function answer(ok) {
      if (busy) return;
      var it = list[i];
      if (calib) {
        /* калибровка ничего не планирует: знакомое закрываем, незнакомое не трогаем */
        bumpCalib(it, ok);
        if (ok) S = Store.mutate("vocabKnown", { key: it.key.slice(0, -3) });
        doneCnt++;
        i++;
        stash();
        step();
        return;
      }
      var first = !firstAnswered[it.key];
      firstAnswered[it.key] = true;
      if (first && it.isNew) { newSeen++; if (ok) newKnown++; }
      vocabGrade(it, ok, first, answeredFast());
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
      stash();
      step();
    }

    document.onkeydown = function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard(); }
      else if (e.key === "1") { e.preventDefault(); answer(true); }
      else if (e.key === "2") { e.preventDefault(); answer(false); }
    };

    function finish() {
      document.onkeydown = null;
      sessionClear();

      if (calib) return finishCalib();

      var moved = vocabTuneLevel(newSeen, newKnown);
      var sp = vocabSplit();
      app.innerHTML = "";
      var ws = vocabWordStats();
      var c = el("div", "card hero");
      c.innerHTML = '<div class="kicker">Сессия закрыта</div><h1>' + total + " карточек пройдено</h1>" +
        '<div class="muted">Ступень частотности: ' + S.vocabLevel + " из " + V_LEVELS +
        (moved === "up" ? " — новые слова шли легко, дальше беру менее частотные."
          : moved === "down" ? " — новые слова буксовали, возвращаюсь к более ходовым." : "") +
        (sp.due.length ? "<br>Ждут повторения прямо сейчас: " + sp.due.length + "." : "") + "</div>" +
        vocabBar(ws);
      var r = el("div", "btnrow");
      var repLeft = vocabRepeatPending();
      if (repLeft) {
        var br = el("button", "btn", "Повторить слова (" + repLeft + ")");
        br.onclick = function () { sessionClear(); location.hash = "/vocab/repeat"; route(); };
        r.appendChild(br);
      }
      if (sp.fresh.length) {
        var bn2 = el("button", "btn" + (repLeft ? " sec" : ""), "Ещё 10 новых слов");
        bn2.onclick = function () { sessionClear(); location.hash = "/vocab/new"; route(); };
        r.appendChild(bn2);
      }
      var b = el("button", "btn sec", "На главную");
      b.onclick = function () { go("/"); };
      r.appendChild(b);
      c.appendChild(r);
      app.appendChild(c);
    }

    stash();
    step();

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
      lvl = Math.min(V_LEVELS, lvl + (known && known === shown ? 2 : 1));
      S = Store.mutate("calibrate", { level: lvl });
      syncTabs();

      app.innerHTML = "";
      var c = el("div", "card hero");
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
      c.appendChild(r);
      app.appendChild(c);
    }
  }

  /* ---------- синхронизация ----------
     Вся механика в js/sync.js. Здесь только статус в интерфейсе. */
  var syncText = "";
  Store.onStatus(function (txt, cls) {
    syncText = txt;
    var e = document.getElementById("sync");
    if (!e) return;
    e.textContent = txt;
    e.className = "val sync" + (cls ? " " + cls : "");
  });

  route();
  Store.connect();
})();
