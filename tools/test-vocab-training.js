const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');
const FILES = ['js/progress-data.js', 'js/srs-config.js', 'js/sync.js', 'js/sessions.js', 'js/vocab-training.js'];

function fixture(options = {}) {
  const clock = { skew: 0 }, w = env.load(FILES, { clock, storage: options.storage });
  const words = options.words || ['A', 'B', 'C'].map(de => ({ de, ru: de, f: 1 }));
  const course = options.course || { lessons: [] };
  const training = w.VocabTraining.create({ store: w.Store, sessions: w.Sessions,
    config: w.SRS_CONFIG, course, words, lesson: n => options.lessons[n],
    nextLesson: () => options.next || null, shuffle: list => list,
    now: () => Date.now() + clock.skew, day: () => '2026-11-08' });
  return { w, training, clock, words };
}
function seed(h, values) {
  const state = JSON.parse(JSON.stringify(h.w.Store.state()));
  Object.entries(values).forEach(([word, value]) => {
    state.vocab['V:' + word + '|ru'] = { wordSchedule: 1, iv: 7, stage: 'review', due: 0, reps: 3, ease: 2.5, ...value };
  });
  h.w.Store.mutate('restore', { state });
}

test('первый круг назначает сроки, круг промахов сохраняет только очередь', () => {
  const h = fixture(); seed(h, { A: {}, B: {}, C: {} }); const run = h.training.open('repeat');
  assert.equal(run.current().card.key, 'V:A|ru'); run.answer(false);
  assert.equal(run.current().card.key, 'V:B|ru'); run.answer(false);
  assert.equal(run.current().card.key, 'V:C|ru'); run.answer(true);
  assert.equal(run.current().retry, true);
  const before = JSON.stringify(h.w.Store.state());
  run.answer(false); assert.equal(run.current().card.key, 'V:B|ru');
  run.answer(true); assert.equal(run.current().card.key, 'V:A|ru');
  run.answer(true); assert.equal(run.current().card, null); run.finish();
  assert.equal(JSON.stringify(h.w.Store.state()), before);
  assert.equal(h.w.Sessions.load('vocab'), null);
});

test('парный шаг добавляет немецкую сторону в конец первого круга и переживает возобновление', () => {
  const h = fixture(); seed(h, { A: { iv: 30 }, B: {} });
  let run = h.training.open('repeat');
  // Повтор сначала выбирает более короткий интервал.
  assert.equal(run.current().card.key, 'V:B|ru'); run.answer(true);
  assert.equal(run.current().card.key, 'V:A|ru'); run.answer(true);
  assert.equal(h.w.Store.state().vocab['V:A|ru'].pairRu, true);
  run = h.training.open('repeat'); assert.equal(run.current().card.key, 'V:A|de');
  run.answer(true); run.current(); run.finish();
  assert.equal(h.w.Store.state().vocab['V:A|ru'].pairRu, false);
  assert.ok(h.w.Store.state().vocab['V:A|ru'].due > Date.now());
});

test('черновик восстанавливает подсказку; отмена возвращает состояние до ответа даже после итога', () => {
  const h = fixture({ words: [{ de: 'A', ru: 'A', f: 1 }] }); seed(h, { A: {} });
  let run = h.training.open('repeat'); run.current(); run.peek();
  run = h.training.open('repeat'); assert.equal(run.current().peeked, true);
  const before = JSON.stringify(h.w.Store.state().vocab);
  run.answer(true, true); run.current(); run.finish();
  assert.equal(h.w.Store.state().vocab['V:A|ru'].learned, true);
  assert.equal(run.undo().restored, true);
  assert.equal(run.current().card.key, 'V:A|ru'); assert.equal(run.current().peeked, true);
  assert.equal(JSON.stringify(h.w.Store.state().vocab), before);
});

test('отмена не затирает более поздний ответ другого устройства', () => {
  const h = fixture(); seed(h, { A: {} }); const run = h.training.open('repeat'); run.current(); run.answer(false);
  h.w.Store.mutate('vocabKnown', { key: 'V:A' });
  const before = JSON.stringify(h.w.Store.state().vocab);
  assert.equal(run.undo().conflict, true); assert.equal(JSON.stringify(h.w.Store.state().vocab), before);
});

test('закрытые с другого устройства слова исключаются из остатка и круга промахов', () => {
  const h = fixture(); seed(h, { A: {}, B: {} }); const run = h.training.open('repeat');
  run.current(); run.answer(false); h.w.Store.mutate('vocabKnown', { key: 'V:A' }); h.w.Store.mutate('vocabKnown', { key: 'V:B' });
  assert.equal(run.current().card, null); assert.equal(run.current().retryCount, 0);
});

test('калибровка после подсказки не закрывает слово, итог и отмена сохраняют ступень', () => {
  const h = fixture({ words: [{ de: 'A', ru: 'A', f: 1 }] }); const run = h.training.open('calib');
  run.current(); run.peek(); assert.equal(run.answer(true).ok, false);
  assert.equal(h.w.Store.state().vocab['V:A|ru'], undefined);
  run.current(); const result = run.finish(); assert.equal(result.known, 0); assert.equal(result.level, 1);
  assert.equal(h.w.Store.state().calibrated, true); assert.equal(run.undo().restored, true);
  assert.equal(h.w.Store.state().calibrated, false); assert.equal(run.current().peeked, true);
});

test('итог меняет ступень один раз, отмена возвращает её и позволяет завершить заново', () => {
  const h = fixture({ words: ['A','B','C','D'].map(de => ({ de, ru: de, f: 1 })) }); const run = h.training.open();
  for (let i = 0; i < 4; i++) { run.current(); run.answer(true); }
  run.current(); assert.equal(run.finish().moved, 'up'); assert.equal(h.w.Store.state().vocabLevel, 2);
  run.finish(); assert.equal(h.w.Store.state().vocabLevel, 2);
  run.undo(); assert.equal(h.w.Store.state().vocabLevel, 1); run.current(); run.answer(true); run.current(); run.finish();
  assert.equal(h.w.Store.state().vocabLevel, 2);
});

test('план соблюдает дневной лимит, долг повторения и текущий урок', () => {
  const words = Array.from({ length: 30 }, (_, i) => ({ de: 'W' + i, ru: 'W' + i, f: 1 }));
  const h = fixture({ words, course: { lessons: [{ n: 19, status: 'ready' }] }, lessons: { 19: { words: [{ de: 'Später', ru: 'позже' }] } }, next: { n: 18 } });
  assert.equal(h.training.plan().length, 10); assert.ok(!h.training.plan().some(c => c.n === 19));
  const run = h.training.open(); for (let i = 0; i < 10; i++) { run.current(); run.answer(true); }
  assert.equal(h.training.summary().newRemaining, 0); assert.equal(h.training.plan('new').length, 0);
  const other = fixture({ words }); seed(other, Object.fromEntries(words.slice(0, 21).map(w => [w.de, {}])));
  assert.equal(other.training.plan('new').length, 0); assert.equal(other.training.plan('repeat').length, 20);
});
