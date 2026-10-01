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

   Каждый экземпляр страницы пишет собственный журнал `oplogs/<writer>`
   и свой ключ localStorage. Даже вкладки одного устройства не заменяют
   записи друг друга. Материализованное состояние является только кешем.

   Компакция. Журналы растут, поэтому изредка состояние сворачивается в снапшот
   `sync/snapshot` с курсором «какие операции в него уже вошли», а устройства
   подрезают свои журналы по этому курсору с запасом. */
window.Store = (function () {
  "use strict";

  var SCHEMA = 6;
  var DATA = window.ProgressData;
  var LS_STATE = "de-b1-progress-v1";   /* материализованное состояние, для мгновенного старта */
  var LS_OPS = "de-b1-oplog-v1";        /* прежний общий журнал, только для чтения */
  var LOG_PREFIX = "de-b1-oplog-v2:";    /* отдельная запись на каждого автора */
  var LS_DEV = "de-b1-device-v1";       /* идентификатор устройства */
  var LS_FOREIGN = "de-b1-foreign-v1"; /* принятые журналы нужны и после офлайн-перезапуска */
  var storageError = "", blocked = false, externalWarnings = {};
  function warning() { return storageError || Object.keys(externalWarnings).map(function (key) { return externalWarnings[key]; }).join(" "); }

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
      totalCorrect: 0, totalTried: 0, totalUncertain: 0, attempts: [], answered: {}, resetAt: 0
    };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function advanceFromSnapshot() {
    if (!snapshot) return;
    var cursor = snapshot.cursor || {}, coveredCount = 0;
    Object.keys(cursor).forEach(function (id) { coveredCount += cursor[id]; });
    mine.seq = Math.max(mine.seq, cursor[DEV] || 0);
    /* Старые снимки не сохраняли часы. Сумма номеров покрытых журналов
       дает консервативную границу; новые снимки хранят точные часы. */
    mine.lc = Math.max(mine.lc, snapshot.lc || 0, coveredCount);
  }

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
  function upgrade(st) {
    var next = blank();
    Object.keys(st || {}).forEach(function (k) { next[k] = st[k]; });
    next.v = SCHEMA;
    return migrateVocabShape(next);
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
        if (op.attemptId && s.answered[op.attemptId]) return s;
        if (op.attemptId) {
          s.answered[op.attemptId] = op.t;
          var ids = Object.keys(s.answered);
          if (ids.length > 2000) ids.slice(0, ids.length - 2000).forEach(function (id) { delete s.answered[id]; });
        }
        if (op.verdict === "needs-review") { s.totalUncertain++; return s; }
        s.totalTried++;
        if (op.ok) s.totalCorrect++;
        return s;

      case "reviewAnswer":
        if (s.answered[op.attemptId]) return s;
        apply(s, { type: "answer", ok: op.ok, verdict: op.verdict, attemptId: op.attemptId, t: op.t });
        r = s.srs[op.id];
        if (op.verdict !== "needs-review" && r && r.box === op.expectedBox && r.due === op.expectedDue) apply(s, { type: "srsHit", id: op.id, ok: op.ok, t: op.t, policy: 2 });
        return s;

      case "dayDone":
        if (op.attemptId && s.attempts.some(function (a) { return a.id === op.attemptId; })) return s;
        s.done["L" + op.n + "D" + op.di] = { at: op.t, score: op.score, of: op.of };
        if (op.attemptId) {
          s.attempts.push({ id: op.attemptId, n: op.n, di: op.di, at: op.t, score: op.score, of: op.of, uncertain: op.uncertain || 0, hints: op.hints || 0, records: op.records || [] });
          s.attempts = s.attempts.slice(-100);
        }
        return s;

      case "touchDay":
        if (op.policy === 2) {
          var weekday = new Date(op.day + "T12:00:00Z").getUTCDay();
          if (weekday === 0 || weekday === 6 || (s.lastDay && op.day <= s.lastDay)) return s;
          s.streak = s.lastDay === DATA.previousStudyDay(op.day) ? (s.streak || 0) + 1 : 1;
          s.lastDay = op.day;
          return s;
        }
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
        if (op.policy === 2 && r.due > op.t) return s;
        if (op.ok) {
          r.box++;
          if (r.box >= SRS_LADDER.length) delete s.srs[op.id];
          else r.due = op.t + SRS_LADDER[r.box];
        } else {
          r.box = 0;
          r.due = op.t + (op.policy === 2 ? cfg("errorRetryMinutes", 1) * 60000 : 0);
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

      /* Новый график отдельной операцией: исторические vocabGrade не меняют смысл. */
      case "vocabReview":
        v = s.vocab[op.key] || { iv: 0, ease: EASE_START, reps: 0, lapses: 0, due: 0, learned: false, introducedAt: op.t, introducedDay: op.day || new Date(op.t).toISOString().slice(0, 10), stage: "learning", step: 0 };
        if (v.box != null && v.iv == null) v = fromBox(v);
        if (v.due > op.t && !v.learned) return s;
        v.introducedAt = v.introducedAt || op.t;
        v.learned = false;
        if (!op.ok) {
          v.ease = Math.max(EASE_MIN, v.ease - (v.reps ? EASE_LAPSE : 0));
          v.lapses = (v.lapses || 0) + 1; v.stage = "learning"; v.step = 0;
          v.due = op.t + cfg("learningRetryMinutes", 1) * 60000;
        } else if ((v.stage || (v.reps ? "review" : "learning")) === "learning") {
          v.step = (v.step || 0) + 1;
          if (v.step < 2) v.due = op.t + cfg("learningSuccessMinutes", 10) * 60000;
          else { v.stage = "review"; v.iv = IV_GRAD; v.reps = (v.reps || 0) + 1; v.due = op.t + v.iv * 864e5; }
        } else {
          v.stage = "review"; v.iv = Math.min(cfg("reviewMaxDays", 100), fuzz(op.key, op.seq, Math.max(IV_MIN, v.iv * v.ease)));
          v.reps = (v.reps || 0) + 1; v.due = op.t + v.iv * 864e5;
        }
        v.t = op.t; s.vocab[op.key] = v;
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
          e.selfAssessed = true;
          e.due = 0;
          e.iv = IV_LEARNED;
          e.reps = (e.reps || 0) + 1;
          e.t = op.t;
          s.vocab[op.key + dir] = e;
        });
        return s;

      case "restore":
        s = upgrade(DATA.state(op.state));
        s.resetAt = op.t;
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
    var s = base ? upgrade(clone(base)) : blank();
    var seen = {};
    ops.slice().sort(cmp).forEach(function (op) { var key = op.device + ":" + op.seq; if (!seen[key]) { seen[key] = true; s = apply(s, op); } });
    s.v = SCHEMA;
    return s;
  }

  /* ---------- локальное хранилище ---------- */

  function lsGet(k, fallback) {
    try {
      var raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { blocked = true; storageError = "Сохраненные данные повреждены. Исходные записи не изменены. Экспортируйте их в разделе «Ещё» и восстановите резервную копию."; return fallback; }
  }
  function lsSet(k, v) { if (blocked) return false; try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { storageError = "Изменения пока только в памяти: браузер не смог сохранить прогресс. Не закрывайте страницу; скачайте резервную копию или повторите сохранение в разделе «Ещё»."; return false; } }

  function deviceId() {
    var d = null;
    try { d = localStorage.getItem(LS_DEV); } catch (e) {}
    if (!d) {
      d = "d" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6);
      try { localStorage.setItem(LS_DEV, d); } catch (e) {}
    }
    return d;
  }

  /* Каждое открытие страницы - независимый автор. Общий идентификатор
     устройства остается для переноса, но вкладки не пишут в один журнал. */
  var DEV = deviceId() + "." + Date.now().toString(36) + "." + Math.random().toString(36).slice(2, 12);
  var OWN_LOG = LOG_PREFIX + DEV;
  var mine = { device: DEV, seq: 0, lc: 0, ops: [] };
  var snapshot = lsGet("de-b1-snapshot-v1", null);   /* последний известный снапшот */
  var foreign = lsGet(LS_FOREIGN, {});                /* device → массив операций */
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
  try {
    DATA.journal(mine); collectDiskLogs();
    if (state) DATA.state(state);
    DATA.object(foreign); Object.keys(foreign).forEach(function (key) { if (!Array.isArray(foreign[key])) throw new Error(); foreign[key].forEach(DATA.operation); });
    if (snapshot) DATA.snapshot(snapshot);
  } catch (e) { blocked = true; storageError = "Структура сохраненных данных повреждена. Исходные записи сохранены для экспорта и восстановления."; mine = { device: DEV, seq: 0, lc: 0, ops: [] }; foreign = {}; snapshot = null; state = null; }

  /* Миграция со схемы 2: прежнее состояние становится стартовым снапшотом,
     журнал начинается пустым. Ничего не теряется. */
  if (!state || state.v !== SCHEMA || !snapshot) {
    if (state) {
      try { localStorage.setItem(LS_STATE + "-backup-v" + (state.v || 2), JSON.stringify(state)); } catch (e) {}
      state.v = SCHEMA;
      state.resetAt = state.resetAt || state.reset || 0;
      migrateVocabShape(state);
      if (snapshot && snapshot.state) migrateVocabShape(snapshot.state);
      state = upgrade(state);
      if (!snapshot) {
        var covered = {}; mine.ops.forEach(function (op) { covered[op.device] = Math.max(covered[op.device] || 0, op.seq); });
        Object.keys(foreign).forEach(function (device) { foreign[device].forEach(function (op) { covered[op.device] = Math.max(covered[op.device] || 0, op.seq); }); });
        snapshot = { v: SCHEMA, state: clone(state), cursor: covered, at: Date.now(), recovered: true };
      }
    } else {
      state = blank();
      if (!snapshot) snapshot = { v: SCHEMA, state: clone(state), cursor: {}, at: Date.now(), recovered: true };
    }
    lsSet(LS_STATE, state);
    if (snapshot) lsSet("de-b1-snapshot-v1", snapshot);
  }
  advanceFromSnapshot();

  function saveLocal() {
    var ok = !mine.seq || lsSet(OWN_LOG, mine);
    var orderedForeign = {};
    Object.keys(foreign).sort().forEach(function (id) { orderedForeign[id] = foreign[id]; });
    if (!lsSet(LS_FOREIGN, orderedForeign)) ok = false;
    if (snapshot && !lsSet("de-b1-snapshot-v1", snapshot)) ok = false;
    if (!lsSet(LS_STATE, state)) ok = false;
    if (ok) storageError = "";
    return ok;
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
    saveLocal();
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
    if (warning()) { txt = warning(); cls = "bad"; }
    statusListeners.forEach(function (fn) { try { fn(txt, cls); } catch (e) {} });
  }

  /* ---------- мутации ---------- */

  function mutate(type, args) {
    if (blocked && type !== "reset" && type !== "restore") throw new Error(storageError);
    if (type === "restore") DATA.state(args.state);
    if (type === "reset" || type === "restore") { blocked = false; storageError = ""; }
    else if (!storageError) refreshDisk();
    if (blocked) throw new Error(storageError);
    var op = args ? clone(args) : {};
    op.type = type;
    op.device = DEV;
    op.seq = mine.seq + 1;
    op.lc = mine.lc + 1;
    op.t = Date.now();
    op.policy = 2;
    DATA.operation(op);
    mine.seq = op.seq; mine.lc = op.lc;
    mine.ops.push(op);
    lsSet(OWN_LOG, mine);
    materialize();
    schedulePush();
    setStatus(DB ? "синк…" : "только это устройство");
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
    /* После офлайн-перезагрузки прежние авторы уже не отправят свои записи.
       Переносим их операции в своем документе с исходными идентификаторами;
       документ соседней вкладки никогда не перезаписывается. */
    var relayed = localRelays();
    if (!mine.ops.length && !relayed.length) return;
    if (pushing) { dirty = true; return; }
    pushing = true; dirty = false;
    setStatus("синк…");
    DB.doc("oplogs/" + DEV).set({ device: DEV, seq: mine.seq, lc: mine.lc, ops: clone(mine.ops), relayed: relayed, at: Date.now() })
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
    try { DATA.snapshot({ state: d.state, cursor: d.cursor || {}, at: d.at || 0, lc: d.lc || 0 }); } catch (e) { setStatus("Некорректные данные облака; локальный прогресс сохранен.", "bad"); return; }
    if (snapshot && !snapshot.recovered && (d.at || 0) < snapshot.at) return;
    snapshot = { v: d.v, state: d.state, cursor: d.cursor || {}, at: d.at || 0, lc: d.lc || 0 };
    advanceFromSnapshot();
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
    if (mine.ops.length !== before) { lsSet(OWN_LOG, mine); schedulePush(); }
  }

  function onLogs(qsnap) {
    markCloudSeen();
    var seen = clone(foreign);
    qsnap.docs.forEach(function (doc) {
      var d = doc.data();
      if (!d || !d.ops) return;
      try { DATA.journal(d); } catch (e) { setStatus("Некорректный журнал облака; локальный прогресс сохранен.", "bad"); return; }
      [d].concat(d.relayed || []).forEach(function (log) {
        if (log.device === DEV) { mine.ops = mergeOps(mine.ops, log.ops); mine.seq = Math.max(mine.seq, log.seq || 0); }
        else seen[log.device] = mergeOps(seen[log.device] || [], log.ops);
        if (log.lc > mine.lc) mine.lc = log.lc;
      });
    });
    foreign = seen;
    lsSet(OWN_LOG, mine);
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
    var ops = mine.ops.slice();
    for (var d in foreign) ops = ops.concat(foreign[d]);
    return dropCovered(ops).length;
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
    var cursor = clone((snapshot && snapshot.cursor) || {});
    cursor[DEV] = Math.max(cursor[DEV] || 0, mine.seq);
    for (var d in foreign) {
      var ops = foreign[d];
      ops.forEach(function (op) { cursor[op.device] = Math.max(cursor[op.device] || 0, op.seq); });
    }
    var sent = { v: SCHEMA, state: clone(state), cursor: cursor, at: Date.now(), by: DEV, lc: mine.lc };
    DB.doc("sync/snapshot").set(sent)
      .then(function () {
        if (!snapshot || snapshot.recovered || snapshot.at <= sent.at) snapshot = { v: SCHEMA, state: sent.state, cursor: sent.cursor, at: sent.at, lc: sent.lc };
        lsSet("de-b1-snapshot-v1", snapshot);
        trimMine();
      }, function () {});
  }

  /* возврат к приложению: дожать журнал в облако и перерисовать интерфейс */
  function resume() {
    if (document.hidden) return;
    if (!storageError) refreshDisk();
    /* таймер ожидания мог простоять замороженным вместе со страницей,
       поэтому срок проверяем по стенным часам, а не по факту срабатывания */
    if (!cloudSeen && connectAt && Date.now() - connectAt > READY_WAIT) markCloudSeen();
    materialize();
    schedulePush();
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

  function mergeOps(a, b) {
    var entries = {}; a.concat(b).forEach(function (op) { entries[op.device + ":" + op.seq] = op; });
    return Object.keys(entries).map(function (key) { return entries[key]; }).sort(cmp);
  }
  function diskLogKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(LOG_PREFIX) === 0) keys.push(key);
    }
    return keys;
  }
  function localRelays() {
    var relayed = [];
    try {
      [LS_OPS].concat(diskLogKeys()).forEach(function (key) {
        var raw = localStorage.getItem(key), log = raw && JSON.parse(raw); if (!log || log.device === DEV) return;
        DATA.journal(log);
        if (key !== LS_OPS && key !== LOG_PREFIX + log.device) throw new Error("Неверный автор журнала");
        var ops = dropCovered(log.ops);
        if (ops.length) relayed.push({ device: log.device, seq: log.seq, lc: log.lc, ops: clone(ops) });
      });
    } catch (e) { setStatus("Не удалось перенести локальные журналы в облако. Исходные записи сохранены.", "bad"); }
    return relayed;
  }
  function collectDiskLogs() {
    [LS_OPS].concat(diskLogKeys()).forEach(function (key) {
      var disk = lsGet(key, null); if (!disk) return;
      DATA.journal(disk);
      if (key !== LS_OPS && key !== LOG_PREFIX + disk.device) throw new Error("Неверный автор журнала");
      if (disk.device === DEV) {
        mine.ops = mergeOps(mine.ops, disk.ops); mine.seq = Math.max(mine.seq, disk.seq); mine.lc = Math.max(mine.lc, disk.lc);
      } else foreign[disk.device] = mergeOps(foreign[disk.device] || [], disk.ops);
      mine.lc = Math.max(mine.lc, disk.lc);
    });
  }
  function refreshDisk() {
    if (blocked) return;
    try {
      var logs = lsGet(LS_FOREIGN, {}); DATA.object(logs);
      Object.keys(logs).forEach(function (id) { logs[id].forEach(DATA.operation); foreign[id] = mergeOps(foreign[id] || [], logs[id]); });
      collectDiskLogs();
      var next = lsGet("de-b1-snapshot-v1", null);
      if (next && (!snapshot || next.at > snapshot.at)) { DATA.snapshot(next); snapshot = next; advanceFromSnapshot(); }
    } catch (e) { blocked = true; storageError = "Другая вкладка сохранила поврежденные данные. Экспортируйте текущий прогресс перед восстановлением."; }
  }
  window.addEventListener("storage", function (event) {
    /* Материализованный кеш не запускает новую запись соседней вкладки. */
    if (event.key && event.key !== LS_OPS && event.key !== LS_FOREIGN && event.key !== "de-b1-snapshot-v1" && event.key.indexOf(LOG_PREFIX) !== 0) return;
    if (!storageError) { refreshDisk(); if (!blocked) materialize(); } });

  if (!blocked && (hydrated || totalOps())) materialize();

  return {
    SCHEMA: SCHEMA,
    LADDER: LADDER,
    device: DEV,
    state: function () { return state; },
    /* false, пока состояние не поднято ни с диска, ни из облака */
    ready: function () { return !blocked && (hydrated || cloudSeen); },
    blocked: function () { return blocked; },
    storageError: warning,
    warn: function (message, source) { externalWarnings[source || "session"] = message; setStatus(message, "bad"); },
    clearWarning: function (source) { delete externalWarnings[source]; setStatus(DB ? "синхронизация включена" : "только это устройство"); },
    flush: function () { saveLocal(); setStatus("Сохранено на устройстве", "ok"); push(); },
    exportBackup: function () { return JSON.stringify({ kind: "de-b1-backup", version: 2, at: Date.now(), state: state, drafts: window.Practice ? window.Practice.exportDrafts() : null, sessions: window.Sessions ? window.Sessions.exportSessions() : null }, null, 2); },
    exportRaw: function () { var raw = {}; [LS_STATE, LS_OPS, LS_FOREIGN, "de-b1-snapshot-v1", "de-b1-days-v2", "de-b1-day-v1", "de-b1-session-v1", "de-b1-review-v1"].concat(diskLogKeys()).forEach(function (key) { try { raw[key] = localStorage.getItem(key); } catch (e) { raw[key] = null; } }); return JSON.stringify(raw, null, 2); },
    importBackup: function (text) {
      if (typeof text !== "string" || text.length > 10000000) throw new Error("Файл слишком большой.");
      var parsed; try { parsed = JSON.parse(text); } catch (e) { throw new Error("Некорректный JSON. Текущий прогресс не изменен."); }
      DATA.object(parsed);
      if (parsed.kind === "de-b1-backup" && parsed.version != null && [1, 2].indexOf(parsed.version) < 0) throw new Error("Неизвестная версия резервной копии. Прогресс не изменен.");
      var data = DATA.state(parsed.kind === "de-b1-backup" ? parsed.state : parsed);
      var drafts = parsed.drafts && window.Practice ? window.Practice.validateImport(parsed.drafts) : null;
      var sessions = window.Sessions ? window.Sessions.validateImport(parsed.sessions || {}) : null;
      var result = mutate("restore", { state: data });
      if (window.Practice) { if (drafts) window.Practice.importDrafts(drafts); else window.Practice.clear(); }
      if (window.Sessions) window.Sessions.importSessions(sessions);
      try { if (!window.Sessions) localStorage.removeItem("de-b1-session-v1"); localStorage.removeItem("de-b1-day-v1"); } catch (e) {}
      return result;
    },
    mutate: mutate,
    onChange: function (fn) { listeners.push(fn); },
    onStatus: function (fn) { statusListeners.push(fn); fn(warning() || "только это устройство", warning() ? "bad" : ""); },
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
