/* Проверка переносимого прогресса и календарь. Без DOM, сети и мутаций. */
window.ProgressData = (function () {
  "use strict";
  function fail() { throw new Error("Некорректный файл прогресса. Текущие данные не изменены."); }
  function object(v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) fail();
    Object.keys(v).forEach(function (k) { if (k === "__proto__" || k === "constructor" || k === "prototype") fail(); });
    return v;
  }
  function safe(v, depth) {
    if (depth > 30) fail();
    if (v && typeof v === "object") {
      if (Array.isArray(v)) { if (v.length > 20000) fail(); v.forEach(function (x) { safe(x, depth + 1); }); }
      else Object.keys(object(v)).forEach(function (k) { safe(v[k], depth + 1); });
    } else if (typeof v === "number" && !isFinite(v)) fail();
  }
  function number(v, max) { if (typeof v !== "number" || !isFinite(v) || v < 0 || v > (max || 1e15)) fail(); }
  function text(v, max) { if (typeof v !== "string" || v.length > (max || 12000)) fail(); }
  function identifier(v) { text(v, 500); if (!v || ["__proto__", "constructor", "prototype"].indexOf(v) >= 0) fail(); }
  function optional(v, fn) { if (v != null) fn(v); }
  function strings(v) { if (!Array.isArray(v) || !v.length || v.length > 100) fail(); v.forEach(function (s) { text(s); }); }
  function exercise(ex) {
    object(ex); text(ex.type, 30);
    if (["fill", "choice", "translate", "pairs", "order"].indexOf(ex.type) < 0) fail();
    if (ex.type === "fill") { text(ex.q); if (!Array.isArray(ex.a) || !ex.a.length || ex.a.length > 100) fail(); ex.a.forEach(function (a) { if (Array.isArray(a)) strings(a); else text(a); }); }
    if (ex.type === "translate") { text(ex.ru); strings(ex.a); }
    if (ex.type === "choice") { text(ex.q); strings(ex.opts); if (ex.a !== Math.floor(ex.a) || ex.a < 0 || ex.a >= ex.opts.length) fail(); }
    if (ex.type === "pairs") { if (!Array.isArray(ex.pairs) || !ex.pairs.length || ex.pairs.length > 100) fail(); ex.pairs.forEach(function (p) { strings(p); if (p.length !== 2) fail(); }); }
    if (ex.type === "order") { strings(ex.words); if (Array.isArray(ex.a)) strings(ex.a); else text(ex.a); }
  }
  function record(value) {
    if (!value) return;
    object(value);
    if (value.result) { object(value.result); if (typeof value.result.ok !== "boolean") fail(); }
    if (value.draft) {
      var d = object(value.draft);
      if (d.values != null) { if (!Array.isArray(d.values)) fail(); d.values.forEach(function (s) { text(s); }); }
      if (d.words != null) { if (!Array.isArray(d.words)) fail(); d.words.forEach(function (s) { text(s); }); }
      if (d.zeros != null) { if (!Array.isArray(d.zeros)) fail(); d.zeros.forEach(function (b) { if (typeof b !== "boolean") fail(); }); }
      if (d.solved != null) { if (!Array.isArray(d.solved)) fail(); d.solved.forEach(function (n) { number(n, 100); if (n !== Math.floor(n)) fail(); }); }
      optional(d.errors, number); optional(d.choice, number);
      if (d.result) { object(d.result); if (typeof d.result.ok !== "boolean") fail(); }
    }
  }
  function state(value) {
    safe(value, 0); object(value);
    if ([2, 3, 4, 5, 6].indexOf(value.v) < 0) fail();
    object(value.done); object(value.srs); object(value.vocab);
    Object.keys(value.done).forEach(function (k) {
      if (!/^L\d+D\d+$/.test(k)) fail();
      var d = object(value.done[k]); optional(d.at, number); optional(d.score, number); optional(d.of, number);
      if (d.score != null && d.of != null && d.score > d.of) fail();
    });
    Object.keys(value.srs).forEach(function (k) { var r = object(value.srs[k]); number(r.box, 3); number(r.due); exercise(r.ex); number(r.n, 999); });
    Object.keys(value.vocab).forEach(function (k) {
      if (!/\|(de|ru)$/.test(k)) fail();
      var r = object(value.vocab[k]); ["box", "iv", "ease", "reps", "lapses", "due", "t", "step"].forEach(function (f) { optional(r[f], number); });
      if (r.learned != null && typeof r.learned !== "boolean") fail();
      if (r.stage != null && ["learning", "review"].indexOf(r.stage) < 0) fail();
    });
    ["streak", "totalTried", "totalCorrect", "totalUncertain", "resetAt"].forEach(function (f) { optional(value[f], number); });
    if (value.totalCorrect > value.totalTried) fail();
    optional(value.vocabLevel, function (v) { number(v, 5); if (v < 1 || Math.floor(v) !== v) fail(); });
    if (value.lastDay != null && !validDay(value.lastDay)) fail();
    if (Object.prototype.hasOwnProperty.call(value, "attempts") && !Array.isArray(value.attempts)) fail();
    if (Object.prototype.hasOwnProperty.call(value, "answered")) { object(value.answered); Object.keys(value.answered).forEach(function (id) { identifier(id); number(value.answered[id]); }); }
    if (value.attempts) value.attempts.forEach(function (a) { object(a); identifier(a.id); number(a.n, 999); number(a.di, 999); number(a.at); number(a.score); number(a.of); if (a.score > a.of) fail(); if (a.records != null) { if (!Array.isArray(a.records)) fail(); a.records.forEach(record); } });
    return JSON.parse(JSON.stringify(value));
  }
  function validDay(day) { return typeof day === "string" && /^\d{4}-\d\d-\d\d$/.test(day) && isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day; }
  function dayString(date) { return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2); }
  function previousStudyDay(day) {
    var d = new Date(day + "T12:00:00Z");
    do { d.setUTCDate(d.getUTCDate() - 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
    return d.toISOString().slice(0, 10);
  }
  function currentStreak(s, today) { return s.lastDay === today || s.lastDay === previousStudyDay(today) ? s.streak || 0 : 0; }
  function operation(op) {
    safe(op, 0); object(op); text(op.type, 40); identifier(op.device); number(op.seq); number(op.lc); number(op.t);
    if (Math.floor(op.seq) !== op.seq || Math.floor(op.lc) !== op.lc) fail();
    if (["answer", "reviewAnswer", "dayDone", "touchDay", "srsAdd", "srsHit", "vocabGrade", "vocabReview", "vocabKnown", "vocabLevel", "calibrate", "reset", "restore"].indexOf(op.type) < 0) fail();
    if (op.type === "answer" || op.type === "reviewAnswer" || op.type === "vocabGrade" || op.type === "vocabReview" || op.type === "srsHit") { if (typeof op.ok !== "boolean") fail(); }
    if (op.type === "dayDone") { number(op.n, 999); number(op.di, 999); number(op.score); number(op.of); if (op.score > op.of) fail(); }
    if (op.records != null) { if (!Array.isArray(op.records)) fail(); op.records.forEach(record); }
    if (op.type === "touchDay" && !validDay(op.day)) fail();
    if (/^(vocabGrade|vocabReview|vocabKnown)$/.test(op.type)) { identifier(op.key); if (op.type !== "vocabKnown" && !/\|(de|ru)$/.test(op.key)) fail(); }
    if (op.type === "srsAdd" || op.type === "srsHit") identifier(op.id);
    if (op.type === "reviewAnswer") { identifier(op.id); identifier(op.attemptId); number(op.expectedBox, 3); number(op.expectedDue); }
    if (op.attemptId != null) identifier(op.attemptId);
    if (op.type === "srsAdd") { exercise(op.ex); number(op.n, 999); }
    if (op.type === "vocabLevel" || op.type === "calibrate") { number(op.level, 5); if (op.level < 1 || Math.floor(op.level) !== op.level) fail(); }
    if (op.type === "restore") state(op.state);
    return op;
  }
  function journal(value) {
    object(value); identifier(value.device); number(value.seq); number(value.lc);
    if (value.seq !== Math.floor(value.seq) || value.lc !== Math.floor(value.lc) || !Array.isArray(value.ops)) fail();
    value.ops.forEach(function (op) { operation(op); if (op.device !== value.device || op.seq > value.seq || op.lc > value.lc) fail(); });
    if (value.relayed != null) {
      if (!Array.isArray(value.relayed) || value.relayed.length > 2000) fail();
      value.relayed.forEach(function (entry) { if (entry.relayed != null) fail(); journal(entry); });
    }
    return value;
  }
  function snapshot(value) {
    object(value); state(value.state); object(value.cursor); number(value.at);
    optional(value.lc, number);
    Object.keys(value.cursor).forEach(function (id) { identifier(id); number(value.cursor[id]); if (Math.floor(value.cursor[id]) !== value.cursor[id]) fail(); });
    return value;
  }
  return { exercise: exercise, record: record, state: state, operation: operation, journal: journal, snapshot: snapshot, object: object, day: dayString, previousStudyDay: previousStudyDay, currentStreak: currentStreak, safe: function (v) { safe(v, 0); return v; } };
})();
