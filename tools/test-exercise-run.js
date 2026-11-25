const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');

const FILES = ['js/progress-data.js', 'js/srs-config.js', 'js/sync.js', 'js/practice.js', 'js/sessions.js', 'js/review.js', 'js/exercise-attempt.js', 'js/exercise-run.js'];
const exercises = [0, 1, 2, 3].map(k => ({ type: 'choice', q: 'Q' + k, opts: ['a', 'b'], a: 0, why: 'почему' }));

function engine() {
  return { render(ex, host, done, options) {
    const api = { result: options.draft && options.draft.result || null, getDraft: () => options.draft || {},
      check() { const result = { ok: this.ok !== false, verdict: this.ok === false ? 'incorrect' : 'correct', usedHint: options.isHinted() };
        this.result = result; options.onDraft({ choice: 0, result }); done(result.ok, result); } };
    return api;
  } };
}
function load(storage) {
  const w = env.load(FILES, { storage });
  const runs = w.ExerciseRun.create({ store: w.Store, engine: engine(), practice: w.Practice, sessions: w.Sessions, review: w.ReviewPlan });
  return { w, runs, alive: () => true };
}
function day(h, alive) { return h.runs.day(18, 0, exercises, alive || h.alive); }
function answer(run) { run.check(); }

test('день: ответ, пропуск, удаление и возобновление после перезагрузки', () => {
  const h = load(), run = day(h);
  let item = run.show({}, () => {});
  assert.deepEqual([item.index, item.position, item.count, item.id], [0, 0, 4, 'L18D0-0']);
  assert.equal(run.next(), false);
  answer(run); assert.equal(run.state().answered, true);
  assert.equal(run.skip(), false);
  assert.equal(run.next(), true);
  item = run.show({}, () => {});
  assert.equal(run.skip(), true);
  item = run.show({}, () => {});
  assert.equal(item.index, 2);
  assert.equal(run.remove(''), false);
  assert.equal(run.remove('Ошибка в задании'), true);
  assert.equal(h.w.Store.state().deletedExercises['L18D0-2'].reason, 'Ошибка в задании');
  item = run.show({}, () => {});
  assert.deepEqual([item.index, item.position, item.count], [3, 2, 3]);

  const again = load(h.w.localStorage._dump()), resumed = day(again);
  item = resumed.show({}, () => {});
  assert.equal(item.index, 3);
  const stats = again.w.Practice.stats(again.w.Practice.load(18, 0, exercises));
  assert.deepEqual([stats.answered, stats.skipped, stats.deleted], [1, 1, 1]);
});

test('день: возобновление с готовым ответом показывает его без повторного зачёта', () => {
  const h = load(), run = day(h);
  run.show({}, () => {}); answer(run);
  const again = load(h.w.localStorage._dump()), resumed = day(again);
  resumed.show({}, () => {});
  assert.equal(resumed.state().answered, true); assert.equal(resumed.state().canCheck, false);
  assert.equal(again.w.Store.state().totalTried, 1);
});

test('день: после ухода с экрана и после итога действия ничего не меняют', () => {
  const h = load(); let open = true;
  const run = day(h, () => open);
  run.show({}, () => {}); answer(run);
  open = false;
  assert.equal(run.next(), false); assert.equal(run.show({}, () => {}), null); assert.equal(run.finished, false);
  open = true;
  const done = day(load(), () => true);
  done.show({}, () => {}); done.finish(true);
  assert.equal(done.show({}, () => {}), null); assert.equal(done.finish(true), null);
});

test('день: прохождение без пропусков записывает dayDone и снимает черновик', () => {
  const h = load(), run = day(h); let item;
  while ((item = run.show({}, () => {}))) { answer(run); run.next(); }
  assert.equal(run.finished, true);
  assert.deepEqual([run.outcome.manual, run.outcome.of, run.outcome.stats.correct], [false, 4, 4]);
  const S = h.w.Store.state();
  assert.equal(S.done.L18D0.score, 4); assert.equal(S.done.L18D0.of, 4); assert.equal(S.streak, 1);
  assert.equal(h.w.Practice.load(18, 0, exercises), null);
});

