/* Проверяем обработчики карточки без браузера и настоящего прогресса. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/app.js'), 'utf8');
const bind = source.slice(source.indexOf('    function bindCard('), source.indexOf('    function flipCard()'));

function setup(options = {}) {
  const handlers = {}, answers = [], previews = [], timers = [];
  let flips = 0;
  const drag = { style: {}, classList: { add() {}, remove() {} }, setPointerCapture() {},
    addEventListener(type, fn) { handlers[type] = fn; } };
  const context = {
    window: { innerWidth: options.width || 390, innerHeight: 844,
      matchMedia: () => ({ matches: !!options.reduced }),
      VocabFrames: { prepareGesture: () => (direction, amount) => previews.push({ direction, amount }) } },
    vocabSchedule: () => null, list: [{}], i: 0, busy: false, view: 1, routeId: 1,
    calib: !!options.calib, peeked: false, finishGesture: null,
    Date, setTimeout: (fn) => timers.push(fn),
    answer: ok => { answers.push(ok); context.busy = true; },
    answerKnown: () => { answers.push('known'); context.busy = true; },
    flipCard: () => flips++
  };
  vm.createContext(context);
  vm.runInContext(bind + '\nthis.bind = bindCard;', context);
  context.bind(drag, {});
  function event(type, x, y, pointerId = 1) {
    handlers[type]({ type, clientX: x, clientY: y, pointerId, button: 0, isPrimary: true });
  }
  return { context, drag, answers, previews, event, timers, flips: () => flips };
}

test('на ширине 390 и 420 свайп меняет цвет до ответа, принятый ответ только один', () => {
  for (const width of [390, 420]) for (const direction of [-1, 1]) {
    const h = setup({ width });
    h.event('pointerdown', 180, 400);
    h.event('pointermove', 180 + direction * 90, 400);
    assert.deepEqual(h.previews.at(-1), { direction, amount: 1 });
    assert.equal(h.answers.length, 0);
    h.event('pointerup', 180 + direction * 90, 400);
    h.event('lostpointercapture', 180, 400);
    h.event('pointerdown', 180, 400);
    h.event('pointermove', 300, 400);
    h.event('pointerup', 300, 400);
    assert.deepEqual(h.answers, [direction > 0]);
  }
});

test('отмена и потеря захвата даже за порогом не отвечают и возвращают цвет', () => {
  for (const end of ['pointercancel', 'lostpointercapture']) {
    const h = setup();
    h.event('pointerdown', 180, 400);
    h.event('pointermove', 300, 400);
    h.event(end, 300, 400);
    assert.deepEqual(h.answers, []);
    assert.deepEqual(h.previews.at(-1), { direction: 0, amount: 0 });
    assert.equal(h.drag.style.transform, '');
    assert.equal(h.flips(), 0);
  }
});

test('короткий жест не отвечает, тап переворачивает, чужой палец игнорируется', () => {
  const h = setup();
  h.event('pointerdown', 180, 400);
  h.event('pointermove', 195, 400);
  h.event('pointerup', 195, 400);
  assert.deepEqual(h.answers, []);
  assert.equal(h.flips(), 0);
  h.event('pointerdown', 180, 400);
  h.event('pointermove', 310, 400, 2);
  h.event('pointerup', 310, 400, 2);
  h.event('pointerup', 180, 400);
  assert.equal(h.flips(), 1);
  assert.deepEqual(h.answers, []);
});

test('вверх закрывает слово, вниз и вертикальный жест калибровки не отвечают', () => {
  const up = setup();
  up.event('pointerdown', 180, 400);
  up.event('pointermove', 180, 260);
  up.event('pointerup', 180, 260);
  assert.deepEqual(up.answers, ['known']);
  for (const options of [{ calib: true }, {}]) {
    const h = setup(options), y = options.calib ? 260 : 540;
    h.event('pointerdown', 180, 400);
    h.event('pointermove', 180, y);
    h.event('pointerup', 180, y);
    assert.deepEqual(h.answers, []);
  }
});

test('уменьшение движения сохраняет цвет и ответ, отключает вылет', () => {
  const h = setup({ reduced: true });
  h.event('pointerdown', 180, 400);
  h.event('pointermove', 300, 400);
  assert.equal(h.drag.style.transform, '');
  h.event('pointerup', 300, 400);
  h.context.finishGesture('good');
  assert.deepEqual(h.answers, [true]);
  assert.equal(h.timers.length, 0);
  assert.equal(h.drag.style.transform, '');
});

test('предпросмотр ограничен соседними цветами и не меняет расписание', () => {
  const win = require('./env.js').load(['js/vocab-frames.js']);
  win.document.createElement = () => ({ style: {}, setAttribute() {} });
  for (const [iv, lower, upper] of [[0, 'bronze', 'silver'], [7, 'silver', 'platinum'], [100, 'platinum', 'legend']]) {
    const base = { style: {} }, children = [];
    const face = { querySelector: () => base, appendChild: child => children.push(child) };
    const schedule = { iv }, original = JSON.stringify(schedule);
    const preview = win.VocabFrames.prepareGesture({ querySelectorAll: () => [face] }, schedule);
    assert.ok(children[0].className.endsWith('rank-' + lower));
    assert.ok(children[1].className.endsWith('rank-' + upper));
    preview(1, .5);
    assert.equal(base.style.opacity, .5);
    assert.equal(children[1].style.opacity, .5);
    assert.equal(children[0].style.opacity, 0);
    preview(-1, 1);
    assert.equal(children[0].style.opacity, 1);
    assert.equal(children[1].style.opacity, 0);
    preview(0, 0);
    assert.equal(base.style.opacity, 1);
    assert.equal(JSON.stringify(schedule), original);
  }
});
