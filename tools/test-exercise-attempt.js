const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');

function fixture() {
  const w = env.load(['js/progress-data.js', 'js/srs-config.js', 'js/sync.js', 'js/practice.js', 'js/sessions.js', 'js/review.js', 'js/exercise-attempt.js']);
  const ex = { type: 'choice', q: 'Der Mann ist …', opts: ['nett', 'nette'], a: 0, why: 'После ist без окончания.' };
  const rendered = [];
  // Адаптер движка моделирует порядок его событий: сначала черновик, затем результат.
  const engine = { render(ex, host, done, options) {
    const api = { result: options.draft && options.draft.result || null, getDraft: () => options.draft || {},
      check() { const result = { ok: true, verdict: 'correct', usedHint: options.isHinted() }; this.result = result;
        options.onDraft({ choice: 0, result }); done(true, result); } };
    rendered.push({ api, options, done }); return api;
  } };
  const attempts = w.ExerciseAttempt.create({ store: w.Store, practice: w.Practice, sessions: w.Sessions, review: w.ReviewPlan, engine });
  return { w, ex, attempts, rendered, day: () => w.Practice.create(18, 0, [ex]) };
}

test('попытка сохраняет ввод и подсказку, повторная проверка и восстановление не считают ответ снова', () => {
  const h = fixture(), run = h.day(); let notified = 0;
  let attempt = h.attempts.day(run, 0, h.ex, {}, { onResult: () => notified++ });
  h.rendered[0].options.onDraft({ choice: 0 }); attempt.hint(); attempt.check(); attempt.check();
  assert.equal(notified, 1); assert.equal(h.w.Store.state().totalTried, 1);
  assert.equal(run.records[0].result.usedHint, true);
  const loaded = h.w.Practice.load(18, 0, [h.ex]);
  attempt = h.attempts.day(loaded, 0, h.ex, {}, {});
  assert.equal(attempt.state().result.ok, true); assert.equal(attempt.state().canCheck, false);
  assert.equal(h.w.Store.state().totalTried, 1);
});

test('сбой после записи результата в черновик восстанавливает зачёт и очередь ошибок дня', () => {
  const h = fixture(), run = h.day();
  run.records[0] = { draft: { choice: 1, result: { ok: false, verdict: 'incorrect' } } }; h.w.Practice.save(run);
  const attempt = h.attempts.day(run, 0, h.ex, {}, {});
  assert.equal(attempt.state().result.ok, false); assert.equal(h.w.Store.state().totalTried, 1);
  assert.ok(h.w.Store.state().srs['L18D0-0']);
  h.attempts.day(run, 0, h.ex, {}, {}); assert.equal(h.w.Store.state().totalTried, 1);
});

test('неоднозначный перевод записывается без доказанной ошибки', () => {
  const h = fixture(), run = h.day(); h.attempts.day(run, 0, h.ex, {}, {});
  h.rendered[0].done(false, { ok: false, verdict: 'needs-review' });
  assert.equal(h.w.Store.state().totalTried, 0); assert.equal(h.w.Store.state().totalUncertain, 1);
  assert.equal(h.w.Store.state().srs['L18D0-0'], undefined);
});

test('колбэки покинутой, пропущенной или удалённой попытки не меняют прогресс', () => {
  for (const kind of ['inactive', 'omitted', 'deleted']) {
    const h = fixture(), run = h.day(); let active = true;
    const attempt = h.attempts.day(run, 0, h.ex, {}, { active: () => active });
    if (kind === 'inactive') active = false;
    if (kind === 'omitted') run.records[0].omitted = 'skipped';
    if (kind === 'deleted') h.w.Store.mutate('exerciseDelete', { id: 'L18D0-0', ex: h.ex, reason: 'Ошибка' });
    attempt.check(); attempt.hint(); h.rendered[0].options.onDraft({ choice: 0 });
    h.rendered[0].done(true, { ok: true, verdict: 'correct' });
    assert.equal(h.w.Store.state().totalTried, 0); assert.equal(run.records[0].result, undefined);
    assert.equal(run.records[0].draft, undefined);
  }
});

test('повтор атомарно считает ответ и срок, восстановление не повторяет операцию', () => {
  const h = fixture(); h.w.Store.mutate('srsAdd', { id: 'L18D0-0', ex: h.ex, n: 18 });
  const r = h.w.Store.state().srs['L18D0-0'], run = h.w.ReviewPlan.create([{ id: 'L18D0-0', r }], h.w.Store.state());
  const attempt = h.attempts.review(run, 0, {}, {}); attempt.check();
  assert.equal(h.w.Store.state().totalTried, 1); assert.equal(h.w.Store.state().srs['L18D0-0'].box, 1);
  h.attempts.review(h.w.Sessions.load('review'), 0, {}, {});
  assert.equal(h.w.Store.state().totalTried, 1); assert.equal(h.w.Store.state().srs['L18D0-0'].box, 1);
});

test('восстановленный результат устаревшего повтора не меняет новое расписание', () => {
  const h = fixture(); h.w.Store.mutate('srsAdd', { id: 'L18D0-0', ex: h.ex, n: 18 });
  const r = h.w.Store.state().srs['L18D0-0'], run = h.w.ReviewPlan.create([{ id: 'L18D0-0', r }], h.w.Store.state());
  run.records[0] = { draft: { choice: 0, result: { ok: true, verdict: 'correct' } } };
  h.w.Store.mutate('srsHit', { id: 'L18D0-0', ok: true });
  const before = JSON.stringify(h.w.Store.state().srs);
  h.attempts.review(run, 0, {}, {});
  assert.equal(h.w.Store.state().totalTried, 1); assert.equal(JSON.stringify(h.w.Store.state().srs), before);
});
