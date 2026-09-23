/* Sync engine: журнал операций вместо перезаписи состояния.

   Идея. Интерфейс читает только локальное состояние и никогда не ждёт сеть.
   Любое изменение — это операция (мутация) с меткой логических часов, она
   применяется локально сразу и ложится в журнал. Журнал уезжает в облако.
   Состояние = детерминированная свёртка снапшота и всех журналов.

   Почему без сервера. Авторитетного узла, который выполняет мутации, у нас нет:
   хранилище артефакта умеет только документы. Его роль берёт на себя свёртка —
   она детерминирована, поэтому все устройства из одних и тех же операций
   получают одно и то же состояние. Порядок задают часы Лампорта, ничья
   разрешается по идентификатору устройства.

   Почему нет конфликтов записи. Каждое устройство пишет ТОЛЬКО свой документ
   журнала `oplogs/<device>`. Два устройства физически не могут писать в один
   документ, поэтому last-writer-wins нигде не участвует и офлайн-правки с
   разных устройств складываются, а не затирают друг друга.

   Компакция. Журналы растут, поэтому изредка состояние сворачивается в снапшот
   `sync/snapshot` с курсором «какие операции в него уже вошли», а устройства
   подрезают свои журналы по этому курсору с запасом. */
window.Store = (function () {
  "use strict";

  var SCHEMA = 4;
  var LS_STATE = "de-b1-progress-v1";   /* материализованное состояние, для мгновенного старта */
  var LS_OPS = "de-b1-oplog-v1";        /* собственный журнал */
  var LS_DEV = "de-b1-device-v1";       /* идентификатор устройства */

  /* Все числа расписания живут в js/srs-config.js — правятся там.
     Значения ниже служат запасными, если конфиг почему-то не загрузился. */
  var CFG = window.SRS_CONFIG || {};
  function cfg(name, fallback) { return CFG[name] != null ? CFG[name] : fallback; }

  var EASE_START = cfg("easeStart", 2.5);
  var EASE_MIN = cfg("easeMin", 1.3);
  var EASE_EASY = cfg("easeFast", 0.15);
  var EASE_LAPSE = cfg("easeLapse", 0.2);
  var EASY_BONUS = cfg("fastBonus", 1.3);
  var IV_GRAD = cfg("ivGraduate", 1);
  var IV_EASY = cfg("ivFast", 4);
  var IV_MIN = cfg("ivMin", 1);
  var IV_LAPSE = cfg("ivLapse", 3);
  var LAPSE_KEEP = cfg("lapseKeep", 0.3);
  var IV_LEARNED = cfg("ivLearned", 100);
  var FUZZ = cfg("fuzz", 0.05);

  var LADDER = [1, 3, 7, 14, 30];       /* прежняя лестница, нужна только для переноса */
  var SRS_LADDER = [0, 864e5, 3 * 864e5];   /* очередь ошибок в заданиях, 3 бокса */

  /* Разброс обязан быть детерминированным: свёртка журнала выполняется на всех
     устройствах и должна давать одинаковый результат. Берём его из хеша
     ключа и номера операции, а не из генератора случайных чисел. */
  function fuzz(key, seq, iv) {
    if (iv < 2) return iv;
    var h = 0, str = key + ":" + seq;
    for (var i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    var k = ((h >>> 0) % 1000) / 1000;            /* 0..1 */
    return Math.max(IV_MIN, Math.round(iv * (1 + (k * 2 - 1) * FUZZ)));
  }

  var COMPACT_AT = 250;   /* столько операций в сумме — пора сворачивать */
  var TRIM_MARGIN = 50;   /* столько последних операций не подрезаем, страховка от гонки снапшотов */
  var READY_WAIT = 4000;  /* столько ждём облако, прежде чем показать то, что есть */

  /* ---------- состояние ---------- */

  function blank() {
    return {
      v: SCHEMA, done: {}, srs: {}, vocab: {},
      vocabLevel: 1, calibrated: false, streak: 0, lastDay: null,
      totalCorrect: 0, totalTried: 0, resetAt: 0
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Перенос со схемы 3: ящик лестницы превращается в интервал в днях,
     лёгкость у всех стартовая. Сроки и счётчик промахов сохраняются. */
  function fromBox(e) {
    var box = e.box || 0;
    return {
      iv: box > 0 ? LADDER[Math.min(box, LADDER.length) - 1] : 0,
      ease: EASE_START,
      reps: box,
      lapses: e.lapses || 0,
      due: e.due || 0,
      learned: !!e.learned,
      t: e.t || 0
    };
  }

  function migrateVocabShape(st) {
    if (!st || !st.vocab) return st;
    for (var k in st.vocab) {
      var e = st.vocab[k];
      if (e && e.iv == null) st.vocab[k] = fromBox(e);
    }
    return st;
  }

  /* ---------- редьюсер ----------
     Чистая функция: (состояние, операция) → состояние.
     Время берётся из самой операции (op.t), а не из часов — иначе повтор
     свёртки на другом устройстве дал бы другие сроки повторения. */
  function apply(s, op) {
    var v, r, y;
    switch (op.type) {

      case "reset":
        s = blank();
        s.resetAt = op.t;
        return s;

      case "answer":
        s.totalTried++;
        if (op.ok) s.totalCorrect++;
        return s;

      case "dayDone":
        s.done["L" + op.n + "D" + op.di] = { at: op.t, score: op.score, of: op.of };
        return s;

      case "touchDay":
        if (s.lastDay !== op.day) {
          y = new Date(Date.parse(op.day + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
          s.streak = s.lastDay === y ? (s.streak || 0) + 1 : 1;
          s.lastDay = op.day;
        }
        return s;

      case "srsAdd":
        s.srs[op.id] = { box: 0, due: op.t, ex: op.ex, n: op.n };
        return s;

      case "srsHit":
        r = s.srs[op.id];
        if (!r) return s;
        if (op.ok) {
          r.box++;
          if (r.box >= SRS_LADDER.length) delete s.srs[op.id];
          else r.due = op.t + SRS_LADDER[r.box];
        } else {
          r.box = 0;
          r.due = op.t;
        }
        return s;

      /* Карточка слова по SM-2.
         «знаю»      → интервал × лёгкость, быстрый ответ ещё × 1.3 и лёгкость вверх
         «не знаю»   → лёгкость вниз, интервал сбрасывается в сутки
         Новая карточка выпускается на сутки, при быстром ответе сразу на четыре. */
      case "vocabGrade":
        v = s.vocab[op.key] || { iv: 0, ease: EASE_START, reps: 0, lapses: 0, due: 0, learned: false };
        if (v.box != null && v.iv == null) v = fromBox(v);   /* запись старого формата */
        var fast = op.fast || (op.pts || 0) >= 10;

        if (op.ok) {
          if (!v.reps) v.iv = fast ? IV_EASY : IV_GRAD;
          else v.iv = fuzz(op.key, op.seq, Math.max(IV_MIN, v.iv * v.ease * (fast ? EASY_BONUS : 1)));
          if (fast) v.ease = v.ease + EASE_EASY;
          v.reps = (v.reps || 0) + 1;
          if (v.iv >= IV_LEARNED) { v.learned = true; v.due = 0; }
          else v.due = op.t + v.iv * 864e5;
        } else {
          /* лёгкость роняем только у карточек, уже вышедших из изучения:
             новая карточка ещё не заслужила штрафа, как и в Anki */
          if (v.reps) {
            v.ease = Math.max(EASE_MIN, v.ease - EASE_LAPSE);
            /* срыв не отбрасывает в самое начало: остаётся треть прежнего
               интервала, но не меньше второго — трёх суток */
            v.iv = Math.max(IV_LAPSE, Math.round(v.iv * LAPSE_KEEP));
          } else {
            v.iv = IV_MIN;
          }
          v.lapses = (v.lapses || 0) + 1;
          v.due = op.t + v.iv * 864e5;
        }
        v.t = op.t;
        s.vocab[op.key] = v;
        return s;

      case "vocabLevel":
        s.vocabLevel = op.level;
        return s;

      /* «уже знаю»: слово закрывается целиком, оба направления */
      case "vocabKnown":
        ["|de", "|ru"].forEach(function (dir) {
          var e = s.vocab[op.key + dir] || { iv: 0, ease: EASE_START, reps: 0, lapses: 0, due: 0, learned: false };
          if (e.box != null && e.iv == null) e = fromBox(e);
          e.learned = true;
          e.due = 0;
          e.iv = IV_LEARNED;
          e.reps = (e.reps || 0) + 1;
          e.t = op.t;
          s.vocab[op.key + dir] = e;
        });
        return s;

      /* калибровка на входе: сразу ставит ступень частотности */
      case "calibrate":
        s.vocabLevel = op.level;
        s.calibrated = true;
        return s;
    }
    return s;
  }

  /* порядок: логические часы, при ничьей — устройство, затем номер операции */
  function cmp(a, b) {
    if (a.lc !== b.lc) return a.lc - b.lc;
    if (a.device !== b.device) return a.device < b.device ? -1 : 1;
    return a.seq - b.seq;
  }

  function reduce(base, ops) {
    var s = base ? clone(base) : blank();
    ops.slice().sort(cmp).forEach(function (op) { s = apply(s, op); });
    s.v = SCHEMA;
    return s;
  }

  /* ---------- локальное хранилище ---------- */

  function lsGet(k, fallback) {
    try {
      var raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function deviceId() {
    var d = null;
    try { d = localStorage.getItem(LS_DEV); } catch (e) {}
    if (!d) {
      d = "d" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6);
      try { localStorage.setItem(LS_DEV, d); } catch (e) {}
    }
    return d;
  }

  var DEV = deviceId();
  var mine = lsGet(LS_OPS, null) || { device: DEV, seq: 0, lc: 0, ops: [] };
  var snapshot = lsGet("de-b1-snapshot-v1", null);   /* последний известный снапшот */
  var foreign = {};                                   /* device → массив операций */
  var state = lsGet(LS_STATE, null);
  var listeners = [], statusListeners = [];
  var DB = null, pushTimer = null, pushing = false, dirty = false, legacyDone = false;

  /* Готовность состояния. На телефоне localStorage переживает не каждое
     открытие: у артефакта своё хранилище, и после публикации оно бывает
     пустым. Тогда состояние приходит только из облака, и до его прихода
     интерфейсу нечего показывать — нули вместо прогресса пугают сильнее
     честного «подтягиваю». hydrated — состояние поднялось с диска,
     cloudSeen — облако уже ответило (пусть даже пустотой). */
  var hydrated = !!state;
  var cloudSeen = false;
  var readyTimer = null;
  var connectAt = 0;

  /* Миграция со схемы 2: прежнее состояние становится стартовым снапшотом,
     журнал начинается пустым. Ничего не теряется. */
  if (!state || state.v !== SCHEMA) {
    if (state) {
      try { localStorage.setItem(LS_STATE + "-backup-v" + (state.v || 2), JSON.stringify(state)); } catch (e) {}
      state.v = SCHEMA;
      state.resetAt = state.reset || 0;
      migrateVocabShape(state);
      if (snapshot && snapshot.state) migrateVocabShape(snapshot.state);
      if (!snapshot) snapshot = { v: SCHEMA, state: clone(state), cursor: {}, at: Date.now() };
    } else {
      state = blank();
    }
    lsSet(LS_STATE, state);
    if (snapshot) lsSet("de-b1-snapshot-v1", snapshot);
  }

  function notify() {
    listeners.forEach(function (fn) {
      /* падение одного слушателя не должно ронять остальных, но и молча
         съедать его нельзя: именно так теряются неотрисованные экраны */
      try { fn(state); } catch (e) { if (window.console) console.error("listener failed", e); }
    });
  }

  function markCloudSeen() {
    if (cloudSeen) return;
    cloudSeen = true;
    clearTimeout(readyTimer);
    notify();
  }

  function materialize() {
    var ops = mine.ops.slice();
    for (var d in foreign) if (d !== DEV) ops = ops.concat(foreign[d]);
    state = reduce(snapshot ? snapshot.state : null, dropCovered(ops));
    lsSet(LS_STATE, state);
    hydrated = true;
    notify();
    return state;
  }

  /* операции, уже вошедшие в снапшот, повторно не применяем */
  function dropCovered(ops) {
    if (!snapshot || !snapshot.cursor) return ops;
    var cur = snapshot.cursor;
    return ops.filter(function (op) { return op.seq > (cur[op.device] || 0); });
  }

  function setStatus(txt, cls) {
    statusListeners.forEach(function (fn) { try { fn(txt, cls); } catch (e) {} });
  }

  /* ---------- мутации ---------- */

  function mutate(type, args) {
    var op = args ? clone(args) : {};
    op.type = type;
    op.device = DEV;
    op.seq = ++mine.seq;
    op.lc = ++mine.lc;
    op.t = Date.now();
    mine.ops.push(op);
    lsSet(LS_OPS, mine);
    materialize();
    schedulePush();
    return state;
  }

  /* ---------- транспорт ---------- */

  function schedulePush() {
    if (!DB) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 900);
  }

  function push() {
    if (!DB) return;
    /* устройству без единой операции писать нечего: пустой документ
       в oplogs только мусорит коллекцию и ничего не переносит */
    if (!mine.ops.length) return;
    if (pushing) { dirty = true; return; }
    pushing = true; dirty = false;
    setStatus("синк…");
    DB.doc("oplogs/" + DEV).set({ device: DEV, seq: mine.seq, lc: mine.lc, ops: mine.ops, at: Date.now() })
      .then(function () {
        pushing = false;
        setStatus("синк ✓", "ok");
        if (dirty) push();
        else maybeCompact();
      }, function () {
        pushing = false;
        setStatus("синк ✗", "bad");
      });
  }

  function onSnapshotDoc(snap) {
    markCloudSeen();
    if (!snap.exists) return;
    var d = snap.data();
    if (!d || !d.state) return;
    if ((d.v || 0) > SCHEMA) { setStatus("обнови страницу", "bad"); return; }
    snapshot = { v: d.v, state: d.state, cursor: d.cursor || {}, at: d.at || 0 };
    lsSet("de-b1-snapshot-v1", snapshot);
    trimMine();
    materialize();
  }

  /* свои операции, давно попавшие в снапшот, можно выбросить — но с запасом,
     на случай если снапшот перезапишет более старый */
  function trimMine() {
    var covered = (snapshot && snapshot.cursor && snapshot.cursor[DEV]) || 0;
    var keepFrom = covered - TRIM_MARGIN;
    if (keepFrom <= 0) return;
    var before = mine.ops.length;
    mine.ops = mine.ops.filter(function (op) { return op.seq > keepFrom; });
    if (mine.ops.length !== before) { lsSet(LS_OPS, mine); schedulePush(); }
  }

  function onLogs(qsnap) {
    markCloudSeen();
    var seen = {};
    qsnap.docs.forEach(function (doc) {
      var d = doc.data();
      if (!d || !d.ops || d.device === DEV) return;
      seen[d.device] = d.ops;
      if (d.lc > mine.lc) mine.lc = d.lc;   /* часы Лампорта догоняют чужие */
    });
    foreign = seen;
    lsSet(LS_OPS, mine);
    materialize();
  }

  /* Разовый перенос: состояние из старого документа v2 складывается в снапшот,
     чтобы прогресс с устройства, ещё не обновившегося, не потерялся. */
  function importLegacy() {
    if (legacyDone || !DB) return;
    legacyDone = true;
    DB.doc("progress/main").get().then(function (snap) {
      if (!snap.exists) return;
      var old = snap.data();
      if (!old || !old.done) return;
      var base = snapshot ? clone(snapshot.state) : blank();
      var changed = false, k;
      for (k in (old.done || {})) if (!base.done[k]) { base.done[k] = old.done[k]; changed = true; }
      for (k in (old.vocab || {})) {
        var mineV = base.vocab[k];
        if (!mineV || (old.vocab[k].t || 0) > (mineV.t || 0)) { base.vocab[k] = old.vocab[k]; changed = true; }
      }
      ["totalCorrect", "totalTried", "streak"].forEach(function (f) {
        if ((old[f] || 0) > (base[f] || 0)) { base[f] = old[f]; changed = true; }
      });
      if (old.lastDay && (!base.lastDay || old.lastDay > base.lastDay)) { base.lastDay = old.lastDay; changed = true; }
      if (!changed) return;
      snapshot = { v: SCHEMA, state: base, cursor: (snapshot && snapshot.cursor) || {}, at: Date.now() };
      lsSet("de-b1-snapshot-v1", snapshot);
      materialize();
      writeSnapshot();
    }, function () {});
  }

  /* ---------- компакция ---------- */

  function totalOps() {
    var n = mine.ops.length;
    for (var d in foreign) n += foreign[d].length;
    return n;
  }

  function maybeCompact() {
    if (!DB || totalOps() < COMPACT_AT) return;
    /* аренда: сворачивает кто-то один, остальные пропускают ход */
    DB.doc("sync/snapshot").acquire({ holder: DEV, ttlMs: 20000 }).then(function (res) {
      if (res && res.acquired) writeSnapshot();
    }, function () {});
  }

  function writeSnapshot() {
    if (!DB) return;
    var cursor = {};
    cursor[DEV] = mine.seq;
    for (var d in foreign) {
      var ops = foreign[d];
      cursor[d] = ops.length ? ops[ops.length - 1].seq : 0;
    }
    DB.doc("sync/snapshot").set({ v: SCHEMA, state: clone(state), cursor: cursor, at: Date.now(), by: DEV })
      .then(function () {
        snapshot = { v: SCHEMA, state: clone(state), cursor: cursor, at: Date.now() };
        lsSet("de-b1-snapshot-v1", snapshot);
        trimMine();
      }, function () {});
  }

  /* возврат к приложению: дожать журнал в облако и перерисовать интерфейс */
  function resume() {
    if (document.hidden) return;
    /* таймер ожидания мог простоять замороженным вместе со страницей,
       поэтому срок проверяем по стенным часам, а не по факту срабатывания */
    if (!cloudSeen && connectAt && Date.now() - connectAt > READY_WAIT) markCloudSeen();
    schedulePush();
    notify();
  }

  /* ---------- подключение ---------- */

  function connect() {
    if (!window.claude || typeof claude.use !== "function") { markCloudSeen(); return; }
    /* если облако молчит, интерфейс не должен ждать его вечно */
    connectAt = Date.now();
    readyTimer = setTimeout(markCloudSeen, READY_WAIT);
    claude.use("db").then(function (db) {
      if (!db) { markCloudSeen(); return; }
      DB = db;
      setStatus("синк…");
      db.doc("sync/snapshot").onSnapshot(onSnapshotDoc, function () { setStatus("синк ✗", "bad"); });
      db.collection("oplogs").onSnapshot(onLogs, function () { setStatus("синк ✗", "bad"); });
      importLegacy();
      push();
    }, function () { markCloudSeen(); });

    /* офлайн-очередь: журнал уже на диске, при возврате сети просто дожимаем */
    window.addEventListener("online", function () { schedulePush(); });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) resume();
    });
    /* iOS замораживает страницу приложения с экрана «Домой»: ответ облака
       приходит, пока вкладка скрыта, и экран остаётся тем, каким его
       заморозили. Поэтому при возврате видимости разворачиваем состояние
       заново и будим слушателей — иначе прогресс появляется только после
       переключения вкладки вручную. */
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
  }

  return {
    SCHEMA: SCHEMA,
    LADDER: LADDER,
    device: DEV,
    state: function () { return state; },
    /* false, пока состояние не поднято ни с диска, ни из облака */
    ready: function () { return hydrated || cloudSeen; },
    mutate: mutate,
    onChange: function (fn) { listeners.push(fn); },
    onStatus: function (fn) { statusListeners.push(fn); },
    connect: connect,
    /* для отладки и тестов */
    _debug: function () {
      return { mine: mine, foreign: foreign, snapshot: snapshot, ops: totalOps() };
    },
    _reduce: reduce,
    _apply: apply,
    _blank: blank
  };
})();
