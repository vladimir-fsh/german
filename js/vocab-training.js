/* Очередь, расписание первого круга, повтор промахов и отмена тренировки.
   Состояние прогресса принадлежит Store; черновик принадлежит Sessions. */
window.VocabTraining = (function () {
  "use strict";
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  var stages = [
    { id: "new", label: "Не начато" },
    { id: "learning", label: "10 мин" },
    { id: "retry", label: "После ошибки" },
    { id: "days1", label: "1–2 дня" },
    { id: "days3", label: "3–6 дней" },
    { id: "days7", label: "7–29 дней" },
    { id: "days30", label: "30–99 дней" },
    { id: "days100", label: "100+ дней" },
    { id: "closed", label: "Закрыто" }
  ];
  function phase(v) {
    if (!v) return "new";
    if (v.learned) return "closed";
    if ((v.stage || (v.reps ? "review" : "learning")) === "learning") return v.step ? "learning" : "retry";
    var days = v.iv || 0;
    return days >= 100 ? "days100" : days >= 30 ? "days30" : days >= 7 ? "days7" : days >= 3 ? "days3" : "days1";
  }
  function interval(v) {
    var stage = phase(v);
    if (stage === "new") return "Новая карточка";
    if (stage === "closed") return "Закрыто";
    if (stage === "learning" || stage === "retry") {
      var minutes = Math.max(1, Math.round(((v.due || 0) - (v.t || 0)) / 60000));
      var duration = minutes >= 60 ? Math.round(minutes / 60) + " ч" : minutes + " мин";
      return (stage === "retry" ? "После ошибки · " : "Обучение · ") + duration;
    }
    return "Интервал: " + Math.round((v.iv || 0) * 10) / 10 + " дн." + (v.pairRu ? " · ½ шага" : "");
  }
  function create(options) {
    var Store = options.store, sessions = options.sessions, clockNow = options.now || Date.now;
    var CFG = options.config || {};
    var prefix = options.prefix || "V:", sessionKind = options.sessionKind || "vocab";
    var V_SESSION = CFG.sessionNew || 10;   /* потолок обычной сессии */
    var V_NEW = CFG.sessionNew || 10;       /* столько новых даёт добор по кнопке */

    var V_LEVELS = 5;

    /* слова уроков (f = 0, идут первыми) плюс общий словарь A2–B1 со группами словаря */
    function vocabPool() {
      var out = [];
      (options.course.lessons || []).forEach(function (l) {
        if (l.status !== "ready") return;
        var L = options.lesson(l.n);
        if (!L || !L.words) return;
        L.words.forEach(function (w) { out.push({ n: l.n, w: w, key: "L" + l.n + ":" + w.de, f: 0 }); });
      });
      (options.words || []).forEach(function (w) {
        out.push({ n: null, w: w, key: prefix + (w.id || w.de), f: w.f || 1 });
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

    /* новые слова: сначала лексика урока, потом общий словарь - ближе всего
       к текущей группе словаря */
    function vocabSortFresh(fresh) {
      var S = Store.state();
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
      var S = Store.state();
      var now = clockNow(), due = [], fresh = [], learned = 0;
      vocabCards().forEach(function (it) {
        var v = Store.vocabSchedule(S.vocab, it.key.slice(0, -3));
        var dir = Store.vocabPaired(v) && v.pairRu ? "de" : "ru";
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

    function vocabSchedule(it) {
      return Store.vocabSchedule(Store.state().vocab, it.key.slice(0, -3));
    }

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
       повторить, остаток добивается новыми словами. Когда повторять нечего -
       сессия целиком из новых, и добор идёт по кнопке.
       mode === "new" - добор десяти новых слов по запросу, без повторений. */
    function vocabNewRemaining() {
      if (CFG.maxNewPerDay === null) return Infinity;
      var S = Store.state();
      var today = options.day(), introduced = {};
      Object.keys(S.vocab).forEach(function (key) {
        var v = S.vocab[key];
        if (sessionKind === "phrases" ? key.indexOf(prefix) !== 0 : key.indexOf("P:") === 0) return;
        if (v.introducedDay === today) introduced[key.slice(0, -3)] = true;
      });
      return Math.max(0, (CFG.maxNewPerDay || 10) - Object.keys(introduced).length);
    }

    function vocabPlan(mode, split, remaining) {
      var S = Store.state();
      var sp = split || vocabSplit(), taken = {}, budget = remaining == null ? vocabNewRemaining() : remaining;
      var due = mode === "new" ? [] : vocabOnePerWord(sp.due, taken).slice(0, V_SESSION);
      if (due.length >= V_SESSION || sp.due.length > (CFG.newBacklogLimit || 20)) return due;
      var current = options.nextLesson();
      var candidates = options.selectFresh ? options.selectFresh(sp.fresh.slice()) : sp.fresh;
      var fresh = vocabOnePerWord(candidates, taken).filter(function (it) {
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
       Порядок: короткий интервал вперёд, при равных - что свежее, затем что
       просрочено дольше. Потолок сессии - 20 слов. */
    var V_REPEAT = CFG.sessionRepeat || 20;
    function vocabRepeatPlan(split) {
      var pool = (split || vocabSplit()).due.slice(), taken = {};
      pool.sort(function (a, b) {
        var va = vocabSchedule(a), vb = vocabSchedule(b);
        if ((va.iv || 0) !== (vb.iv || 0)) return (va.iv || 0) - (vb.iv || 0);
        if ((vb.t || 0) !== (va.t || 0)) return (vb.t || 0) - (va.t || 0);
        return (va.due || 0) - (vb.due || 0);
      });
      return vocabOnePerWord(pool, taken).slice(0, V_REPEAT);
    }

    /* Калибровка: по четыре незнакомых слова из каждой группы словаря.
       Ответы не влияют на расписание - знакомое сразу закрывается, незнакомое
       остаётся нетронутым. По долям знакомого выставляется стартовая ступень. */
    var CALIB_PER_LEVEL = 4;

    function vocabCalibPlan() {
      var S = Store.state();
      var out = [];
      for (var lvl = 1; lvl <= V_LEVELS; lvl++) {
        var bucket = [];
        (options.words || []).forEach(function (w) {
          /* Названия и сокращения остаются в обучении, но не измеряют словарный запас. */
          if (w.calibrate === false) return;
          if ((w.f || 1) !== lvl) return;
          var base = "V:" + (w.id || w.de), key = base + "|ru";
          if (Store.vocabSchedule(S.vocab, base)) return;
          bucket.push({ n: null, w: w, f: w.f, dir: "ru", key: key });
        });
        out = out.concat(options.shuffle(bucket).slice(0, CALIB_PER_LEVEL));
      }
      return out;
    }

    function vocabSession(mode) {
      if (mode === "repeat") return options.shuffle(vocabRepeatPlan());
      if (mode === "calib") return vocabCalibPlan();   /* порядок от простого к редкому */
      return options.shuffle(vocabPlan(mode));
    }

    function vocabResume(saved, byKey) {
      if (!saved) return saved;
      var S = Store.state();
      saved = JSON.parse(JSON.stringify(saved));
      var completed = saved.keys.slice(0, saved.i), remaining = [], taken = {}, newKeys = [];
      var currentKey = saved.keys[saved.i] || (saved.retryKeys || [])[0], now = clockNow();
      saved.keys.slice(saved.i).forEach(function (key) {
        var base = key.slice(0, -3), v = Store.vocabSchedule(S.vocab, base);
        if (taken[base]) return;
        if (!byKey[key]) return;
        var dir = Store.vocabPaired(v) && v.pairRu ? "de" : "ru";
        var next = base + "|" + dir;
        if ((v && v.learned) || (saved.mode !== "calib" && ((v && v.due > now) ||
            (saved.first && (saved.first[key] || saved.first[next]))))) {
          completed.push(key);
          saved.done = (saved.done || 0) + 1;
          taken[base] = true;
          return;
        }
        taken[base] = true;
        if (!byKey[next]) return;
        remaining.push(next);
        if (!v) newKeys.push(next);
      });
      saved.keys = completed.concat(remaining); saved.i = completed.length;
      saved.newKeys = newKeys; saved.policy = 2;
      saved.retryKeys = (saved.retryKeys || []).filter(function (key) {
        var it = byKey[key], v = it && vocabSchedule(it);
        return it && !(v && v.learned);
      });
      if ((saved.keys[saved.i] || saved.retryKeys[0]) !== currentKey) saved.peeked = false;
      return saved;
    }

    function vocabWordStats() {
      var S = Store.state();
      var pool = vocabPool(), learned = 0, started = 0;
      var counts = {};
      stages.forEach(function (stage) { counts[stage.id] = 0; });
      pool.forEach(function (it) {
        var v = Store.vocabSchedule(S.vocab, it.key);
        counts[phase(v)]++;
        if (v && v.learned) learned++;
        else if (v) started++;
      });
      return { total: pool.length, learned: learned, started: started, stages: stages.map(function (stage) {
        return { id: stage.id, label: stage.label, count: counts[stage.id] };
      }) };
    }

    function summary() {
      var split = vocabSplit(), stats = vocabWordStats();
      stats.fresh = split.fresh.length; stats.due = split.due.length;
      stats.newRemaining = vocabNewRemaining();
      stats.pending = vocabPlan("", split, stats.newRemaining).length; stats.repeat = vocabRepeatPlan(split).length;
      stats.canStartNew = !!vocabPlan("new", split, stats.newRemaining).length;
      return stats;
    }
    function open(mode) {
      mode = mode || "";
      var byKey = {};
      vocabCards().forEach(function (card) { byKey[card.key] = card; });
      var saved = sessions.load(sessionKind);
      if (saved && (saved.mode || "") !== mode) saved = null;
      saved = vocabResume(saved, byKey);
      var list = saved ? saved.keys.map(function (key) { return byKey[key] || { key: key }; }) : vocabSession(mode);
      list.forEach(function (card) { card.isNew = saved ? (saved.newKeys || []).indexOf(card.key) >= 0 : !vocabSchedule(card); });
      var i = saved ? Math.min(saved.i || 0, list.length) : 0, done = saved ? saved.done || 0 : 0;
      var first = saved ? saved.first || {} : {}, newSeen = saved ? saved.newSeen || 0 : 0, newKnown = saved ? saved.newKnown || 0 : 0;
      var retry = saved ? saved.retryKeys || [] : [], calibStat = saved ? saved.calibStat || {} : {};
      var peeked = !!(saved && saved.peeked), levelMove = saved ? saved.levelMove : undefined;
      var previous = null, expectedDue = 0, presented = "", finished = null;
      function card() { return list[i] || byKey[retry[0]] || null; }
      function stash() {
        sessions.save(sessionKind, { at: clockNow(), policy: 2, mode: mode, i: i, done: done,
          keys: list.map(function (it) { return it.key; }),
          newKeys: list.filter(function (it) { return it.isNew; }).map(function (it) { return it.key; }),
          first: first, newSeen: newSeen, newKnown: newKnown, peeked: peeked,
          calibStat: calibStat, retryKeys: retry, levelMove: levelMove });
      }
      function tune() {
        if (options.tune === false || newSeen < 4) return null;
        var level = Store.state().vocabLevel || 1, share = newKnown / newSeen, moved = null;
        if (share >= .7 && level < V_LEVELS) { level++; moved = "up"; }
        else if (share <= .3 && level > 1) { level--; moved = "down"; }
        if (moved) Store.mutate("vocabLevel", { level: level });
        return moved;
      }
      function tuneBeforeRetries() {
        if (i === list.length && retry.length && levelMove === undefined) levelMove = tune();
      }
      function entries(key) {
        var out = {}, vocab = Store.state().vocab;
        ["|ru", "|de"].forEach(function (dir) { out[key + dir] = vocab[key + dir] || null; });
        return clone(out);
      }
      function remember() {
        var key = card().key.slice(0, -3), state = Store.state();
        previous = { list: list.slice(), i: i, done: done, retry: retry.slice(), levelMove: levelMove,
          first: clone(first), newSeen: newSeen, newKnown: newKnown, calibStat: clone(calibStat), peeked: peeked,
          op: i < list.length ? { key: key, before: entries(key), beforeLevel: state.vocabLevel || 1, beforeCalibrated: !!state.calibrated } : null };
      }
      function rememberResult() {
        if (!previous || !previous.op) return;
        previous.op.after = entries(previous.op.key);
        previous.op.afterLevel = Store.state().vocabLevel || 1;
        previous.op.afterCalibrated = !!Store.state().calibrated;
      }
      function current() {
        var it = card(), schedule = it && vocabSchedule(it);
        while (it && schedule && schedule.learned) {
          if (i < list.length) { i++; done++; } else retry.shift();
          peeked = false; it = card(); schedule = it && vocabSchedule(it);
        }
        tuneBeforeRetries();
        if (it && presented !== it.key) { expectedDue = schedule ? schedule.due || 0 : 0; presented = it.key; }
        if (it) stash();
        return { card: it, schedule: schedule || null, retry: i >= list.length, retryCount: retry.length,
          done: done, total: list.length, peeked: peeked, empty: !list.length };
      }
      function peek() { if (!card() || finished) return; peeked = true; stash(); }
      function bump(it, known) {
        var level = it.f || 1, stat = calibStat[level] || (calibStat[level] = { shown: 0, known: 0 });
        stat.shown++; if (known) stat.known++;
      }
      function answer(ok, known) {
        if (finished || !card()) return null;
        var it = card(), schedule;
        if (!presented) { schedule = vocabSchedule(it); expectedDue = schedule ? schedule.due || 0 : 0; presented = it.key; }
        if (mode === "calib" && peeked && !known) ok = false;
        remember();
        if (i >= list.length) {
          var key = retry.shift(); if (!ok) retry.push(key);
        } else if (known) {
          if (!first[it.key] && it.isNew) { newSeen++; newKnown++; }
          first[it.key] = true;
          if (mode === "calib") bump(it, true);
          Store.mutate("vocabKnown", { key: it.key.slice(0, -3) });
          done++; i++;
        } else if (mode === "calib") {
          bump(it, ok);
          if (ok) Store.mutate("vocabKnown", { key: it.key.slice(0, -3) });
          done++; i++;
        } else {
          var firstTry = !first[it.key]; first[it.key] = true;
          if (firstTry && it.isNew) { newSeen++; if (ok) newKnown++; }
          if (firstTry) Store.mutate("vocabWordReviewDeferred", { key: it.key, ok: ok, expectedDue: expectedDue, day: options.day() });
          schedule = vocabSchedule(it);
          if (!ok && !(schedule && schedule.learned)) retry.push(it.key);
          if (firstTry && ok && it.dir === "ru" && Store.vocabPaired(schedule) && schedule.pairRu) {
            var other = byKey[it.key.slice(0, -3) + "|de"];
            if (other && !list.slice(i + 1).some(function (item) { return item.key === other.key; })) { other.isNew = false; list.push(other); }
          }
          done++; i++;
        }
        peeked = false; presented = "";
        tuneBeforeRetries(); stash(); rememberResult();
        return { ok: ok, schedule: vocabSchedule(it) };
      }
      function undo() {
        if (!previous) return { restored: false };
        var old = previous; previous = null;
        if (old.op) Store.mutate("vocabUndo", old.op);
        if (old.op && JSON.stringify(entries(old.op.key)) !== JSON.stringify(old.op.before)) return { restored: false, conflict: true };
        list = old.list; i = old.i; done = old.done; retry = old.retry; levelMove = old.levelMove;
        first = old.first; newSeen = old.newSeen; newKnown = old.newKnown; calibStat = old.calibStat; peeked = old.peeked;
        presented = ""; finished = null; stash();
        return { restored: true };
      }
      function finish() {
        if (card()) return null;
        if (finished) return clone(finished);
        sessions.clear(sessionKind);
        var level = 1, known = 0, shown = 0;
        if (mode === "calib") {
          for (var k = 1; k <= V_LEVELS; k++) {
            var stat = calibStat[k]; if (!stat || !stat.shown) continue;
            known += stat.known; shown += stat.shown;
            if (stat.known / stat.shown >= .5) level = k;
          }
          level = known ? Math.min(V_LEVELS, level + (known === shown ? 2 : 1)) : 1;
          Store.mutate("calibrate", { level: level });
        } else if (levelMove === undefined) levelMove = tune();
        rememberResult();
        finished = { total: list.length, moved: levelMove, level: level, known: known, shown: shown, calibStat: clone(calibStat) };
        return clone(finished);
      }
      if (saved) stash();
      return { current: current, peek: peek, answer: answer, undo: undo, finish: finish };
    }
    return { summary: summary, plan: vocabSession, open: open };
  }
  return { create: create, phase: phase, interval: interval };
})();
