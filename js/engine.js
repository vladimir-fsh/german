/* Движок упражнений: рендер + проверка. Никаких зависимостей. */
(function (global) {
  "use strict";

  /* ---------- нормализация ответа ---------- */
  function norm(s) {
    return String(s == null ? "" : s)
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:"„“»«]/g, "")
      .replace(/\s+/g, " ")
      .replace(/ß/g, "ss")
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
  }
  function match(input, answers) {
    var v = norm(input);
    return answers.some(function (a) { return norm(a) === v; });
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Exercise ---------- */
  /* ex — объект задания, onDone(correct) — колбэк после проверки */
  function render(ex, host, onDone) {
    host.innerHTML = "";
    var fb = el("div", "feedback");
    var checked = false;

    function finish(ok, extra) {
      if (checked) return;
      checked = true;
      fb.className = "feedback show " + (ok ? "good" : "wrong");
      var why = ex.why ? '<span class="why">' + esc(ex.why) + "</span>" : "";
      fb.innerHTML = (ok ? "<b>Richtig!</b> " : "<b>Falsch.</b> ") + (extra || "") + why;
      onDone(ok);
    }

    var api = { check: null };
    (BUILD[ex.type] || BUILD.fill)(ex, host, finish, api);
    host.appendChild(fb);
    return api;
  }

  var BUILD = {};

  /* ---- fill: текст с пропусками {подсказка} ----
     Если задание проверяет только окончание — ответ это подсказка плюс хвост
     (klein → kleiner, ein → einen), — основа печатается текстом, а вводится
     только окончание. Нулевое окончание (сказуемое: «ist hoch») вводится
     пустым полем: форма поля не должна подсказывать, есть окончание или нет.
     Если ответ меняет основу (hoch → hohes), остаётся ввод слова целиком.
     Флаг ex.full отключает режим окончаний для всего задания. */
  function endingsOf(hint, answers, full) {
    if (full || !hint) return null;
    var h = hint.toLowerCase(), out = [];
    for (var k = 0; k < answers.length; k++) {
      var a = String(answers[k]);
      if (a.toLowerCase().indexOf(h) !== 0) return null;
      out.push(a.slice(hint.length));
    }
    return out;
  }

  BUILD.fill = function (ex, host, finish, api) {
    if (ex.prompt) host.appendChild(el("div", "prompt", esc(ex.prompt)));
    var answers = Array.isArray(ex.a[0]) ? ex.a : ex.a.map(function (x) { return [x]; });
    var q = el("div", "q");
    var i = 0, slots = [];
    var parts = String(ex.q).split(/(\{[^}]*\})/);
    parts.forEach(function (p) {
      if (/^\{[^}]*\}$/.test(p)) {
        var hint = p.slice(1, -1);
        var idx = i++;
        var ends = endingsOf(hint, answers[idx] || [], ex.full);
        var inp = document.createElement("input");
        inp.type = "text";
        inp.autocapitalize = "off";
        inp.autocomplete = "off";
        inp.spellcheck = false;
        inp.setAttribute("autocorrect", "off");
        inp.setAttribute("enterkeyhint", "go");
        inp.dataset.idx = idx;
        if (ends) {
          /* основа текстом, поле только под окончание */
          var wrap = el("span", "stem");
          wrap.appendChild(document.createTextNode(hint));
          inp.className = "blank end";
          inp.size = 3;
          wrap.appendChild(inp);
          q.appendChild(wrap);
        } else {
          inp.className = "blank";
          if (hint) inp.placeholder = hint;
          inp.size = Math.max(6, hint.length + 2);
          q.appendChild(inp);
        }
        slots.push({ inp: inp, ends: ends, full: answers[idx] || [] });
      } else if (p) {
        q.appendChild(document.createTextNode(p));
      }
    });
    if (ex.ru) q.appendChild(el("span", "ru", esc(ex.ru)));
    host.appendChild(q);

    if (slots[0]) setTimeout(function () { slots[0].inp.focus(); }, 30);

    api.check = function () {
      var ok = true;
      slots.forEach(function (sl) {
        var good;
        if (sl.ends) {
          /* пустое поле или прочерк — нулевое окончание */
          var typed = String(sl.inp.value).replace(/[-–—]/g, "");
          good = match(typed, sl.ends);
        } else {
          good = match(sl.inp.value, sl.full);
        }
        sl.inp.className = (sl.ends ? "blank end " : "blank ") + (good ? "ok" : "bad");
        sl.inp.disabled = true;
        if (!good) ok = false;
      });
      var right = answers.map(function (a) { return a[0]; }).join(" / ");
      finish(ok, ok ? "" : "Richtig ist: <b>" + esc(right) + "</b>.");
    };
    q.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); api.check(); }
    });
  };

  /* ---- choice: один правильный из нескольких ---- */
  BUILD.choice = function (ex, host, finish, api) {
    if (ex.prompt) host.appendChild(el("div", "prompt", esc(ex.prompt)));
    var q = el("div", "q", esc(ex.q));
    if (ex.ru) q.appendChild(el("span", "ru", esc(ex.ru)));
    host.appendChild(q);
    var box = el("div", "opts");
    ex.opts.forEach(function (o, k) {
      var b = el("button", "opt", esc(o));
      b.onclick = function () {
        box.querySelectorAll(".opt").forEach(function (x) { x.disabled = true; });
        var ok = k === ex.a;
        b.className = "opt " + (ok ? "ok" : "bad");
        if (!ok) box.children[ex.a].className = "opt ok";
        finish(ok, "");
      };
      box.appendChild(b);
    });
    host.appendChild(box);
    api.check = null; /* проверяется по клику */
  };

  /* ---- order: собрать предложение из слов ---- */
  BUILD.order = function (ex, host, finish, api) {
    host.appendChild(el("div", "prompt", esc(ex.prompt || "Составь предложение.")));
    if (ex.ru) {
      var cap = el("div", "q");
      cap.appendChild(el("span", "ru", esc(ex.ru)));
      host.appendChild(cap);
    }
    var slot = el("div", "slot");
    var pool = el("div", "chips");
    host.appendChild(slot); host.appendChild(pool);
    var picked = [];
    shuffle(ex.words).forEach(function (w) {
      var c = el("button", "chip", esc(w));
      c.onclick = function () {
        if (c.classList.contains("used")) return;
        c.classList.add("used");
        picked.push({ w: w, chip: c });
        redraw();
      };
      pool.appendChild(c);
    });
    function redraw() {
      slot.innerHTML = "";
      picked.forEach(function (p, i) {
        var c = el("button", "chip", esc(p.w));
        c.onclick = function () {
          p.chip.classList.remove("used");
          picked.splice(i, 1);
          redraw();
        };
        slot.appendChild(c);
      });
    }
    api.check = function () {
      var built = picked.map(function (p) { return p.w; }).join(" ");
      var answers = Array.isArray(ex.a) ? ex.a : [ex.a];
      var ok = match(built, answers);
      slot.className = "slot " + (ok ? "ok" : "bad");
      slot.querySelectorAll(".chip").forEach(function (c) { c.onclick = null; });
      pool.querySelectorAll(".chip").forEach(function (c) { c.classList.add("used"); });
      finish(ok, ok ? "" : "Richtig ist: <b>" + esc(answers[0]) + "</b>");
    };
  };

  /* ---- translate: русский → немецкий, свободный ввод ---- */
  BUILD.translate = function (ex, host, finish, api) {
    host.appendChild(el("div", "prompt", esc(ex.prompt || "Переведи на немецкий:")));
    host.appendChild(el("div", "q", esc(ex.ru)));
    var inp = document.createElement("input");
    inp.className = "big"; inp.type = "text"; inp.spellcheck = false;
    inp.autocapitalize = "off"; inp.autocomplete = "off";
    inp.setAttribute("autocorrect", "off");
    inp.setAttribute("enterkeyhint", "go");
    inp.placeholder = ex.hint || "";
    host.appendChild(inp);
    setTimeout(function () { inp.focus(); }, 30);
    api.check = function () {
      var ok = match(inp.value, ex.a);
      inp.className = "big " + (ok ? "ok" : "bad");
      inp.disabled = true;
      finish(ok, ok ? "" : "Richtig ist: <b>" + esc(ex.a[0]) + "</b>");
    };
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); api.check(); }
    });
  };

  /* ---- pairs: соединить пары (слово ↔ противоположность/перевод) ---- */
  BUILD.pairs = function (ex, host, finish, api) {
    host.appendChild(el("div", "prompt", esc(ex.prompt || "Соедини пары.")));
    var grid = el("div", "pairs");
    var colA = el("div", "col"), colB = el("div", "col");
    grid.appendChild(colA); grid.appendChild(colB);
    host.appendChild(grid);
    var left = ex.pairs.map(function (p, i) { return { t: p[0], i: i }; });
    var right = shuffle(ex.pairs.map(function (p, i) { return { t: p[1], i: i }; }));
    var sel = null, solved = 0, errors = 0;
    function mk(item, col) {
      var b = el("button", "pair", esc(item.t));
      b.dataset.i = item.i;
      b.dataset.col = col;
      b.onclick = function () {
        if (!sel) { sel = b; b.classList.add("sel"); return; }
        if (sel === b) { sel.classList.remove("sel"); sel = null; return; }
        if (sel.dataset.col === col) { sel.classList.remove("sel"); sel = b; b.classList.add("sel"); return; }
        if (sel.dataset.i === b.dataset.i) {
          sel.className = "pair ok"; b.className = "pair ok";
          sel = null; solved++;
          if (solved === ex.pairs.length) finish(errors === 0, errors ? "Ошибок: " + errors + "." : "");
        } else {
          errors++;
          var s = sel; s.classList.add("bad"); b.classList.add("bad");
          setTimeout(function () { s.className = "pair"; b.className = "pair"; }, 550);
          sel = null;
        }
      };
      return b;
    }
    left.forEach(function (it) { colA.appendChild(mk(it, "a")); });
    right.forEach(function (it) { colB.appendChild(mk(it, "b")); });
    api.check = null;
  };

  global.Engine = { render: render, norm: norm, match: match, esc: esc, shuffle: shuffle, el: el };
})(window);
