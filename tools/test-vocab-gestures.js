/* Проверяем обработчики карточки без браузера и настоящего прогресса. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/app.js'), 'utf8');
const bind = source.slice(source.indexOf('    function bindCard('), source.indexOf('    function flipCard()'));

function setup(options = {}) {
  const handlers = {}, answers = [], frames = [], timers = [];
  let flips = 0;
  const drag = { style: {}, classList: { add() {}, remove() {} }, setPointerCapture() {},
    addEventListener(type, fn) { handlers[type] = fn; } };
  const context = {
    window: { innerWidth: options.width || 390, innerHeight: 844,
      matchMedia: () => ({ matches: !!options.reduced }),
      VocabFrames: { update: (host, schedule) => frames.push(schedule) } },
    vocabSchedule: () => null, list: [{}], i: 0, busy: false, view: 1, routeId: 1,
    calib: !!options.calib, peeked: false, finishGesture: null,
    Date, setTimeout: (fn) => timers.push(fn),
    answer: ok => { answers.push(ok); context.busy = true; },
    answerKnown: () => { answers.push('known'); context.busy = true; },
    undoPrevious: () => { if (options.canUndo) answers.push('undo'); },
    flipCard: () => flips++
  };
  vm.createContext(context);
  vm.runInContext(bind + '\nthis.bind = bindCard;', context);
  const body = options.scrollBody;
  context.bind(drag, body ? { classList: { contains: () => true }, querySelector: () => body } : {});
  function event(type, x, y, pointerId = 1) {
    handlers[type]({ type, clientX: x, clientY: y, pointerId, button: 0, isPrimary: true });
  }
  return { context, drag, answers, frames, event, timers, flips: () => flips };
}

test('на ширине 390 и 420 свайп сохраняет ранг до ответа, принятый ответ только один', () => {
  for (const width of [390, 420]) for (const direction of [-1, 1]) {
    const h = setup({ width });
    h.event('pointerdown', 180, 400);
    h.event('pointermove', 180 + direction * 90, 400);
    assert.equal(h.frames.length, 0);
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
    assert.equal(h.frames.length, 0);
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

test('обе стороны рамки обновляются по реальному расписанию, включая падение через несколько рангов', () => {
  const win = require('./env.js').load(['js/vocab-frames.js']);
  win.document.createElement = () => ({ style: {}, setAttribute() {} });
  function face() {
    const classes = new Set(['vranked','rank-platinum']); let frame = {};
    return {classes,classList:{contains:c=>classes.has(c),remove:c=>classes.delete(c),add:(...cs)=>cs.forEach(c=>classes.add(c))},
      querySelector:()=>frame,removeChild:()=>{frame=null},appendChild:f=>{frame=f},frame:()=>frame};
  }
  const front=face(),back=face(), host={querySelectorAll:()=>[front,back]};
  for (const schedule of [{iv:30,pairRu:true},{iv:30,stage:'learning'},{iv:3,stage:'review'},{iv:7,stage:'review'},{iv:100,learned:true}]) {
    const rank=win.VocabFrames.rank(schedule).id, before=JSON.stringify(schedule);
    win.VocabFrames.update(host,schedule);
    for (const side of [front,back]) {
      assert.ok(side.classes.has('rank-'+rank));
      assert.equal([...side.classes].filter(c=>c.startsWith('rank-')).length,1);
    }
    assert.equal(JSON.stringify(schedule),before);
  }
});

test('эффект ответа использует переданное расписание, а не соседний цвет', () => {
  const h=setup(); const schedule={iv:7,stage:'review'};
  h.context.finishGesture('good',schedule);
  assert.equal(h.frames.at(-1),schedule);
});

/* Настоящий экран, обработчики свайпов, журнал и сохранение сессии. */
function training(words, storage) {
  const env = require('./env.js');
  const win = env.load(['js/progress-data.js', 'js/srs-config.js', 'js/sync.js',
    'js/sessions.js', 'js/vocab-frames.js'], { storage });
  win.COURSE = { lessons: [] };
  win.VOCAB = words.map(de => ({ de, ru: '→ ' + de }));
  if (!storage) {
    const state = JSON.parse(JSON.stringify(win.Store.state()));
    for (const de of words) {
      state.vocab['V:' + de + '|ru'] = { iv: 7, stage: 'review', due: 0, ease: 2.5, reps: 3, wordSchedule: 1 };
    }
    win.Store.mutate('restore', { state });
  }
  const timers = [];
  function el(tag, cls = '', html = '') {
    const children = [], classes = new Set(cls.split(' ')), handlers = {};
    const node = {
      tag, style: {}, handlers, children, textContent: html,
      appendChild(child) { children.push(child); },
      insertAdjacentHTML(position, value) { html += value; },
      set innerHTML(value) { html = value; children.length = 0; },
      get innerHTML() { return html; },
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        contains(name) { return classes.has(name); },
        toggle(name) { if (classes.has(name)) classes.delete(name); else classes.add(name); }
      },
      getBoundingClientRect: () => ({ top: 22 }),
      addEventListener(type, fn) { handlers[type] = fn; },
      querySelector(selector) {
        if (selector === '.cnt' || selector === 'i') return { style: {} };
        for (const child of children) {
          if (child.classList.contains(selector.slice(1))) return child;
          const nested = child.querySelector(selector);
          if (nested) return nested;
        }
        return null;
      }
    };
    return node;
  }
  const app = el('main'), root = el('html');
  Object.assign(win, { innerHeight: 844, innerWidth: 390, scrollTo() {} });
  win.document.documentElement = root;
  win.VocabFrames.decorate = () => {};
  const effects = [];
  win.VocabFrames.update = (host, schedule) => effects.push(win.VocabFrames.rank(schedule).id);
  const context = vm.createContext({ window: win, document: win.document, Store: win.Store, app,
    S: win.Store.state(), routeId: 0, working: false, E: { shuffle: items => items }, el, esc: x => x,
    findNext: () => null, syncTabs() {}, showResultLayout() { app.classList.add('result-screen'); },
    setTimeout: fn => timers.push(fn) });
  vm.runInContext(source.slice(source.indexOf('  var CFG = '), source.indexOf('  /* ---------- предупреждение')), context);
  context.viewVocab('repeat');
  function swipe(dx, dy) {
    const drag = app.querySelector('.vdrag');
    assert.ok(drag, 'карточка доступна для свайпа');
    for (const [type, x, y] of [['pointerdown', 180, 400], ['pointermove', 180 + dx, 400 + dy],
      ['pointerup', 180 + dx, 400 + dy]]) {
      drag.handlers[type]({ type, clientX: x, clientY: y, pointerId: 1 });
    }
    while (timers.length) timers.shift()();
  }
  const card = () => app.querySelector('.vfront')?.querySelector('.vword')?.textContent;
  const journal = () => JSON.stringify(Object.entries(win.localStorage._dump())
    .filter(([key]) => key.startsWith('de-b1-oplog-')));
  return { win, app, root, swipe, card, effects, journal };
}

