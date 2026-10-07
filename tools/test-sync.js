/* Тесты свёртки и загрузки состояния из localStorage. Запуск: node tools/test-sync.js
   Зависимостей нет, окружение браузера подделывает tools/env.js. */
var env = require("./env.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "\n       " + extra : "")); }
}
function eq(name, a, b) { ok(name, a === b, "получено " + JSON.stringify(a) + ", ожидалось " + JSON.stringify(b)); }

var SYNC = ["js/progress-data.js", "js/srs-config.js", "js/sync.js"];

/* журнал чужого устройства: один закрытый день урока */
function log(device, lcFrom, entries) {
  var ops = entries.map(function (e, i) {
    return { type: e.type, device: device, seq: i + 1, lc: lcFrom + i + 1, t: e.t, n: e.n, di: e.di, score: e.score, of: e.of, key: e.key, ok: e.ok, day: e.day };
  });
  return { device: device, seq: ops.length, lc: lcFrom + ops.length, ops: ops, at: Date.now() };
}

var T0 = Date.UTC(2026, 8, 18);

/* ---------- 1. снапшот и журналы с диска сворачиваются вместе ---------- */
async function testDiskSnapshotAndLogs() {
  console.log("\nснапшот и журналы прежних версий");
  var snapshot = {
    v: 4, at: T0, by: "dOld", cursor: { dOld: 0 },
    state: { v: 4, done: { L18D0: { at: T0, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: false, streak: 1, lastDay: "2026-09-18", totalTried: 14, totalCorrect: 12, resetAt: 0 }
  };
  var dA = log("dA", 0, [
    { type: "dayDone", n: 18, di: 1, score: 14, of: 17, t: T0 + 864e5 },
    { type: "dayDone", n: 18, di: 2, score: 12, of: 16, t: T0 + 2 * 864e5 }
  ]);
  var win = env.load(SYNC, { storage: {
    "de-b1-progress-v1": JSON.stringify(snapshot.state),
    "de-b1-snapshot-v1": JSON.stringify(snapshot),
    "de-b1-foreign-v1": JSON.stringify({ dA: dA.ops })
  } });
  var s = win.Store.state();
  eq("дней пройдено", Object.keys(s.done).length, 3);
  ok("день из снапшота не потерян", !!s.done.L18D0);
  ok("день из журнала на месте", !!s.done.L18D2);
}

/* ---------- 3. офлайн: состояние берётся из localStorage ---------- */
async function testOfflineBoot() {
  console.log("\nсостояние поднимается с диска");
  var stored = { v: 4, done: { L18D0: {}, L18D1: {} }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 3, lastDay: "2026-09-20", totalTried: 30, totalCorrect: 25, resetAt: 0 };
  var win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(stored) } });
  eq("дней с диска", Object.keys(win.Store.state().done).length, 2);
  eq("серия с диска", win.Store.state().streak, 3);
}

/* ---------- 4. своя мутация переживает перезагрузку ---------- */
async function testLocalMutationSurvives() {
  console.log("\nсобственный ответ переживает перезагрузку");
  var storage = env.makeStorage();
  var win = env.load(SYNC, { localStorage: storage });
  win.Store.mutate("dayDone", { n: 18, di: 5, score: 15, of: 17 });
  var next = env.load(SYNC, { localStorage: storage });
  ok("свой день на месте", !!next.Store.state().done.L18D5);
}

/* ---------- 5. чистое устройство готово сразу ---------- */
async function testReadyFresh() {
  console.log("\nчистое устройство");
  var win = env.load(SYNC, {});
  ok("состояние готово без ожидания", win.Store.ready() === true);
  eq("дней пройдено", Object.keys(win.Store.state().done).length, 0);
}

/* ---------- 6. состояние с диска готово сразу ---------- */
async function testReadyFromDisk() {
  console.log("\nсостояние с диска готово сразу");
  var stored = { v: 4, done: { L18D0: {} }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 2, lastDay: "2026-09-20", totalTried: 10, totalCorrect: 9, resetAt: 0 };
  var win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(stored) } });
  ok("диск поднял состояние", win.Store.ready() === true);
}

/* ---------- 8б. день, засчитанный кнопкой ---------- */
async function testManualDay() {
  console.log("\nдень засчитан кнопкой: результат только по сохранённым ответам");
  var win = env.load(SYNC, {});
  var S = win.Store.mutate("dayDone", { n: 19, di: 0, score: 1, of: 2, manual: true, attemptId: "run-a", records: [] });
  eq("день готов", !!S.done.L19D0, true);
  eq("в отметке дня пометка ручного", S.done.L19D0.manual, true);
  eq("результат из сохранённых ответов", S.done.L19D0.score + "/" + S.done.L19D0.of, "1/2");
  eq("в истории пометка ручного", S.attempts[S.attempts.length - 1].manual, true);
  S = win.Store.mutate("dayDone", { n: 19, di: 1, score: 0, of: 0, manual: true });
  eq("без ответов — день готов", !!S.done.L19D1, true);
  eq("без ответов — истории не добавилось", S.attempts.length, 1);
  S = win.Store.mutate("dayDone", { n: 19, di: 2, score: 5, of: 5, attemptId: "run-b", records: [] });
  eq("обычный день без пометки", S.done.L19D2.manual, undefined);
}

/* ---------- 9. возврат к приложению перерисовывает интерфейс ---------- */
async function testResumeRedraws() {
  console.log("\nвозврат видимости будит интерфейс");
  var win = env.load(SYNC, {});
  var seen = 0;
  win.Store.onChange(function () { seen++; });
  win.Store.start();
  var before = seen;

  /* так ведёт себя iOS: соседняя вкладка ответила, пока приложение свёрнуто */
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

(async function () {
  await testDiskSnapshotAndLogs();
  await testOfflineBoot();
  await testLocalMutationSurvives();
  await testReadyFresh();
  await testReadyFromDisk();
  await testManualDay();
  await testResumeRedraws();
  console.log("\n" + pass + " ok, " + fail + " fail");
  process.exit(fail ? 1 : 0);
})();
