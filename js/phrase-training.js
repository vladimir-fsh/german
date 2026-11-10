/* Фразы используют то же расписание, но отдельные ключи и черновик, без дневного лимита. */
window.PhraseTraining = (function () {
  "use strict";
  function create(options) {
    var topics = options.topics || window.PHRASE_TOPICS;
    function selectFresh(cards) {
      for (var i = 0; i < topics.length; i++) {
        var group = cards.filter(function (card) { return card.w.topic === topics[i].id; });
        if (group.length) return group;
      }
      return cards;
    }
    var config = {}, source = options.config || window.SRS_CONFIG;
    Object.keys(source).forEach(function (key) { config[key] = source[key]; });
    config.maxNewPerDay = null; // без дневного лимита новых фраз
    config.sessionNew = source.phraseSession;
    return window.VocabTraining.create({ store: options.store, sessions: options.sessions,
      selectFresh: selectFresh, config: config, prefix: "P:", sessionKind: "phrases", tune: false,
      course: { lessons: [] }, words: options.phrases || window.PHRASES,
      nextLesson: function () { return null; }, shuffle: function (items) { return items; },
      day: options.day, now: options.now });
  }
  return { create: create };
})();
