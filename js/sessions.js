/* Сессии слов и повторения ошибок: ввод, позиция и подсказки в одном экспорте. */
window.Sessions = (function () {
  "use strict";
  var DATA = window.ProgressData, keys = { vocab: "de-b1-session-v1", review: "de-b1-review-v1" };
  var cache = {}, loaded = {}, dirty = {}, blocked = {};
  function integer(n, max) { if (typeof n !== "number" || n < 0 || n !== Math.floor(n) || n > (max == null ? 1e15 : max)) throw new Error("Некорректная сессия занятий"); }
  function list(value) { if (!Array.isArray(value) || value.length > 2000) throw new Error("Некорректная очередь"); return value; }
  function text(value) { if (typeof value !== "string" || !value || value.length > 500 || ["__proto__", "constructor", "prototype"].indexOf(value) >= 0) throw new Error("Некорректный идентификатор"); }
  function validate(kind, value) {
    if (value == null) return null;
    DATA.safe(value); DATA.object(value); integer(value.i); integer(value.at);
    if (kind === "vocab") {
      if (value.policy != null && value.policy !== 2) throw new Error("Неизвестное расписание сессии");
      if (["", "new", "repeat", "calib"].indexOf(value.mode || "") < 0) throw new Error("Неизвестная сессия");
      list(value.keys).forEach(function (key) { text(key); if (!/\|(de|ru)$/.test(key)) throw new Error("Некорректная карточка"); });
      if (value.i > value.keys.length) throw new Error("Некорректная позиция");
      if (value.newKeys != null) list(value.newKeys).forEach(function (key) { text(key); if (value.keys.indexOf(key) < 0) throw new Error("Карточка вне сессии"); });
      ["done", "newSeen", "newKnown"].forEach(function (field) { if (value[field] != null) integer(value[field], value.keys.length); });
      if (value.newKnown > value.newSeen) throw new Error("Некорректная оценка");
      if (value.peeked != null && typeof value.peeked !== "boolean") throw new Error("Некорректная подсказка");
      if (value.first) { DATA.object(value.first); Object.keys(value.first).forEach(function (key) { if (typeof value.first[key] !== "boolean") throw new Error("Некорректная попытка"); }); }
      if (value.calibStat) { DATA.object(value.calibStat); Object.keys(value.calibStat).forEach(function (key) { var stat = DATA.object(value.calibStat[key]); if (!/^[1-5]$/.test(key)) throw new Error("Некорректная группа"); integer(stat.shown, 2000); integer(stat.known, stat.shown); if (stat.known > stat.shown) throw new Error("Некорректная оценка"); }); }
    } else {
      text(value.id); list(value.items).forEach(function (item) { DATA.object(item); text(item.id); integer(item.n, 999); integer(item.box, 3); integer(item.due); DATA.exercise(item.ex); });
      if (value.i > value.items.length || list(value.records).length > value.items.length) throw new Error("Некорректная позиция");
      value.records.forEach(DATA.record);
    }
    return JSON.parse(JSON.stringify(value));
  }
  function load(kind) {
    if (loaded[kind]) return cache[kind];
    loaded[kind] = true;
    try { var raw = localStorage.getItem(keys[kind]); cache[kind] = validate(kind, raw ? JSON.parse(raw) : null); }
    catch (e) { cache[kind] = null; blocked[kind] = true; window.Store.warn("Сессия занятий повреждена. Исходная запись сохранена для экспорта; новую работу экспортируйте перед восстановлением.", "session-" + kind); }
    return cache[kind];
  }
  function flush(kind) {
    var kinds = kind ? [kind] : Object.keys(keys), ok = true;
    kinds.forEach(function (name) {
      if (!dirty[name]) return;
      if (blocked[name]) { ok = false; window.Store.warn("Поврежденная сессия не перезаписана. Экспортируйте новую работу перед восстановлением.", "session-" + name); return; }
      try { localStorage.setItem(keys[name], JSON.stringify(cache[name])); dirty[name] = false; window.Store.clearWarning("session-" + name); }
      catch (e) { ok = false; window.Store.warn("Сессия занятий пока только в памяти. Не закрывайте страницу: скачайте резервную копию или повторите сохранение.", "session-" + name); }
    }); return ok;
  }
  function save(kind, value) { load(kind); cache[kind] = validate(kind, value); dirty[kind] = true; flush(kind); }
  function clear(kind) { var kinds = kind ? [kind] : Object.keys(keys); kinds.forEach(function (name) { cache[name] = null; loaded[name] = true; blocked[name] = false; dirty[name] = true; }); flush(); }
  function validateImport(value) { DATA.object(value); var result = {}; Object.keys(value).forEach(function (kind) { if (!keys[kind]) throw new Error("Неизвестная сессия"); result[kind] = validate(kind, value[kind]); }); return result; }
  return {
    load: load, save: save, clear: clear, flush: flush, validateImport: validateImport,
    exportSessions: function () { return { vocab: load("vocab"), review: load("review") }; },
    importSessions: function (value) { var all = validateImport(value || {}); clear(); Object.keys(all).forEach(function (kind) { save(kind, all[kind]); }); }
  };
})();
