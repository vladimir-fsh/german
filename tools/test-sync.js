/* Тесты свёртки и загрузки состояния. Запуск: node tools/test-sync.js
   Зависимостей нет, окружение браузера подделывает tools/env.js. */
var env = require("./env.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "\n       " + extra : "")); }
}
function eq(name, a, b) { ok(name, a === b, "получено " + JSON.stringify(a) + ", ожидалось " + JSON.stringify(b)); }

var SYNC = ["js/srs-config.js", "js/sync.js"];

/* журнал чужого устройства: один закрытый день урока */
function log(device, lcFrom, entries) {
  var ops = entries.map(function (e, i) {
    return { type: e.type, device: device, seq: i + 1, lc: lcFrom + i + 1, t: e.t, n: e.n, di: e.di, score: e.score, of: e.of, key: e.key, ok: e.ok, day: e.day };
  });
  return { device: device, seq: ops.length, lc: lcFrom + ops.length, ops: ops, at: Date.now() };
}

var T0 = Date.UTC(2026, 8, 18);

/* ---------- 1. чистое устройство поднимает прогресс из облака ---------- */
async function testColdBoot() {
  console.log("\nчистое устройство, весь прогресс лежит в облаке");
  var db = env.makeDb();
  db._seed("sync/snapshot", {
    v: 4, at: T0, by: "dOld",
    cursor: { dOld: 0 },
    state: { v: 4, done: { L18D0: { at: T0, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: false, streak: 1, lastDay: "2026-09-18", totalTried: 14, totalCorrect: 12, resetAt: 0 }
  });
  db._seed("oplogs/dA", log("dA", 0, [
    { type: "dayDone", n: 18, di: 1, score: 14, of: 17, t: T0 + 864e5 },
    { type: "dayDone", n: 18, di: 2, score: 12, of: 16, t: T0 + 2 * 864e5 }
  ]));
  db._seed("oplogs/dB", log("dB", 50, [
    { type: "dayDone", n: 18, di: 3, score: 10, of: 17, t: T0 + 3 * 864e5 },
    { type: "dayDone", n: 18, di: 4, score: 9, of: 18, t: T0 + 4 * 864e5 }
  ]));

  var win = env.load(SYNC, { db: db });           /* localStorage пуст — как после чистки Safari */
  var before = win.Store.state();
  eq("до сети дней пройдено", Object.keys(before.done).length, 0);

  win.Store.connect();
  await env.settle(30);

  var after = win.Store.state();
  eq("после сети дней пройдено", Object.keys(after.done).length, 5);
  ok("день 4 на месте", !!after.done.L18D4);
  ok("день из снапшота не потерян", !!after.done.L18D0);
}

/* ---------- 2. журналы пришли раньше снапшота ---------- */
async function testLogsFirst() {
  console.log("\nжурналы приходят раньше снапшота");
  var db = env.makeDb();
  db._seed("oplogs/dA", log("dA", 0, [{ type: "dayDone", n: 18, di: 1, score: 14, of: 17, t: T0 }]));
  var win = env.load(SYNC, { db: db });
  win.Store.connect();
  await env.settle(20);
  eq("день из журнала виден", Object.keys(win.Store.state().done).length, 1);

  db.doc("sync/snapshot").set({
    v: 4, at: T0, by: "dOld", cursor: { dOld: 0 },
    state: { v: 4, done: { L18D0: { at: T0, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: false, streak: 1, lastDay: "2026-09-18", totalTried: 14, totalCorrect: 12, resetAt: 0 }
  });
  await env.settle(20);
  var s = win.Store.state();
  eq("после снапшота дней", Object.keys(s.done).length, 2);
}

/* ---------- 3. офлайн: состояние берётся из localStorage ---------- */
async function testOfflineBoot() {
  console.log("\nбез сети состояние поднимается с диска");
  var stored = { v: 4, done: { L18D0: {}, L18D1: {} }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 3, lastDay: "2026-09-20", totalTried: 30, totalCorrect: 25, resetAt: 0 };
  var win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(stored) } });
  eq("дней без сети", Object.keys(win.Store.state().done).length, 2);
  eq("серия без сети", win.Store.state().streak, 3);
}

/* ---------- 4. своя мутация не теряется при приходе снапшота ---------- */
async function testLocalMutationSurvives() {
  console.log("\nсобственный ответ переживает приход снапшота");
  var db = env.makeDb();
  var win = env.load(SYNC, { db: db });
  win.Store.connect();
  await env.settle(20);
  win.Store.mutate("dayDone", { n: 18, di: 5, score: 15, of: 17 });
  db.doc("sync/snapshot").set({
    v: 4, at: T0, by: "dOld", cursor: { dOld: 0 },
    state: { v: 4, done: { L18D0: {} }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: false, streak: 1, lastDay: "2026-09-18", totalTried: 0, totalCorrect: 0, resetAt: 0 }
  });
  await env.settle(20);
  var s = win.Store.state();
  ok("свой день на месте", !!s.done.L18D5);
  ok("чужой день подхвачен", !!s.done.L18D0);
}


/* ---------- 5. пока облако не ответило, интерфейс не должен рисовать нули ---------- */
async function testReadyFlag() {
  console.log("\nфлаг готовности состояния");
  var db = env.makeDb();
  db._seed("oplogs/dA", log("dA", 0, [{ type: "dayDone", n: 18, di: 1, score: 14, of: 17, t: T0 }]));
  var win = env.load(SYNC, { db: db });
  ok("чистое устройство: состояние ещё не готово", win.Store.ready() === false);
  win.Store.connect();
  await env.settle(20);
  ok("после ответа облака состояние готово", win.Store.ready() === true);
  eq("день подхвачен", Object.keys(win.Store.state().done).length, 1);
}

/* ---------- 6. состояние с диска готово сразу, без сети ---------- */
async function testReadyFromDisk() {
  console.log("\nсостояние с диска готово сразу");
  var stored = { v: 4, done: { L18D0: {} }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 2, lastDay: "2026-09-20", totalTried: 10, totalCorrect: 9, resetAt: 0 };
  var win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(stored) } });
  ok("диск поднял состояние", win.Store.ready() === true);
}