test('день: пропуск даёт практику без отметки дня, а задание возвращается в новом прохождении', () => {
  const h = load(), run = day(h);
  run.show({}, () => {}); answer(run); run.next();
  run.show({}, () => {}); run.skip();
  let item;
  while ((item = run.show({}, () => {}))) { answer(run); run.next(); }
  assert.equal(run.outcome.stats.skipped, 1); assert.equal(run.outcome.of, 3);
  const S = h.w.Store.state();
  assert.equal(S.done.L18D0, undefined); assert.equal(S.attempts.at(-1).partial, true);
  const fresh = day(h);
  assert.equal(fresh.show({}, () => {}).index, 0);

  h.w.Store.mutate('dayDone', { n: 18, di: 0, score: 4, of: 4 });
  const second = day(h);
  second.show({}, () => {}); second.skip();
  while ((item = second.show({}, () => {}))) { answer(second); second.next(); }
  assert.equal(h.w.Store.state().done.L18D0.score, 4);
});

test('день: если ничего не отвечено, итог не пишется в прогресс', () => {
  const h = load(), run = day(h);
  while (run.show({}, () => {})) run.skip();
  assert.equal(run.outcome.of, 0);
  assert.equal(h.w.Store.state().attempts.length, 0); assert.equal(h.w.Store.state().streak, 0);
  assert.equal(h.w.Practice.load(18, 0, exercises), null);
});

test('день: ручная отметка считает только сохранённые ответы', () => {
  const h = load(), run = day(h);
  run.show({}, () => {}); answer(run); run.next();
  run.show({}, () => {});
  const outcome = run.finish(true);
  assert.deepEqual([outcome.manual, outcome.of, outcome.stats.correct], [true, 1, 1]);
  const S = h.w.Store.state();
  assert.equal(S.done.L18D0.manual, true); assert.equal(S.done.L18D0.of, 1);
  assert.equal(S.attempts.at(-1).manual, true);
  assert.equal(h.w.Practice.load(18, 0, exercises), null);
});

test('день: ручная отметка без ответов отмечает день и не пишет историю', () => {
  const h = load(), run = day(h);
  run.show({}, () => {});
  assert.equal(run.finish(true).of, 0);
  const S = h.w.Store.state();
  assert.equal(S.done.L18D0.manual, true); assert.equal(S.attempts.length, 0);
});

function reviewFixture() {
  const h = load();
  exercises.slice(0, 3).forEach((ex, k) => h.w.Store.mutate('srsAdd', { id: 'L18D0-' + k, ex, n: 18 }));
  const t = Date.now() + 10 * 864e5;
  return Object.assign(h, { due: () => Object.keys(h.w.Store.state().srs).map(id => ({ id, r: h.w.Store.state().srs[id] })), t });
}

test('повтор: проходит очередь, сохраняет позицию и очищает сессию в конце', () => {
  const h = reviewFixture(), run = h.runs.review(h.due, h.alive);
  assert.equal(run.empty, false);
  let item = run.show({}, () => {});
  assert.deepEqual([item.position, item.count], [0, 3]);
  answer(run); run.next();
  const again = load(h.w.localStorage._dump()), resumed = again.runs.review(() => { throw new Error('новая очередь не нужна'); }, h.alive);
  item = resumed.show({}, () => {});
  assert.equal(item.position, 1);
  while ((item = resumed.show({}, () => {}))) { answer(resumed); resumed.next(); }
  assert.equal(resumed.finished, true); assert.equal(resumed.skip, undefined);
  assert.equal(again.w.Sessions.load('review'), null);
});

test('повтор: устаревшее задание пропускается, а уже проверенное остаётся', () => {
  const h = reviewFixture(), run = h.runs.review(h.due, h.alive);
  run.show({}, () => {}); answer(run);
  h.w.Store.mutate('srsHit', { id: 'L18D0-1', ok: true });
  h.w.Store.mutate('srsHit', { id: 'L18D0-2', ok: true });
  assert.equal(run.show({}, () => {}).position, 0);
  run.next();
  assert.equal(run.show({}, () => {}), null); assert.equal(run.finished, true);
});

test('повтор: пустая очередь не создаёт сессию', () => {
  const h = load(), run = h.runs.review(() => [], h.alive);
  assert.equal(run.empty, true); assert.equal(h.w.Sessions.load('review'), null);
});