test('свайп вверх после просмотра закрывает обе стороны слова и исключает его из повторов', () => {
  const h = training(['A', 'B']);
  assert.equal(h.card(), '→ A');
  h.swipe(0, 0);
  h.swipe(0, -140);
  for (const dir of ['ru', 'de']) assert.equal(h.win.Store.state().vocab['V:A|' + dir]?.learned, true);
  assert.equal(h.card(), '→ B');
  h.swipe(-100, 0);
  const resumed = training(['A', 'B'], h.win.localStorage._dump());
  assert.equal(resumed.card(), '→ B');
  resumed.swipe(100, 0);
  assert.equal(resumed.card(), undefined);
  assert.ok(resumed.app.classList.contains('result-screen'));
  assert.equal(training(['A', 'B'], resumed.win.localStorage._dump()).card(), undefined);
});

test('промахи возвращаются после первого круга и после перезагрузки до свайпа вправо, без записи в прогресс', () => {
  const h = training(['A', 'B', 'C']);
  h.swipe(-100, 0);
  assert.equal(h.effects.at(-1), 'bronze');
  assert.equal(h.card(), '→ B');
  h.swipe(-100, 0);
  assert.equal(h.card(), '→ C');
  h.swipe(100, 0);
  assert.equal(h.card(), '→ A');
  const resumed = training(['A', 'B', 'C'], h.win.localStorage._dump());
  assert.equal(resumed.card(), '→ A');
  const schedule = resumed.win.Store.state().vocab['V:A|ru'];
  assert.equal(schedule.due - schedule.t, 12 * 3600000);
  const progress = JSON.stringify(resumed.win.Store.state());
  const operations = resumed.journal();
  resumed.swipe(-100, 0);
  assert.equal(resumed.card(), '→ B');
  resumed.swipe(100, 0);
  assert.equal(resumed.card(), '→ A');
  resumed.swipe(100, 0);
  assert.ok(resumed.app.classList.contains('result-screen'));
  assert.equal(JSON.stringify(resumed.win.Store.state()), progress);
  assert.equal(resumed.journal(), operations);
});

