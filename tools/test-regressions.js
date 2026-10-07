/* Регрессии актуального main. Запуск: node --test tools/test-regressions.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");
const SYNC = ["js/progress-data.js", "js/srs-config.js", "js/sync.js"];
const T = Date.UTC(2026, 9, 1, 12);

function stored() { return { v: 4, done: { L18D0: { at: T, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 2, lastDay: "2026-09-30", totalTried: 16, totalCorrect: 14, resetAt: 0 }; }

test("повседневные варианты сохраняют старые ключи повторения, сессии и калибровки", () => {
  const win = env.load(["data/lessons.js", "data/vocab.js"].concat(SYNC));
  const source = require("node:fs").readFileSync(env.ROOT + "/js/app.js", "utf8");
  // Запускаем настоящие функции выбора карточек без мобильного DOM.
  const context = require("node:vm").createContext({
    window: win, S: win.Store.state(), V_LEVELS: 5, CFG: win.SRS_CONFIG,
    E: { shuffle: (items) => items }
  });
  require("node:vm").runInContext(source.slice(source.indexOf("  function vocabPool()"),
    source.indexOf("  /* Незакрытая сессия")), context);
  const cards = context.vocabCards();
  assert.equal(new Set(cards.map((card) => card.key)).size, cards.length);
  assert.equal(new Set(win.VOCAB.map((word) => word.de)).size, win.VOCAB.length);
  const word = win.VOCAB.find((word) => word.de === "genug");
  assert.equal(word.id, "ausreichend");
  assert.equal(word.f, 1);
  assert.match(word.reg, /ausreichend/);
  for (const direction of ["de", "ru"]) {
    const savedKey = "V:ausreichend|" + direction;
    const restoredCard = cards.find((card) => card.key === savedKey);
    assert.equal(restoredCard.w.de, "genug");
    win.Store.mutate("vocabReview", { key: savedKey, ok: true, day: "2026-10-07" });
    assert.ok(win.Store.state().vocab[savedKey].due);
  }
  context.S = win.Store.state();
  assert.ok(!context.vocabCalibPlan().some((card) => card.w.de === "genug"));
  for (const changed of win.VOCAB.filter((word) => word.id)) {
    assert.ok(changed.reg.includes(changed.id), changed.de + ": прежний вариант на обороте");
    assert.ok(cards.some((card) => card.key === "V:" + changed.id + "|ru"));
  }
});

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
  assert.equal(second.Store.state().totalTried, 2); assert.equal(second.Store._debug().mine.seq, 1);
});

test("собственный облачный журнал восстанавливается, даже если локальная копия потеряна", async () => {
  const db = env.makeDb(); db._seed("oplogs/self", { device: "self", seq: 1, lc: 1, ops: [{ type: "answer", ok: true, device: "self", seq: 1, lc: 1, t: T }] });
  const win = env.load(SYNC, { db, storage: { "de-b1-device-v1": "self" } }); win.Store.connect(); await env.settle(20);
  assert.equal(win.Store.state().totalCorrect, 1); assert.equal(win.Store._debug().foreign.self.length, 1);
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
  const win = env.load(SYNC.concat(["js/practice.js", "js/sessions.js"])); win.Store.mutate("answer", { ok: true });
  const draft = win.Practice.create(18, 0, [{ type: "fill", q: "{ein}", a: ["einen"] }]);
  draft.records[0] = { draft: { values: [42] } };
  assert.throws(() => win.Store.importBackup(JSON.stringify({ kind: "de-b1-backup", state: stored(), drafts: { L18D0: draft } })));
  assert.equal(win.Store.state().totalTried, 1); assert.equal(Object.keys(win.Store.state().done).length, 0);
});

test("новый автор не попадает под старый курсор снимка", () => {
  const state = stored(); const snapshot = { v: 4, state, cursor: { self: 40, other: 10 }, at: T };
  const win = env.load(SYNC, { storage: { "de-b1-device-v1": "self", "de-b1-progress-v1": JSON.stringify(state), "de-b1-snapshot-v1": JSON.stringify(snapshot) } });
  win.Store.mutate("answer", { ok: true });
  assert.equal(win.Store.state().totalTried, 17); assert.notEqual(win.Store.device, "self"); assert.equal(win.Store._debug().mine.seq, 1);
});

test("одновременные ответы вкладок переживают пересечение локальных записей", () => {
  const storage = env.makeStorage(); const a = env.load(SYNC, { localStorage: storage }); const b = env.load(SYNC, { localStorage: storage });
  const set = storage.setItem; let nested = false;
  storage.setItem = (key, value) => {
    if (!nested && key.indexOf("de-b1-oplog") === 0 && JSON.parse(value).ops.length) { nested = true; b.Store.mutate("answer", { ok: false }); }
    set(key, value);
  };
  a.Store.mutate("answer", { ok: true }); storage.setItem = set;
  a._fire("storage"); b._fire("storage");
  const reload = env.load(SYNC, { localStorage: storage }); reload.Store.mutate("touchDay", { day: "2026-10-01" });
  assert.equal(reload.Store.state().totalTried, 2); assert.equal(reload.Store.state().totalCorrect, 1);
});

test("резервная копия переносит незавершенную сессию слов и просмотр подсказки", () => {
  const session = { at: T, mode: "new", keys: ["V:die Meinung|de"], newKeys: ["V:die Meinung|de"], i: 0, done: 0, first: {}, newSeen: 0, newKnown: 0, peeked: true, calibStat: {} };
  const source = env.load(SYNC.concat(["js/practice.js", "js/sessions.js"]), { storage: { "de-b1-session-v1": JSON.stringify(session) } });
  const backup = JSON.parse(source.Store.exportBackup()); assert.equal(backup.sessions?.vocab.peeked, true);
  const target = env.load(SYNC.concat(["js/practice.js", "js/sessions.js"])); target.Store.importBackup(JSON.stringify(backup));
  assert.equal(JSON.parse(target.localStorage.getItem("de-b1-session-v1")).peeked, true);
});

const SESSION_FILES = SYNC.concat(["js/practice.js", "js/sessions.js", "js/review.js"]);
const FILL = { type: "fill", q: "ein schön{} Pullover", a: ["er"], why: "Nominativ maskulin" };
function reviewRun(win) {
  win.Store.mutate("srsAdd", { id: "L18D0-3", n: 18, ex: FILL });
  const r = win.Store.state().srs["L18D0-3"];
  return win.ReviewPlan.create([{ id: "L18D0-3", r }]);
}

test("повторение восстанавливает незавершенный ввод и переносится резервной копией", () => {
  const source = env.load(SESSION_FILES); const run = reviewRun(source);
  run.records[0] = { draft: { values: ["e"], usedHint: true } }; source.Sessions.save("review", run);
  const reload = env.load(SESSION_FILES, { storage: { ...source.localStorage._dump() } });
  assert.equal(reload.Sessions.load("review").records[0].draft.values[0], "e");
  const target = env.load(SESSION_FILES); target.Store.importBackup(source.Store.exportBackup());
  assert.equal(target.Sessions.load("review").id, run.id);
  assert.equal(target.Sessions.load("review").records[0].draft.usedHint, true);
  assert.ok(target.ReviewPlan.pending(target.Sessions.load("review").items[0], target.Store.state()));
});

test("проверенный повтор считает ответ и срок атомарно; перезагрузка не засчитывает его снова", () => {
  const source = env.load(SESSION_FILES); const run = reviewRun(source);
  const result = { ok: true, verdict: "correct" };
  run.records[0] = { result, draft: { values: ["er"], result } }; source.Sessions.save("review", run);
  source.Store.mutate("reviewAnswer", source.ReviewPlan.grade(run, 0, result));
  assert.equal(source.Store.state().srs["L18D0-3"].box, 1);
  const reload = env.load(SESSION_FILES, { storage: { ...source.localStorage._dump() } });
  const restored = reload.Sessions.load("review");
  reload.Store.mutate("reviewAnswer", reload.ReviewPlan.grade(restored, 0, restored.records[0].result));
  assert.equal(reload.Store.state().totalTried, 1); assert.equal(reload.Store.state().srs["L18D0-3"].box, 1);
  const own = source.Store._debug().mine.ops;
  assert.equal(own.length, 2); assert.equal(own[1].type, "reviewAnswer");
});

test("сохраненный результат до записи журнала восстанавливает зачет; устаревший повтор не меняет новую ошибку", () => {
  const win = env.load(SESSION_FILES); const run = reviewRun(win);
  run.records[0] = { result: { ok: false, verdict: "incorrect" } }; win.Sessions.save("review", run);
  const reload = env.load(SESSION_FILES, { storage: { ...win.localStorage._dump() } });
  reload.Store.mutate("reviewAnswer", reload.ReviewPlan.grade(reload.Sessions.load("review"), 0, run.records[0].result));
  assert.equal(reload.Store.state().totalTried, 1); assert.ok(reload.Store.state().srs["L18D0-3"].due > run.items[0].due);
  const stale = reload.ReviewPlan.grade(run, 0, { ok: true }); stale.attemptId = "other-tab:0";
  const due = reload.Store.state().srs["L18D0-3"].due;
  reload.Store.mutate("reviewAnswer", stale);
  assert.equal(reload.Store.state().srs["L18D0-3"].box, 0); assert.equal(reload.Store.state().srs["L18D0-3"].due, due);
});

test("плохая сессия и будущая версия копии отклоняются до замены прогресса", () => {
  const win = env.load(SESSION_FILES); win.Store.mutate("answer", { ok: true });
  const run = reviewRun(win); run.records[0] = { draft: { values: [42] } };
  assert.throws(() => win.Store.importBackup(JSON.stringify({ kind: "de-b1-backup", version: 2, state: stored(), sessions: { review: run } })));
  assert.throws(() => win.Store.importBackup(JSON.stringify({ kind: "de-b1-backup", version: 3, state: stored() })));
  assert.equal(win.Store.state().totalTried, 1); assert.equal(Object.keys(win.Store.state().done).length, 0);
});

test("поврежденная сессия сохраняет исходную запись и предупреждение после ответа", () => {
  const win = env.load(SESSION_FILES, { storage: { "de-b1-review-v1": "{bad" } });
  const run = reviewRun(win); win.Sessions.save("review", run); win.Store.mutate("answer", { ok: true });
  assert.equal(win.localStorage.getItem("de-b1-review-v1"), "{bad"); assert.match(win.Store.storageError(), /поврежден/i);
  assert.equal(JSON.parse(win.Store.exportBackup()).sessions.review.id, run.id);
});

test("нехватка места для сессии не теряет ввод; запись прогресса не скрывает предупреждение", () => {
  const win = env.load(SESSION_FILES); const run = reviewRun(win); run.records[0] = { draft: { values: ["e"] } };
  const set = win.localStorage.setItem;
  win.localStorage.setItem = (key, value) => { if (key === "de-b1-review-v1") throw Error("QuotaExceededError"); set(key, value); };
  win.Sessions.save("review", run); win.Store.mutate("answer", { ok: true });
  assert.match(win.Store.storageError(), /памяти/); assert.equal(JSON.parse(win.Store.exportBackup()).sessions.review.records[0].draft.values[0], "e");
  win.localStorage.setItem = set; win.Sessions.flush(); assert.equal(win.Store.storageError(), "");
});

test("метка навыка не сбрасывает старый черновик, но изменение задания его не восстанавливает", () => {
  const win = env.load(SESSION_FILES); const draft = win.Practice.create(18, 0, [FILL]); draft.records[0] = { draft: { values: ["e"] } }; win.Practice.save(draft);
  const reload = env.load(SESSION_FILES, { storage: { ...win.localStorage._dump() } });
  assert.equal(reload.Practice.load(18, 0, [{ ...FILL, skill: "adj-ein-nom-m" }]).id, draft.id);
  assert.equal(reload.Practice.load(18, 0, [{ ...FILL, a: ["en"] }]), null);
});

test("поздний повтор остается в том же навыке; без разметки сохраняет исходное задание", () => {
  const win = env.load(SESSION_FILES.concat(["data/l18.js"]));
  const original = JSON.parse(JSON.stringify(win.L18.days[0].ex[2])); const skill = original.skill; delete original.skill;
  const next = win.ReviewPlan.variant({ id: "L18D0-2", r: { n: 18, box: 1, ex: original } });
  assert.equal(next.skill, skill); assert.equal(next.type, "fill"); assert.notEqual(next, original);
  const untagged = win.L18.days[0].ex[0];
  assert.equal(win.ReviewPlan.variant({ id: "L18D0-0", r: { n: 18, box: 2, ex: untagged } }), untagged);
  const stale = { ...original, q: "changed" };
  assert.equal(win.ReviewPlan.variant({ id: "L18D0-2", r: { n: 18, box: 1, ex: stale } }), stale);
});

test("событие записи общего кеша не запускает цикл записей между вкладками", () => {
  const storage = env.makeStorage(); const a = env.load(SYNC, { localStorage: storage }); const b = env.load(SYNC, { localStorage: storage });
  a.Store.mutate("answer", { ok: true });
  let writes = 0; const set = storage.setItem; storage.setItem = (key, value) => { writes++; set(key, value); };
  b._fire("storage", { key: "de-b1-progress-v1" }); assert.equal(writes, 0);
  b._fire("storage", { key: "de-b1-oplog-v2:" + a.Store.device }); assert.equal(b.Store.state().totalTried, 1);
});

test("вкладки одного устройства отправляют разные облачные документы и оба ответа сходятся", async () => {
  const storage = env.makeStorage(); const db = env.makeDb();
  const a = env.load(SYNC, { localStorage: storage, db }); const b = env.load(SYNC, { localStorage: storage, db });
  a.Store.connect(); b.Store.connect(); await env.settle(20);
  a.Store.mutate("answer", { ok: true }); b.Store.mutate("answer", { ok: false });
  a.Store.flush(); b.Store.flush(); await env.settle(30);
  assert.notEqual(a.Store.device, b.Store.device);
  assert.equal(db._docs["oplogs/" + a.Store.device].ops.length, 1); assert.equal(db._docs["oplogs/" + b.Store.device].ops.length, 1);
  assert.equal(a.Store.state().totalTried, 2); assert.equal(b.Store.state().totalTried, 2);
});

test("офлайн-ответ закрытой вкладки попадает в облако после перезагрузки без новых ответов", async () => {
  const storage = env.makeStorage(); const offline = env.load(SYNC, { localStorage: storage });
  offline.Store.mutate("answer", { ok: true });
  const db = env.makeDb(); const reload = env.load(SYNC, { localStorage: storage, db });
  reload.Store.connect(); await env.settle(30);
  const otherDevice = env.load(SYNC, { db }); otherDevice.Store.connect(); await env.settle(30);
  assert.equal(otherDevice.Store.state().totalTried, 1); assert.equal(otherDevice.Store.state().totalCorrect, 1);
  assert.equal(db._docs["oplogs/" + reload.Store.device].relayed[0].device, offline.Store.device);
  assert.equal(db._docs["oplogs/" + offline.Store.device], undefined);
});

test("вкладки сходятся без повторяющегося цикла событий записи и принимают чужое облако", () => {
  const storage = env.makeStorage(); const a = env.load(SYNC, { localStorage: storage }); const b = env.load(SYNC, { localStorage: storage });
  const queue = []; const set = storage.setItem; let writer;
  storage.setItem = (key, value) => {
    if (storage.getItem(key) !== value) queue.push({ key, writer });
    set(key, value);
  };
  writer = a; a.Store.mutate("answer", { ok: true }); writer = b; b.Store.mutate("answer", { ok: false });
  let events = 0;
  while (queue.length && events++ < 40) {
    const event = queue.shift(); writer = event.writer === a ? b : a; writer._fire("storage", { key: event.key });
  }
  assert.equal(queue.length, 0); assert.equal(a.Store.state().totalTried, 2); assert.equal(b.Store.state().totalTried, 2);
  const foreign = JSON.parse(storage.getItem("de-b1-foreign-v1"));
  foreign.cloud = [{ type: "answer", ok: true, device: "cloud", seq: 1, lc: 100, t: T }];
  storage.setItem("de-b1-foreign-v1", JSON.stringify(foreign));
  b._fire("storage", { key: "de-b1-foreign-v1" }); assert.equal(b.Store.state().totalTried, 3);
});