/* ---------- 7. без облака интерфейс не залипает в ожидании ---------- */
async function testReadyWithoutCloud() {
  console.log("\nбез облака ожидание не вечное");
  var win = env.load(SYNC, {});            /* window.claude нет вовсе */
  win.Store.connect();
  await env.settle(20);
  ok("готово, раз облака нет", win.Store.ready() === true);
}

/* ---------- 8. устройство без единой операции не плодит документ ---------- */
async function testNoEmptyLog() {
  console.log("\nпустое устройство не пишет свой журнал");
  var db = env.makeDb();
  var win = env.load(SYNC, { db: db });
  win.Store.connect();
  await env.settle(20);
  eq("документов в базе", Object.keys(db._docs).length, 0);
  win.Store.mutate("dayDone", { n: 18, di: 0, score: 10, of: 12 });
  await env.settle(1200);
  ok("после ответа журнал появился", Object.keys(db._docs).some(function (k) { return k.indexOf("oplogs/") === 0; }));
}


/* ---------- 9. возврат к приложению перерисовывает интерфейс ---------- */
async function testResumeRedraws() {
  console.log("\nвозврат видимости будит интерфейс");
  var db = env.makeDb();
  var win = env.load(SYNC, { db: db });
  var seen = 0;
  win.Store.onChange(function () { seen++; });
  win.Store.connect();
  await env.settle(20);
  var before = seen;

  /* так ведёт себя iOS: ответ облака пришёл, пока приложение свёрнуто */
  win.document.hidden = true;
  win._fire("visibilitychange");
  eq("пока скрыто — не дёргаем", seen, before);

  win.document.hidden = false;
  win._fire("visibilitychange");
  ok("возврат видимости перерисовал", seen > before);

  var afterVis = seen;
  win._fire("pageshow");
  ok("pageshow тоже перерисовал", seen > afterVis);
}

/* ---------- 10. замороженный таймер не оставляет экран в ожидании ---------- */
async function testFrozenTimer() {
  console.log("\nзамороженная страница: срок ожидания по стенным часам");
  var silent = {                                  /* облако, которое молчит */
    doc: function () { return { set: function () { return Promise.resolve(); },
      get: function () { return new Promise(function () {}); },
      onSnapshot: function () {}, acquire: function () { return new Promise(function () {}); } }; },
    collection: function () { return { onSnapshot: function () {} }; }
  };
  var clock = { skew: 0 };
  var win = env.load(SYNC, { db: silent, clock: clock });
  win.Store.connect();
  await env.settle(20);
  ok("облако молчит — ещё ждём", win.Store.ready() === false);

  clock.skew = 9000;                              /* телефон пролежал в кармане */
  win._fire("visibilitychange");
  ok("после возврата ждать перестали", win.Store.ready() === true);
}

(async function () {
  await testColdBoot();
  await testLogsFirst();
  await testOfflineBoot();
  await testLocalMutationSurvives();
  await testReadyFlag();
  await testReadyFromDisk();
  await testReadyWithoutCloud();
  await testNoEmptyLog();
  await testResumeRedraws();
  await testFrozenTimer();
  console.log("\n" + pass + " ok, " + fail + " fail");
  process.exit(fail ? 1 : 0);
})();
