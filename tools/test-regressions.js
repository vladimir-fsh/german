/* Регрессии актуального main. Запуск: node --test tools/test-regressions.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");
const SYNC = ["js/progress-data.js", "js/srs-config.js", "js/sync.js"];
const T = Date.UTC(2026, 9, 1, 12);

function stored() { return { v: 4, done: { L18D0: { at: T, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 2, lastDay: "2026-09-30", totalTried: 16, totalCorrect: 14, resetAt: 0 }; }

test("офлайн-ответ сохраняет состояние, поднятое только из материализованного кеша", () => {
  const win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(stored()) } });
  win.Store.mutate("answer", { ok: true });
  assert.ok(win.Store.state().done.L18D0);
  assert.equal(win.Store.state().totalTried, 17);
});

test("после облака, перезагрузки и офлайн-ответа чужие операции остаются на месте", async () => {
  const db = env.makeDb();
  db._seed("oplogs/other", { device: "other", seq: 1, lc: 10, ops: [{ type: "dayDone", device: "other", seq: 1, lc: 10, t: T, n: 18, di: 1, score: 15, of: 16 }] });
  const first = env.load(SYNC, { db }); first.Store.connect(); await env.settle(20);
  assert.ok(first.Store.state().done.L18D1);
  const next = env.load(SYNC, { storage: { ...first.localStorage._dump() } });
  next.Store.mutate("answer", { ok: true });
  assert.ok(next.Store.state().done.L18D1);
});

test("асинхронная компакция сохраняет именно отправленный снимок, не более новое состояние", async () => {
  const db = env.makeDb(); const originalDoc = db.doc;
  let sent, resolveSnapshot;
  db.doc = (id) => {
    const doc = originalDoc(id);
    if (id === "sync/snapshot") doc.set = (value) => { sent = value; return new Promise((resolve) => { resolveSnapshot = resolve; }); };
    return doc;
  };
  const win = env.load(SYNC, { db }); win.Store.connect(); await env.settle(10);
  for (let i = 0; i < 250; i++) win.Store.mutate("answer", { ok: true });
  await env.settle(1000); assert.ok(sent);
  win.Store.mutate("answer", { ok: true }); resolveSnapshot(); await env.settle(5);
  assert.equal(win.Store._debug().snapshot.state.totalTried, sent.state.totalTried);
  win.Store.mutate("answer", { ok: true }); assert.equal(win.Store.state().totalTried, 252);
});

test("закрытая грамматическая задача сохраняет различия регистра и немецких букв", () => {
  const engine = env.load(["js/engine.js"]).Engine;
  assert.equal(engine.match("termin", ["Termin"]), false);
  assert.equal(engine.match("schon", ["schön"]), false);
  assert.equal(engine.match("weiss", ["weiß"]), false);
  assert.equal(engine.match("  schön. ", ["schön"]), true);
});

test("новая практика ошибки не проходит три бокса повторными кликами до срока", () => {
  const store = env.load(SYNC).Store;
  const add = { type: "srsAdd", policy: 2, device: "one", lc: 1, seq: 1, t: T, id: "error", ex: { type: "fill", q: "{ein}", a: ["einen"], why: "Akkusativ" }, n: 18 };
  const ops = [add];
  for (let i = 0; i < 3; i++) ops.push({ type: "srsHit", policy: 2, device: "one", lc: i + 2, seq: i + 2, t: T + i * 1000, id: "error", ok: true });
  const result = store._reduce(null, ops);
  assert.ok(result.srs.error); assert.equal(result.srs.error.box, 1);
});

test("поврежденное хранилище не перезаписывается, импорт проверяется до мутации", () => {
  for (const raw of ["{broken", '{"v":4,"done":null}']) {
    const win = env.load(SYNC, { storage: { "de-b1-progress-v1": raw } });
    assert.equal(win.Store.blocked(), true); assert.equal(win.localStorage.getItem("de-b1-progress-v1"), raw);
    assert.throws(() => win.Store.importBackup('{bad'));
    assert.equal(win.localStorage.getItem("de-b1-progress-v1"), raw);
    win.Store.importBackup(JSON.stringify(stored())); assert.equal(win.Store.blocked(), false); assert.ok(win.Store.state().done.L18D0);
  }
});

test("нехватка места оставляет работу в памяти для экспорта и повторного сохранения", () => {
  const win = env.load(SYNC); const save = win.localStorage.setItem;
  win.localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  win.Store.mutate("answer", { ok: true });
  assert.equal(win.Store.state().totalTried, 1); assert.match(win.Store.storageError(), /памяти/);
  assert.equal(JSON.parse(win.Store.exportBackup()).state.totalTried, 1);
  win.localStorage.setItem = save; win.Store.flush(); assert.equal(win.Store.storageError(), "");
  assert.equal(JSON.parse(win.localStorage.getItem("de-b1-progress-v1")).totalTried, 1);
});

test("две вкладки одного устройства не затирают последовательные ответы", () => {
  const storage = env.makeStorage(); const first = env.load(SYNC, { localStorage: storage }); const second = env.load(SYNC, { localStorage: storage });
  first.Store.mutate("answer", { ok: true }); second.Store.mutate("answer", { ok: false });
  first._fire("storage"); assert.equal(first.Store.state().totalTried, 2); assert.equal(first.Store.state().totalCorrect, 1);
  assert.equal(second.Store.state().totalTried, 2); assert.equal(second.Store._debug().mine.seq, 2);
});

test("собственный облачный журнал восстанавливается, даже если локальная копия потеряна", async () => {
  const db = env.makeDb(); db._seed("oplogs/self", { device: "self", seq: 1, lc: 1, ops: [{ type: "answer", ok: true, device: "self", seq: 1, lc: 1, t: T }] });
  const win = env.load(SYNC, { db, storage: { "de-b1-device-v1": "self" } }); win.Store.connect(); await env.settle(20);
  assert.equal(win.Store.state().totalCorrect, 1); assert.equal(win.Store._debug().mine.seq, 1);
});

test("новые карточки имеют короткие шаги; ранний ответ не удлиняет интервал, срыв возвращает обучение", () => {
  const store = env.load(SYNC).Store;
  const op = (seq, t, ok) => ({ type: "vocabReview", device: "one", seq, lc: seq, t, ok, key: "V:die Meinung|ru", day: "2026-10-01" });
  let state = store._reduce(null, [op(1, T, true)]); assert.equal(state.vocab["V:die Meinung|ru"].due, T + 600000);
  state = store._reduce(null, [op(1, T, true), op(2, T + 1000, true)]); assert.equal(state.vocab["V:die Meinung|ru"].step, 1);
  state = store._reduce(null, [op(1, T, true), op(2, T + 600000, true), op(3, T + 600000 + 86400000, false)]);
  const card = state.vocab["V:die Meinung|ru"]; assert.equal(card.stage, "learning"); assert.equal(card.due, T + 600000 + 86400000 + 60000); assert.equal(card.learned, false);
  const old = store._reduce(null, [{ ...op(1, T, true), type: "vocabGrade", fast: true }]); assert.equal(old.vocab["V:die Meinung|ru"].iv, 4);
});

test("черновик хранит ввод, подсказки и последний ответ без повторного зачета", () => {
  const win = env.load(SYNC.concat(["js/practice.js"])); const ex = [{ type: "fill", q: "{ein}", a: ["einen"], why: "Akkusativ" }];
  const draft = win.Practice.create(18, 0, ex); draft.records[0] = { usedHint: true, draft: { values: ["en"], result: { ok: true, verdict: "correct", usedHint: true } }, result: { ok: true, verdict: "correct", usedHint: true } }; draft.i = 1; win.Practice.save(draft);
  const next = env.load(SYNC.concat(["js/practice.js"]), { storage: { ...win.localStorage._dump() } }); const restored = next.Practice.load(18, 0, ex);
  assert.equal(restored.i, 1); assert.equal(restored.records[0].draft.values[0], "en"); assert.equal(next.Practice.stats(restored).hints, 1);
  for (let i = 0; i < 2; i++) next.Store.mutate("dayDone", { n: 18, di: 0, score: 1, of: 1, attemptId: restored.id });
  assert.equal(next.Store.state().attempts.length, 1);
  const backup = win.Store.exportBackup(); next.Practice.clear(); next.Store.importBackup(backup); assert.equal(next.Practice.load(18, 0, ex).id, draft.id);
});

test("поврежденные черновики не затираются новой работой", () => {
  const win = env.load(SYNC.concat(["js/practice.js"]), { storage: { "de-b1-days-v2": "{bad" } });
  const ex = [{ type: "fill", q: "{ein}", a: ["einen"], why: "Akkusativ" }]; win.Practice.save(win.Practice.create(18, 0, ex));
  assert.equal(win.localStorage.getItem("de-b1-days-v2"), "{bad"); assert.ok(JSON.parse(win.Practice.exportDrafts()).L18D0);
});

test("неподтвержденный перевод не считается доказанной ошибкой; календарь учитывает выходные", () => {
  const win = env.load(SYNC.concat(["js/engine.js"]));
  assert.equal(win.Engine.compare("Den Termin möchte ich verschieben.", ["Ich möchte den Termin verschieben."], true), "needs-review");
  win.Store.mutate("answer", { ok: false, verdict: "needs-review", attemptId: "one" }); assert.equal(win.Store.state().totalTried, 0); assert.equal(win.Store.state().totalUncertain, 1);
  const ops = ["2026-09-25", "2026-09-28"].map((day, i) => ({ type: "touchDay", policy: 2, day, device: "one", seq: i + 1, lc: i + 1, t: T + i }));
  const s = win.Store._reduce(null, ops); assert.equal(s.streak, 2); assert.equal(win.ProgressData.currentStreak(s, "2026-09-30"), 0);
});


test("старые карточки схемы 3 без learned переносятся с прежними сроками", () => {
  const state = stored(); state.v = 3; state.vocab["V:die Meinung|de"] = { box: 2, due: T, lapses: 1 };
  const win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(state) } });
  assert.equal(win.Store.blocked(), false); win.Store.mutate("answer", { ok: true });
  assert.equal(win.Store.state().vocab["V:die Meinung|de"].iv, 3);
  assert.equal(win.Store.state().vocab["V:die Meinung|de"].due, T);
});

test("невалидный журнал облака не повреждает логические часы и следующий ответ", async () => {
  const db = env.makeDb(); db._seed("oplogs/bad", { device: "bad", seq: "oops", lc: "oops", ops: [] });
  const win = env.load(SYNC, { db }); win.Store.connect(); await env.settle(20);
  win.Store.mutate("answer", { ok: true });
  assert.equal(win.Store.state().totalCorrect, 1); assert.equal(win.Store._debug().mine.lc, 1);
  assert.throws(() => win.ProgressData.operation({ type: "srsHit", id: "__proto__", ok: true, device: "d", seq: 1, lc: 1, t: T }));
});

test("плохой черновик в резервной копии отклоняется до замены прогресса", () => {
  const win = env.load(SYNC.concat("js/practice.js")); win.Store.mutate("answer", { ok: true });
  const draft = win.Practice.create(18, 0, [{ type: "fill", q: "{ein}", a: ["einen"] }]);
  draft.records[0] = { draft: { values: [42] } };
  assert.throws(() => win.Store.importBackup(JSON.stringify({ kind: "de-b1-backup", state: stored(), drafts: { L18D0: draft } })));
  assert.equal(win.Store.state().totalTried, 1); assert.equal(Object.keys(win.Store.state().done).length, 0);
});

test("потерянный свой журнал получает новый номер после курсора снимка", () => {
  const state = stored(); const snapshot = { v: 4, state, cursor: { self: 40, other: 10 }, at: T };
  const win = env.load(SYNC, { storage: { "de-b1-device-v1": "self", "de-b1-progress-v1": JSON.stringify(state), "de-b1-snapshot-v1": JSON.stringify(snapshot) } });
  win.Store.mutate("answer", { ok: true });
  assert.equal(win.Store.state().totalTried, 17); assert.equal(win.Store._debug().mine.seq, 41);
});
