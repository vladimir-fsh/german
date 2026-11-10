const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env');
const files = ['js/progress-data.js', 'js/srs-config.js', 'js/sync.js', 'js/sessions.js', 'data/phrases.js', 'js/vocab-training.js', 'js/phrase-training.js'];
function fixture(storage) {
  const clock = { skew: 0 }, w = env.load(files, { storage, clock });
  const options = { store: w.Store, sessions: w.Sessions, day: () => '2026-11-10', now: () => Date.now() + clock.skew };
  const training = w.PhraseTraining.create(options);
  const words = w.VocabTraining.create({ ...options, course: { lessons: [] }, words: [{ de: 'Test', ru: 'тест' }], nextLesson: () => null, shuffle: a => a });
  return { w, clock, training, words };
}
test('140 фраз в 10 темах: старые идентификаторы сохранены, новые фразы имеют переводы', () => {
  const { w } = fixture();
  assert.equal(w.PHRASES.length, 140);
  assert.equal(new Set(w.PHRASES.map(p => p.id)).size, 140);
  for (let i = 1; i <= 30; i++) assert.equal(w.PHRASES.filter(p => p.situation === i).length, 3);
  assert.equal(w.PHRASE_TOPICS.length, 10);
  assert.equal(new Set(w.PHRASES.map(p => p.de)).size, 140);
  for (let i = 1; i <= 30; i++) for (let j = 1; j <= 3; j++) {
    assert.ok(w.PHRASES.some(p => p.id === 's' + String(i).padStart(2, '0') + '-' + j));
  }
  w.PHRASES.forEach(p => assert.ok(p.de && p.ru && p.context && p.title && w.PHRASE_TOPICS.some(t => t.id === p.topic)));
});
test('отдельные очереди и уровень слов; промах повторяется без нового изменения расписания', () => {
  const { w, training, words } = fixture();
  const wordRun = words.open(''); wordRun.current(); wordRun.peek();
  const run = training.open('');
  assert.equal(run.current().total, 10);
  const first = run.current().card.key;
  assert.equal(first, 'P:s01-1|ru'); run.peek(); run.answer(false);
  const missed = JSON.stringify(w.Store.state().vocab[first]);
  assert.ok(w.Store.state().vocab[first].due >= Date.now() + 12 * 3600000 - 1000);
  for (let i = 1; i < 10; i++) { run.current(); run.answer(true); }
  assert.equal(run.current().retry, true);
  run.answer(true); assert.equal(run.current().card, null); run.finish();
  assert.equal(JSON.stringify(w.Store.state().vocab[first]), missed);
  assert.equal(training.plan('').length, 10);
  assert.equal(words.summary().newRemaining, 10);
  assert.equal(w.Store.state().vocabLevel, 1);
  assert.equal(w.Sessions.load('vocab').peeked, true);
  assert.equal(w.Sessions.load('phrases'), null);
});
test('перезагрузка, экспорт и импорт сохраняют оборот, очередь промахов и расписание фраз', () => {
  const h = fixture(); let run = h.training.open('');
  run.current(); run.answer(false); run.current(); run.peek();
  const backup = JSON.parse(h.w.Store.exportBackup());
  assert.equal(backup.sessions.phrases.peeked, true);
  const restored = fixture(h.w.localStorage._dump());
  run = restored.training.open('');
  assert.equal(run.current().card.key, 'P:s01-2|ru');
  assert.equal(run.current().peeked, true);
  assert.equal(run.current().retryCount, 1);
  const other = fixture();
  other.w.Store.mutate('restore', { state: backup.state }); other.w.Sessions.importSessions(backup.sessions);
  assert.equal(other.training.open('').current().card.key, 'P:s01-2|ru');
});
test('отмена последнего ответа после итога; ранние ответы не увеличивают интервал', () => {
  const h = fixture(); let run = h.training.open('');
  for (let i = 0; i < 10; i++) { run.current(); run.answer(true); }
  run.current(); run.finish();
  assert.equal(run.undo().restored, true);
  assert.equal(run.current().card.key, 'P:s20-1|ru');
  run.answer(true); run.current(); run.finish();
  assert.equal(h.training.plan('repeat').length, 0);
  h.clock.skew = 11 * 60000;
  run = h.training.open('repeat'); assert.equal(run.current().total, 10);
  const repeatedKey = run.current().card.key;
  run.answer(true);
  assert.equal(h.w.Store.state().vocab[repeatedKey].stage, 'review');
});
test('ошибка другого устройства препятствует отмене; длинный интервал проверяет две стороны', () => {
  const h = fixture(), state = JSON.parse(JSON.stringify(h.w.Store.state()));
  state.vocab['P:s01-1|ru'] = { wordSchedule: 1, iv: 30, stage: 'review', due: 0, reps: 3, ease: 2.5 };
  h.w.Store.mutate('restore', { state });
  let run = h.training.open('repeat'); run.current(); run.answer(true);
  assert.equal(run.current().card.key, 'P:s01-1|de');
  run = h.training.open('repeat'); assert.equal(run.current().card.key, 'P:s01-1|de');
  run.answer(true); run.current(); run.finish();
  assert.equal(h.w.Store.state().vocab['P:s01-1|ru'].pairRu, false);
  h.w.Store.mutate('vocabKnown', { key: 'P:s01-1' });
  assert.equal(run.undo().conflict, true);
});