test('свайп вверх в круге промахов убирает карточку, а отмена на итоге возвращает только её', () => {
  const h = training(['A']);
  h.swipe(-100, 0);
  const progress = JSON.stringify(h.win.Store.state());
  const operations = h.journal();
  h.swipe(0, -140);
  assert.ok(h.app.classList.contains('result-screen'));
  const { handlers } = h.app.querySelector('.result-card');
  handlers.touchstart({ touches: [{ clientX: 180, clientY: 300 }], target: { closest: () => null } });
  handlers.touchmove({ touches: [{ clientX: 180, clientY: 440 }] });
  handlers.touchend();
  assert.equal(h.card(), '→ A');
  assert.ok(h.root.classList.contains('vocab-training'));
  assert.equal(JSON.stringify(h.win.Store.state()), progress);
  assert.equal(h.journal(), operations);
});

test('прокрутка страницы блокируется на карточках и восстанавливается на итоговом экране', () => {
  const css = fs.readFileSync(require('node:path').join(__dirname, '../css/app.css'), 'utf8');
  assert.match(css, /html\.vocab-training,\s*html\.vocab-training body\s*\{[^}]*overflow:\s*hidden/);
  const h = training(['A']);
  assert.ok(h.root.classList.contains('vocab-training'));
  h.swipe(0, -140);
  assert.ok(!h.root.classList.contains('vocab-training'));
});

test('длинный оборот прокручивается вертикально без ответа, горизонтальный свайп остаётся', () => {
  const body = { scrollHeight: 600, clientHeight: 300, scrollTop: 0 };
  const h = setup({ scrollBody: body });
  h.event('pointerdown', 180, 400);
  h.event('pointermove', 180, 250);
  h.event('pointerup', 180, 250);
  assert.equal(body.scrollTop, 150);
  assert.deepEqual(h.answers, []);
  assert.equal(h.flips(), 0);
  h.event('pointerdown', 180, 400);
  h.event('pointermove', 280, 400);
  h.event('pointerup', 280, 400);
  assert.deepEqual(h.answers, [true]);
});


test('свайп вниз возвращает слово, короткий и отменённый жест ничего не меняют', () => {
  const h = setup({canUndo:true});
  h.event('pointerdown',180,300); h.event('pointermove',180,340); h.event('pointerup',180,340);
  assert.deepEqual(h.answers,[]);
  h.event('pointerdown',180,300); h.event('pointermove',180,440); h.event('pointercancel',180,440);
  assert.deepEqual(h.answers,[]);
  h.event('pointerdown',180,300); h.event('pointermove',180,440); h.event('pointerup',180,440);
  assert.deepEqual(h.answers,['undo']);
});

test('длинный оборот: отмена только при начале жеста у верхнего края', () => {
  for (const top of [0,100]) {
    const body={scrollHeight:600,clientHeight:300,scrollTop:top};
    const h=setup({canUndo:true,scrollBody:body});
    h.event('pointerdown',180,300); h.event('pointermove',180,440); h.event('pointerup',180,440);
    assert.deepEqual(h.answers,top===0?['undo']:[]);
  }
});
