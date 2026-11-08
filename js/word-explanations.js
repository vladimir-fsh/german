/* Личные объяснения привязаны к постоянному ключу слова, общему для обеих сторон. */
window.WordExplanations = (function () {
  "use strict";
  function list(key) {
    var entries = (window.Store.state().wordExplanations || {})[key] || {};
    return Object.keys(entries).filter(function (id) { return !entries[id].deleted; }).map(function (id) {
      return { id: id, text: entries[id].text, at: entries[id].at };
    }).sort(function (a, b) { return b.at - a.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }
  function contains(key, text) { return list(key).some(function (entry) { return entry.text === text.trim(); }); }
  function save(key, text) {
    text = String(text || "").trim();
    if (!contains(key, text)) window.Store.mutate("wordExplanationSave", { key: key, text: text });
  }
  function remove(key, id) { window.Store.mutate("wordExplanationDelete", { key: key, id: id }); }
  return { list: list, contains: contains, save: save, remove: remove };
})();
