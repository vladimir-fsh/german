/* Черновики учебных дней. Прогресс меняется только через Store.mutate. */
window.Practice = (function () {
  "use strict";
  var KEY = "de-b1-days-v2", LEGACY = "de-b1-day-v1", memory = {}, dirty = false, blockedDrafts = false;
  function stamp() { return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function fingerprint(exercises) {
    return JSON.stringify(exercises.map(function (ex) { var copy = JSON.parse(JSON.stringify(ex)); delete copy.skill; return copy; }));
  }
  function read() {
    if (dirty) return memory;
    try { var raw = localStorage.getItem(KEY); var parsed = raw ? JSON.parse(raw) : {}; validateImport(parsed); memory = parsed; }
    catch (e) { blockedDrafts = true; window.Store.warn("Не удалось прочитать черновики занятий. Прогресс сохранен; исходные черновики доступны в экспорте хранилища.", "practice"); }
    return memory;
  }
  function validate(draft, length) {
    window.ProgressData.safe(draft);
    if (!draft || typeof draft.id !== "string" || !draft.id || draft.i !== Math.floor(draft.i) || draft.i < 0 || draft.i > length || !Array.isArray(draft.records) || draft.records.length > length) return false;
    return draft.records.every(function (record) {
      if (!record) return true;
      if (typeof record !== "object" || Array.isArray(record) || (record.result && typeof record.result.ok !== "boolean")) return false;
      var d = record.draft;
      if (!d) return true;
      if (typeof d !== "object" || Array.isArray(d) || (d.result && typeof d.result.ok !== "boolean")) return false;
      if (d.values && (!Array.isArray(d.values) || !d.values.every(function (s) { return typeof s === "string"; }))) return false;
      if (d.zeros && (!Array.isArray(d.zeros) || !d.zeros.every(function (b) { return typeof b === "boolean"; }))) return false;
      if (d.words && (!Array.isArray(d.words) || !d.words.every(function (s) { return typeof s === "string"; }))) return false;
      if (d.solved && (!Array.isArray(d.solved) || !d.solved.every(function (n) { return n === Math.floor(n) && n >= 0; }))) return false;
      if (d.choice != null && (d.choice !== Math.floor(d.choice) || d.choice < 0)) return false;
      return d.errors == null || (d.errors === Math.floor(d.errors) && d.errors >= 0);
    });
  }
  function load(n, di, exercises) {
    var key = "L" + n + "D" + di, saved = read()[key];
    if (saved && fingerprint(JSON.parse(saved.fingerprint)) === fingerprint(exercises) && validate(saved, exercises.length)) return saved;
    try {
      var old = JSON.parse(localStorage.getItem(LEGACY));
      if (old && old.n === n && old.di === di && old.i === Math.floor(old.i) && old.i >= 0 && old.i <= exercises.length && old.correct >= 0 && old.correct <= old.i) {
        var migrated = { id: stamp(), n: n, di: di, i: old.i, legacyCorrect: old.correct, records: [], fingerprint: fingerprint(exercises), at: old.at || Date.now() };
        save(migrated); return migrated;
      }
    } catch (e) { /* Старая запись не удаляется автоматически. */ }
    return null;
  }
  function create(n, di, exercises) { return { id: stamp(), n: n, di: di, i: 0, records: [], fingerprint: fingerprint(exercises), at: Date.now() }; }
  function flush() {
    if (blockedDrafts) { dirty = true; window.Store.warn("Исходные черновики повреждены и не перезаписаны. Новую работу экспортируйте перед восстановлением.", "practice"); return false; }
    try { localStorage.setItem(KEY, JSON.stringify(memory)); dirty = false; window.Store.clearWarning("practice"); return true; }
    catch (e) { dirty = true; window.Store.warn("Ответы занятия пока только в памяти. Не закрывайте страницу: экспортируйте резервную копию или повторите сохранение.", "practice"); return false; }
  }
  function save(draft) { var all = read(); all["L" + draft.n + "D" + draft.di] = draft; draft.at = Date.now(); dirty = true; flush(); }
  function remove(n, di) { var all = read(); delete all["L" + n + "D" + di]; dirty = true; flush(); try { var old = JSON.parse(localStorage.getItem(LEGACY)); if (old && old.n === n && old.di === di) localStorage.removeItem(LEGACY); } catch (e) {} }
  function stats(draft) {
    var correct = draft.legacyCorrect || 0, uncertain = 0, hints = 0;
    draft.records.forEach(function (record) { if (record && record.result) { if (record.result.ok) correct++; if (record.result.verdict === "needs-review") uncertain++; if (record.result.usedHint) hints++; } });
    return { correct: correct, uncertain: uncertain, hints: hints };
  }
  function validateImport(text) {
    var all = typeof text === "string" ? JSON.parse(text) : text;
    window.ProgressData.object(all);
    Object.keys(all).forEach(function (key) {
      var d = all[key], ex = JSON.parse(d.fingerprint);
      if (!Array.isArray(ex) || ex.length > 100 || key !== "L" + d.n + "D" + d.di || !validate(d, ex.length)) throw new Error("Некорректные черновики. Текущий прогресс не изменен.");
    });
    return all;
  }
  return { load: load, create: create, save: save, remove: remove, stats: stats, flush: flush, clear: function () { memory = {}; blockedDrafts = false; dirty = true; flush(); }, exportDrafts: function () { return JSON.stringify(read()); }, validateImport: validateImport, importDrafts: function (all) { memory = all; blockedDrafts = false; dirty = true; flush(); } };
})();
