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
    flipCard: () => flips++
  };
  vm.createContext(context);
  vm.runInContext(bind + '\nthis.bind = bindCard;', context);
  context.bind(drag, {});
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

test('ошибка, повторная ошибка и успех после ошибки показывают фактический ранг без новых повышений или понижений', () => {
  const win=require('./env.js').load(['js/progress-data.js','js/srs-config.js','js/sync.js','js/vocab-frames.js']);
  const state=JSON.parse(JSON.stringify(win.Store.state()));
  state.vocab['G:test|ru']={iv:7,stage:'review',due:0,ease:2.5,reps:3,wordSchedule:1};
  win.Store.mutate('restore',{state});
  const it={key:'G:test|ru',dir:'ru',isNew:false}, effects=[];
  const context={window:win,Store:win.Store,S:win.Store.state(),busy:false,view:1,routeId:1,calib:false,peeked:false,
    list:[it],byKey:{},i:0,firstAnswered:{},newSeen:0,newKnown:0,doneCnt:0,total:1,expectedDue:0,
    syncTabs(){},stash(){},advance(source,ok,schedule){effects.push({ok,rank:win.VocabFrames.rank(schedule).id,schedule:JSON.stringify(schedule)})}};
  context.vocabSchedule=item=>win.Store.vocabSchedule(win.Store.state().vocab,item.key.slice(0,-3));
  context.vocabGrade=(item,ok,first,expectedDue)=>{if(first)context.S=win.Store.mutate('vocabWordReview',{key:item.key,ok,expectedDue,day:'2026-10-13'})};
  vm.createContext(context);
  const answer=source.slice(source.indexOf('    function answer(ok, source)'),source.indexOf('    document.onkeydown = function (e)',source.indexOf('    function answer(ok, source)')));
  vm.runInContext(answer+'\nthis.submit=answer;',context);
  assert.equal(win.VocabFrames.rank(context.vocabSchedule(it)).id,'gold');
  context.submit(false,'swipe');
  assert.equal(effects[0].rank,win.VocabFrames.rank(context.vocabSchedule(it)).id);
  context.submit(false,'swipe');
  context.submit(true,'swipe');
  assert.equal(effects[1].schedule,effects[0].schedule);
  assert.equal(effects[2].schedule,effects[0].schedule);
  assert.equal(effects[1].rank,effects[0].rank);
  assert.equal(effects[2].rank,effects[0].rank);
});