test('несколько десяток новых фраз в тот же день; повторение ограничено двадцатью', () => {
  const h = fixture();
  for (let batch = 0; batch < 3; batch++) {
    const run = h.training.open('');
    assert.equal(run.current().total, 10);
    for (let i = 0; i < 10; i++) { run.current(); run.answer(true); }
    run.current(); run.finish();
  }
  assert.equal(h.training.summary().started, 30);
  assert.equal(h.training.plan('').length, 4);
  h.clock.skew = 11 * 60000;
  assert.equal(h.training.plan('repeat').length, 20);
  assert.equal(h.training.open('repeat').current().total, 20);
});

test('новые фразы идут одной темой до её конца, повторы смешивают темы', () => {
  const h = fixture();
  const seen = [];
  while (h.training.summary().fresh) {
    const plan = h.training.plan('');
    assert.ok(plan.length > 0 && plan.length <= 10);
    assert.equal(new Set(plan.map(card => card.w.topic)).size, 1);
    const topic = plan[0].w.topic;
    if (seen[seen.length - 1] !== topic) { assert.ok(!seen.includes(topic)); seen.push(topic); }
    const run = h.training.open('');
    for (let i = 0; i < plan.length; i++) { run.current(); run.answer(true); }
    run.current(); run.finish();
  }
  assert.deepEqual(seen, Array.from(h.w.PHRASE_TOPICS, t => t.id));
  h.clock.skew = 11 * 60000;
  const repeated = h.training.plan('repeat');
  assert.equal(repeated.length, 20);
  assert.ok(new Set(repeated.map(card => card.w.topic)).size > 1);
});
test('смешанный старый черновик сохраняет порядок после добавления тем', () => {
  const h = fixture();
  const keys = ['P:s01-1|ru', 'P:s02-1|ru', 'P:s03-1|ru'];
  h.w.Sessions.save('phrases', { at: Date.now(), i: 0, keys, mode: '', newKeys: keys, peeked: true });
  const run = h.training.open('');
  assert.equal(run.current().total, 3);
  assert.equal(run.current().peeked, true);
  for (const key of keys) { assert.equal(run.current().card.key, key); run.answer(true); }
  assert.equal(run.current().card, null);
});

test('фазы считают слова один раз, короткое обучение важнее старого интервала', () => {
  const h = fixture(), state = JSON.parse(JSON.stringify(h.w.Store.state()));
  const samples = [
    { stage: 'learning', step: 1, iv: 30 },
    { stage: 'learning', step: 0, iv: 100 },
    { iv: 1 }, { iv: 3 }, { iv: 7 }, { iv: 30, pairRu: true }, { iv: 100 }, { learned: true }
  ];
  samples.forEach((value, i) => {
    const base = 'P:' + h.w.PHRASES[i].id;
    state.vocab[base + '|ru'] = { wordSchedule: 1, stage: 'review', reps: 2, due: 1000, t: 0, ...value };
    state.vocab[base + '|de'] = { iv: 100, learned: true };
  });
  h.w.Store.mutate('restore', { state });
  const stats = h.training.summary();
  assert.equal(stats.stages.reduce((n, s) => n + s.count, 0), 140);
  assert.equal(stats.stages[0].count, 132);
  stats.stages.slice(1).forEach(s => assert.equal(s.count, 1));
  assert.equal(h.words.summary().stages[0].count, 1);
  assert.equal(h.w.VocabTraining.interval({ stage: 'learning', step: 0, t: 1000, due: 43201000, iv: 100 }), 'После ошибки · 12 ч');
  assert.equal(h.w.VocabTraining.interval({ stage: 'learning', step: 1, t: 1000, due: 601000 }), 'Обучение · 10 мин');
  assert.equal(h.w.VocabTraining.interval({ stage: 'review', iv: 30, pairRu: true }), 'Интервал: 30 дн. · ½ шага');
});
