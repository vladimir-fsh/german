/* Регрессии актуального main. Запуск: node --test tools/test-regressions.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");
const SYNC = ["js/progress-data.js", "js/srs-config.js", "js/sync.js"];
const T = Date.UTC(2026, 9, 1, 12);

function stored() { return { v: 4, done: { L18D0: { at: T, score: 14, of: 16 } }, srs: {}, vocab: {}, vocabLevel: 1, calibrated: true, streak: 2, lastDay: "2026-09-30", totalTried: 16, totalCorrect: 14, resetAt: 0 }; }

function wordOp(seq, dir, ok, t = T, due = T) {
  return { type: "vocabWordReview", key: "V:Test|" + dir, ok, expectedDue: due,
    t, day: "2026-10-01", device: "one", seq, lc: seq };
}
function reviewWord(iv) {
  const state = stored(); state.v = 6;
  state.vocab["V:Test|ru"] = { iv, ease: 2.5, reps: 4, lapses: 0, due: T, t: T - 86400000, stage: "review", learned: false };
  return state;
}

test("рамка сохраняется на половине интервала и меняется только вместе с расписанием", () => {
  const win = env.load(SYNC.concat(["js/vocab-frames.js"]));
  const half = win.Store._reduce(reviewWord(100), [wordOp(1, "ru", true)]);
  assert.equal(win.VocabFrames.rank(half.vocab["V:Test|ru"]).id, "legend");
  const failed = win.Store._reduce(half, [wordOp(2, "de", false)]);
  assert.equal(win.VocabFrames.rank(failed.vocab["V:Test|ru"]).id, "bronze");
  assert.equal(win.VocabFrames.rank(null).id, "bronze");
  assert.equal(win.VocabFrames.rank({ iv: 6 }).id, "silver");
  assert.equal(win.VocabFrames.rank({ iv: 29 }).id, "gold");
  assert.equal(win.VocabFrames.rank({ iv: 99 }).id, "platinum");
  assert.equal(win.VocabFrames.isUpgrade({ iv: 3 }, { iv: 8 }), true);
  assert.equal(win.VocabFrames.isUpgrade({ iv: 30 }, { iv: 30, pairRu: true }), false);
  assert.equal(win.VocabFrames.isUpgrade({ iv: 100 }, { iv: 100, stage: "learning" }), false);
  const known = win.Store._reduce(failed, [{ type: "vocabKnown", key: "V:Test", device: "one", seq: 3, lc: 3, t: T + 1000 }]);
  assert.equal(win.VocabFrames.isUpgrade(failed.vocab["V:Test|ru"], known.vocab["V:Test|ru"]), true);
});

test("до 30 дней работает только русский → немецкий; ранний ответ не меняет срок", () => {
  const store = env.load(SYNC).Store, base = reviewWord(29);
  const invalid = store._reduce(base, [wordOp(1, "de", true)]);
  assert.equal(invalid.vocab["V:Test|ru"].iv, 29);
  const early = store._reduce(base, [wordOp(1, "ru", true, T - 1)]);
  assert.equal(early.vocab["V:Test|ru"].due, T);
  const next = store._reduce(base, [wordOp(1, "ru", true)]);
  assert.ok(next.vocab["V:Test|ru"].due > T);
  assert.equal(next.vocab["V:Test|ru"].pairRu, false);
  const fresh = store._reduce(null, [wordOp(1, "ru", true, T, 0)]);
  assert.equal(fresh.vocab["V:Test|ru"].due, T + 600000);
});

test("на 30 и 100 днях две стороны завершают один интервал, дубликаты не дают прогресс", () => {
  const store = env.load(SYNC).Store;
  for (const iv of [30, 100]) {
    const base = reviewWord(iv), first = wordOp(1, "ru", true);
    const duplicate = { ...first, device: "other", seq: 1, lc: 2 };
    const half = store._reduce(base, [first, duplicate]);
    assert.equal(half.vocab["V:Test|ru"].pairRu, true);
    assert.equal(half.vocab["V:Test|ru"].iv, iv);
    assert.equal(half.vocab["V:Test|ru"].due, T);
    assert.equal(half.vocab["V:Test|ru"].reps, 4);
    const second = wordOp(3, "de", true, T + 1000);
    const ops = [first, duplicate, second, { ...second, device: "other", lc: 4 }];
    const full = store._reduce(base, ops), v = full.vocab["V:Test|ru"];
    assert.equal(v.pairRu, false); assert.equal(v.reps, 5);
    assert.ok(v.due > T); assert.ok(v.iv <= 100);
    assert.deepEqual(full, store._reduce(base, ops.slice().reverse()));
    assert.equal(v.learned, false);
  }
});

test("промах на любой стороне убирает половину и возвращает короткое обучение", () => {
  const store = env.load(SYNC).Store;
  for (const dir of ["ru", "de"]) {
    const ops = dir === "ru" ? [] : [wordOp(1, "ru", true)];
    ops.push(wordOp(2, dir, false));
    const state = store._reduce(reviewWord(100), ops), v = state.vocab["V:Test|ru"];
    assert.equal(v.pairRu, false); assert.equal(v.stage, "learning");
    assert.equal(v.due, T + 60000); assert.equal(v.lapses, 1);
    assert.equal(store.vocabPaired(v), false);
  }
});

test("половина интервала переживает перезагрузку и экспорт; перенос не теряет старое расписание", () => {
  const base = reviewWord(30);
  base.vocab["V:Test|de"] = { ...base.vocab["V:Test|ru"], iv: 100 };
  const win = env.load(SYNC, { storage: { "de-b1-progress-v1": JSON.stringify(base) } });
  win.Store.mutate("vocabWordReview", { key: "V:Test|ru", ok: true, expectedDue: T, day: "2026-10-01" });
  const reload = env.load(SYNC, { storage: { ...win.localStorage._dump() } });
  assert.equal(reload.Store.state().v, 7);
  assert.equal(reload.Store.vocabSchedule(reload.Store.state().vocab, "V:Test").pairRu, true);
  const imported = env.load(SYNC); imported.Store.importBackup(reload.Store.exportBackup());
  assert.equal(imported.Store.vocabSchedule(imported.Store.state().vocab, "V:Test").pairRu, true);
  assert.equal(imported.Store.state().vocab["V:Test|de"].iv, 100);
  delete base.vocab["V:Test|ru"];
  const moved = win.Store._reduce(base, [wordOp(1, "ru", true)]);
  assert.equal(moved.vocab["V:Test|ru"].iv, 100);
  assert.equal(moved.vocab["V:Test|ru"].pairRu, true);
  assert.deepEqual(moved.vocab["V:Test|de"], base.vocab["V:Test|de"]);
});

test("новая очередь, калибровка и старые сессии начинают с русского; половина открывает немецкую сторону", () => {
  const win = env.load(SYNC);
  win.COURSE = { lessons: [] }; win.VOCAB = [{ de: "Test", ru: "тест", f: 1 }];
  const source = require("node:fs").readFileSync(env.ROOT + "/js/app.js", "utf8");
  const context = require("node:vm").createContext({ window: win, Store: win.Store,
    S: win.Store.state(), V_LEVELS: 5, CFG: win.SRS_CONFIG, E: { shuffle: (items) => items } });
  require("node:vm").runInContext(source.slice(source.indexOf("  function vocabPool()"), source.indexOf("  /* Незакрытая сессия")), context);
  require("node:vm").runInContext(source.slice(source.indexOf("  function vocabResume("), source.indexOf("  /* ---------- экран карточек")), context);
  assert.equal(context.vocabSplit().fresh[0].dir, "ru");
  assert.equal(context.vocabSplit().fresh.length, 1);
  assert.equal(context.vocabCalibPlan()[0].dir, "ru");
  context.S = win.Store._reduce(reviewWord(30), []);
  assert.equal(context.vocabRepeatPlan()[0].dir, "ru");
  context.S = win.Store._reduce(reviewWord(30), [wordOp(1, "ru", true)]);
  assert.equal(context.vocabRepeatPlan()[0].dir, "de");
  assert.equal(context.vocabSplit().fresh.length, 0);
  const cards = {}; context.vocabCards().forEach((card) => { cards[card.key] = card; });
  context.S = win.Store._reduce(reviewWord(1), []);
  const saved = { keys: ["V:Done|de", "V:Test|de", "V:Test|ru"], i: 1, done: 1, first: { "V:Done|de": true }, at: T };
  const resumed = context.vocabResume(saved, cards);
  assert.deepEqual(Array.from(resumed.keys), ["V:Done|de", "V:Test|ru"]);
  assert.equal(resumed.i, 1); assert.equal(resumed.done, 1);
  assert.equal(saved.keys.length, 3);
});

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

test("после перезагрузки и офлайн-ответа журналы других авторов остаются на месте", () => {
  const other = [{ type: "dayDone", device: "other", seq: 1, lc: 10, t: T, n: 18, di: 1, score: 15, of: 16 }];
  const first = env.load(SYNC, { storage: { "de-b1-foreign-v1": JSON.stringify({ other }) } });
  assert.ok(first.Store.state().done.L18D1);
  const next = env.load(SYNC, { storage: { ...first.localStorage._dump() } });
  next.Store.mutate("answer", { ok: true });
  assert.ok(next.Store.state().done.L18D1);
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

test("логические часы начинаются с нуля, а опасный идентификатор отклоняется", () => {
  const win = env.load(SYNC);
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

test("вкладки одного устройства пишут разные журналы и оба ответа сходятся", () => {
  const storage = env.makeStorage();
  const a = env.load(SYNC, { localStorage: storage }); const b = env.load(SYNC, { localStorage: storage });
  a.Store.mutate("answer", { ok: true }); b.Store.mutate("answer", { ok: false });
  a._fire("storage", { key: "de-b1-oplog-v2:" + b.Store.device }); b._fire("storage", { key: "de-b1-oplog-v2:" + a.Store.device });
  assert.notEqual(a.Store.device, b.Store.device);
  assert.equal(JSON.parse(storage.getItem("de-b1-oplog-v2:" + a.Store.device)).ops.length, 1);
  assert.equal(JSON.parse(storage.getItem("de-b1-oplog-v2:" + b.Store.device)).ops.length, 1);
  assert.equal(a.Store.state().totalTried, 2); assert.equal(b.Store.state().totalTried, 2);
});

test("ответ закрытой вкладки виден после перезагрузки без новых ответов", () => {
  const storage = env.makeStorage(); const closed = env.load(SYNC, { localStorage: storage });
  closed.Store.mutate("answer", { ok: true });
  const reload = env.load(SYNC, { localStorage: storage });
  assert.equal(reload.Store.state().totalTried, 1); assert.equal(reload.Store.state().totalCorrect, 1);
  assert.notEqual(reload.Store.device, closed.Store.device);
});

test("вкладки сходятся без повторяющегося цикла событий записи и принимают журналы прежних версий", () => {
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
  foreign.old = [{ type: "answer", ok: true, device: "old", seq: 1, lc: 100, t: T }];
  storage.setItem("de-b1-foreign-v1", JSON.stringify(foreign));
  b._fire("storage", { key: "de-b1-foreign-v1" }); assert.equal(b.Store.state().totalTried, 3);
});

test("подсказки артиклей не сбрасывают старый черновик дня", () => {
  const win = env.load(SYNC.concat(["js/practice.js"]));
  const old = [{ type: "translate", ru: "Это дом.", a: ["Das ist ein Haus."] }];
  const draft = win.Practice.create(18, 0, old);
  draft.records = [{ draft: { values: ["Das ist"] } }];
  win.Practice.save(draft);
  const current = [{ ...old[0], articleHint: "дом: e" }];
  assert.equal(win.Practice.load(18, 0, current).id, draft.id);
  assert.equal(win.Practice.load(18, 0, current).records[0].draft.values[0], "Das ist");
});

test("перевод показывает артикли в старой сессии и образец сразу, включая восстановление", () => {
  const win = env.load(["data/lessons.js", "data/l18.js", "js/engine.js"]);
  function node(tag) {
    return { tag, children: [], innerHTML: "", value: "", appendChild(child) { this.children.push(child); },
      setAttribute() {}, addEventListener() {}, focus() {} };
  }
  win.document.createElement = node;
  const exercise = win.L18.days[2].ex.find(e => e.type === "translate" && e.ru.includes("Учитель"));
  const old = { ...exercise }; delete old.articleHint;
  const host = node("div"); let calls = 0;
  const api = win.Engine.render(old, host, () => calls++);
  assert.match(host.children.find(n => n.className === "article-hint").innerHTML, /учитель: d; ученик: d/);
  host.children.find(n => n.tag === "input").value = "Ich weiß nicht";
  api.check();
  const feedback = host.children.find(n => /feedback/.test(n.className));
  assert.match(feedback.innerHTML, /Образец: <b>Der Lehrer fragt den frechen Schüler\./);
  assert.doesNotMatch(feedback.innerHTML, /details|summary/);
  assert.equal(api.result.verdict, "needs-review");
  const restored = node("div");
  win.Engine.render(old, restored, () => calls++, { draft: { values: ["Ich weiß nicht"], result: api.result } });
  assert.match(restored.children.find(n => /feedback/.test(n.className)).innerHTML, /Образец:/);
  assert.equal(calls, 1);
});

test("удаление задания переживает перезагрузку, облако и экспорт, повтор не возвращает его", () => {
  const files = SYNC.concat(["js/practice.js", "js/review.js"]);
  const a = env.load(files), b = env.load(files);
  const ex = { type: "translate", ru: "Это дом.", a: ["Das ist ein Haus."], why: "Пример" };
  const seed = a.Store.cloudSeed("project:user:deleted");
  a.Store.attachCloud(seed); b.Store.attachCloud(seed);
  a.Store.mutate("srsAdd", { id: "L18D0-0", n: 18, ex });
  const old = a.ReviewPlan.create([{ id: "L18D0-0", r: a.Store.state().srs["L18D0-0"] }]);
  a.Store.mutate("exerciseDelete", { id: "L18D0-0", ex, reason: "Механическая работа" });
  a.Store.mutate("srsAdd", { id: "L18D0-0", n: 18, ex });
  assert.equal(a.Store.state().srs["L18D0-0"], undefined);
  assert.equal(a.ReviewPlan.pending(old.items[0], a.Store.state()), false);
  b.Store.mergeCloud(a.Store.cloudOperations());
  assert.equal(b.Store.state().deletedExercises["L18D0-0"].reason, "Механическая работа");
  const reload = env.load(files, { storage: a.localStorage._dump() });
  assert.equal(reload.Store.state().deletedExercises["L18D0-0"].ex.type, "translate");
  const imported = env.load(files); imported.Store.importBackup(a.Store.exportBackup());
  assert.equal(imported.Store.state().deletedExercises["L18D0-0"].reason, "Механическая работа");
  assert.throws(() => a.Store.mutate("exerciseDelete", { id: "L18D0-0", ex, reason: "" }));
});

test("пропуск сохраняется только в сессии и не меняет отметку уже пройденного дня", () => {
  const w = env.load(SYNC.concat(["js/practice.js"]));
  const ex = [{ type: "fill", q: "{}", a: ["a"] }, { type: "fill", q: "{}", a: ["b"] }];
  const run = w.Practice.create(18, 0, ex);
  run.records = [{ omitted: "skipped", draft: { values: ["черновик"] } }, { result: { ok: true } }];
  run.i = 2; w.Practice.save(run);
  const reload = env.load(SYNC.concat(["js/practice.js"]), { storage: w.localStorage._dump() });
  const restored = reload.Practice.load(18, 0, ex), stats = reload.Practice.stats(restored);
  assert.equal(stats.skipped, 1); assert.equal(stats.answered, 1); assert.equal(stats.correct, 1);
  reload.Store.mutate("practiceDone", { n: 18, di: 0, score: 1, of: 1, records: run.records, attemptId: "partial" });
  assert.equal(reload.Store.state().done.L18D0, undefined);
  assert.equal(reload.Store.state().totalTried, 0);
  reload.Store.mutate("dayDone", { n: 18, di: 0, score: 2, of: 2 });
  reload.Store.mutate("practiceDone", { n: 18, di: 0, score: 1, of: 1, records: run.records, attemptId: "partial2" });
  assert.equal(reload.Store.state().done.L18D0.score, 2);
  assert.equal(reload.Store.state().attempts.at(-1).partial, true);
  reload.Practice.remove(18, 0);
  assert.equal(reload.Practice.create(18, 0, ex).records.length, 0);
});

test("удалённый пример не используется вариантом другого задания", () => {
  const w = env.load(SYNC.concat(["js/review.js"]));
  const ex = { type: "fill", q: "a {}", a: ["a"], skill: "test" };
  const alternative = { type: "fill", q: "b {}", a: ["b"], skill: "test" };
  w.L18 = { days: [{ ex: [ex, alternative] }] };
  w.Store.mutate("exerciseDelete", { id: "L18D0-1", ex: alternative, reason: "Ошибка в задании" });
  const item = { id: "L18D0-0", r: { n: 18, box: 1, due: 0, ex } };
  assert.equal(w.ReviewPlan.variant(item, w.Store.state()), ex);
  assert.equal(w.ReviewPlan.deleted({ id: "L18D0-0", ex: alternative }, w.Store.state()), true);
});

test("удалённое подключение очищает старый ключ, сохраняя прогресс и совместимость журнала", () => {
  const old = stored(); old.wordHints = { 'G:alt': 'Старая подсказка' };
  const w = env.load(SYNC, { storage: {
    'de-openai-settings-v1': JSON.stringify({ key: 'sk-test-obsolete', model: 'old' }),
    'de-b1-progress-v1': JSON.stringify(old)
  } });
  assert.equal(w.localStorage.getItem('de-openai-settings-v1'), null);
  assert.equal(w.Store.state().totalTried, old.totalTried);
  assert.equal(w.Store.state().wordHints['G:alt'], 'Старая подсказка');
  w.Store.mutate('wordHint', { key: 'G:alt', text: 'Историческая операция' });
  const restored = env.load(SYNC); restored.Store.importBackup(w.Store.exportBackup());
  assert.equal(restored.Store.state().totalTried, old.totalTried);
  assert.equal(restored.Store.state().wordHints['G:alt'], 'Историческая операция');
  assert.ok(!w.Store.exportBackup().includes('sk-test-obsolete'));
});

test('отмена ответа восстанавливает обе стороны слова и переживает загрузку журнала', () => {
  for (const type of ['vocabWordReview', 'vocabKnown']) {
    const win = env.load(SYNC);
    const before = { 'V:Test|ru': null, 'V:Test|de': null };
    if (type === 'vocabKnown') win.Store.mutate(type, { key: 'V:Test' });
    else win.Store.mutate(type, { key: 'V:Test|ru', ok: false, expectedDue: 0, day: '2026-10-15' });
    const after = JSON.parse(JSON.stringify({ 'V:Test|ru': win.Store.state().vocab['V:Test|ru'] || null, 'V:Test|de': win.Store.state().vocab['V:Test|de'] || null }));
    const args = { key: 'V:Test', before, after, beforeLevel: 1, afterLevel: 1, beforeCalibrated: false, afterCalibrated: false };
    win.Store.mutate('vocabUndo', args);
    assert.equal(Object.keys(win.Store.state().vocab).length, 0);
    const reload = env.load(SYNC, { storage: win.localStorage._dump() });
    assert.equal(Object.keys(reload.Store.state().vocab).length, 0);
    reload.Store.mutate('vocabKnown', { key: 'V:Test' });
    reload.Store.mutate('vocabKnown', { key: 'V:Test' });
    const changed = JSON.stringify(reload.Store.state().vocab);
    reload.Store.mutate('vocabUndo', args);
    assert.equal(JSON.stringify(reload.Store.state().vocab), changed);
  }
});

test('отмена не затирает новый ответ другого устройства и не затрагивает другие слова', () => {
  const win = env.load(SYNC);
  const base = reviewWord(30);
  const first = wordOp(1, 'ru', true);
  const half = win.Store._reduce(base, [first]);
  const before = { 'V:Test|ru': base.vocab['V:Test|ru'], 'V:Test|de': null };
  const after = { 'V:Test|ru': half.vocab['V:Test|ru'], 'V:Test|de': null };
  const undo = { type: 'vocabUndo', key: 'V:Test', before, after, beforeLevel: 1, afterLevel: 1,
    beforeCalibrated: true, afterCalibrated: true, device: 'one', seq: 3, lc: 3, t: T + 100 };
  win.ProgressData.operation(undo);
  undo.after['V:Test|ru'] = Object.fromEntries(Object.entries(undo.after['V:Test|ru']).reverse());
  assert.deepEqual(JSON.parse(JSON.stringify(win.Store._reduce(base, [first, undo]).vocab)), base.vocab);
  const second = { ...wordOp(2, 'de', true), device: 'two' };
  const expected = win.Store._reduce(base, [first, second]);
  const actual = win.Store._reduce(base, [undo, second, first, undo]);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.vocab)), JSON.parse(JSON.stringify(expected.vocab)));
  assert.throws(() => win.ProgressData.operation({ ...undo, key: 'V:Other' }));
});
