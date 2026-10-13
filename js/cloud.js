/* Firebase переносит журнал, локальное состояние остаётся источником для UI. */
window.Cloud = (function () {
  "use strict";
  var CONFIG = "de-firebase-config-v1", LINK = "de-firebase-link-v1";
  var client = null, auth = null, db = null, user = null, initialized = null;
  var subscribed = null, running = false, writing = false, merging = false, timer = null, epoch = 0, connection = null;
  var known = Object.create(null), lastAux = "", listeners = [], message = "Облако не подключено.", started = false;
  function emit(text) { message = text; listeners.slice().forEach(function (fn) { fn(status()); }); }
  function status() { var configured = false; try { configured = !!config(); } catch (e) {} return { user: user, connected: running, busy: writing || !!connection, message: message, configured: configured }; }
  function parse(raw) { return raw ? JSON.parse(raw) : null; }
  function config() {
    var value = parse(localStorage.getItem(CONFIG)) || window.FIREBASE_CONFIG;
    if (!value) return null;
    if (typeof value.apiKey !== "string" || !/^AIza[\w-]+$/.test(value.apiKey) ||
      typeof value.projectId !== "string" || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(value.projectId) ||
      value.authDomain !== value.projectId + ".firebaseapp.com" || typeof value.appId !== "string" || !/^1:\d+:web:[\w]+$/.test(value.appId)) {
      throw new Error("Нужны apiKey, projectId, authDomain и appId из веб-настроек Firebase.");
    }
    return { apiKey: value.apiKey, projectId: value.projectId, authDomain: value.authDomain, appId: value.appId };
  }
  function saveConfig(text) {
    if (initialized) throw new Error("Для смены проекта сначала выйдите из аккаунта и перезагрузите страницу.");
    var value;
    try { value = JSON.parse(text); } catch (e) { throw new Error("Вставьте параметры Firebase в формате JSON."); }
    if (!value || typeof value !== "object" || Array.isArray(value) || value.private_key || value.client_email || value.type === "service_account") {
      throw new Error("Нужны публичные параметры веб-приложения, а не сервисный ключ.");
    }
    var old = localStorage.getItem(CONFIG);
    localStorage.setItem(CONFIG, JSON.stringify(value));
    try { config(); } catch (e) { if (old) localStorage.setItem(CONFIG, old); else localStorage.removeItem(CONFIG); throw e; }
    return init();
  }
  function friendly(e) {
    var code = e && e.code || "";
    if (/permission-denied/.test(code)) return "Нет доступа к облаку. Проверьте правила Firestore и аккаунт.";
    if (/unauthorized-domain/.test(code)) return "Этот адрес не разрешён для входа. Откройте опубликованное приложение или добавьте домен в Firebase.";
    if (/popup-blocked/.test(code)) return "Браузер заблокировал окно Google. Разрешите всплывающее окно и нажмите вход ещё раз.";
    if (/popup-closed|cancelled-popup/.test(code)) return "Вход отменён.";
    if (/network|unavailable/.test(code)) return "Нет связи с Firebase. Прогресс остаётся на устройстве; повторите синхронизацию после подключения.";
    if (/resource-exhausted/.test(code)) return "Достигнут лимит Firebase. Прогресс сохранён локально.";
    return e && e.message || "Не удалось подключить Firebase.";
  }
  function stop() {
    epoch++; running = false; writing = false; connection = null; known = Object.create(null); lastAux = "";
    if (subscribed) { subscribed(); subscribed = null; }
    if (timer) clearTimeout(timer); timer = null;
  }
  function init() {
    if (initialized) return initialized;
    var cfg;
    try { cfg = config(); if (!cfg) return Promise.reject(new Error("Сначала добавьте параметры Firebase.")); }
    catch (e) { return Promise.reject(e); }
    initialized = new Promise(function (resolve, reject) {
      try {
        client = window.firebase.initializeApp(cfg, "german"); auth = client.auth(); db = client.firestore();
        var first = true;
        auth.onAuthStateChanged(function (next) {
          stop(); user = next; emit(next ? "Подключаю прогресс…" : "Войдите через Google.");
          if (first) { first = false; resolve(); }
          try {
            var link = parse(localStorage.getItem(LINK));
            if (next) connect(!(link && link.uid === next.uid && link.projectId === cfg.projectId)).catch(function (e) { emit(friendly(e)); });
          } catch (e) { emit(friendly(e)); }
        }, reject);
      } catch (e) { initialized = null; reject(e); }
    });
    return initialized;
  }
  function signIn() {
    if (!auth) return Promise.reject(new Error("Подождите загрузки Firebase."));
    var provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return auth.signInWithPopup(provider).then(function () { if (user) return connect(true); }).catch(function (e) { emit(friendly(e)); throw new Error(friendly(e)); });
  }
  function signOut() {
    stop(); localStorage.removeItem(LINK);
    return auth ? auth.signOut() : Promise.resolve();
  }
  function collection(name) { return db.collection("users").doc(user.uid).collection(name); }
  function payload(value) {
    var json = JSON.stringify(value);
    if (unescape(encodeURIComponent(json)).length > 800000) throw new Error("Данные слишком велики для одной записи Firebase. Экспортируйте резервную копию; прогресс остаётся локальным.");
    return json;
  }
  function aux() {
    return { drafts: window.Practice.exportDrafts(), sessions: window.Sessions.exportSessions() };
  }
  function schedule() {
    if (!running || merging) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; sync().catch(function () {}); }, 1000);
  }
  function upload(generation) {
    if (generation !== epoch || !running) return Promise.resolve();
    var ops = window.Store.cloudOperations().filter(function (op) { return !known[op.device + ":" + op.seq]; });
    var batches = [];
    for (var i = 0; i < ops.length; i += 100) batches.push(ops.slice(i, i + 100));
    var chain = Promise.resolve();
    batches.forEach(function (group) {
      chain = chain.then(function () {
        if (generation !== epoch || !running) return;
        var batch = db.batch();
        group.forEach(function (op) { batch.set(collection("germanOperations").doc(encodeURIComponent(op.device) + ":" + op.seq), { payload: payload(op) }); });
        return batch.commit().then(function () { if (generation === epoch) group.forEach(function (op) { known[op.device + ":" + op.seq] = payload(op); }); });
      });
    });
    return chain.then(function () {
      if (generation !== epoch || !running) return;
      var current = payload(aux());
      if (current === lastAux) return;
      return collection("germanDevices").doc(window.Store.device).set({ payload: current, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }).then(function () { if (generation === epoch) lastAux = current; });
    });
  }
  function sync() {
    if (!running || writing) return Promise.resolve();
    var generation = epoch; writing = true; emit("Синхронизирую…");
    return Promise.resolve().then(function () { return upload(generation); }).then(function () {
      if (generation !== epoch) return;
      writing = false; emit("Прогресс и подсказки синхронизированы.");
      /* Ответ во время запроса не должен остаться без отправки. */
      if (window.Store.cloudOperations().some(function (op) { return !known[op.device + ":" + op.seq]; }) || payload(aux()) !== lastAux) schedule();
    }, function (e) {
      if (generation === epoch) { writing = false; emit(friendly(e)); }
      throw new Error(friendly(e));
    });
  }
  function mergeSnapshot(snapshot) {
    var ops = [], additions = [];
    snapshot.docChanges().forEach(function (change) {
      if (change.type === "removed" || (change.doc.metadata && change.doc.metadata.hasPendingWrites)) return;
      var op = parse(change.doc.data().payload), key = op.device + ":" + op.seq;
      window.ProgressData.operation(op);
      if (known[key] && known[key] !== payload(op)) throw new Error("Один облачный ответ содержит разные данные. Синхронизация остановлена.");
      if (!known[key]) { additions.push({ key: key, json: payload(op) }); ops.push(op); }
    });
    if (ops.length) {
      merging = true;
      try { window.Store.mergeCloud(ops); } finally { merging = false; }
      additions.forEach(function (entry) { known[entry.key] = entry.json; });
    }
  }
  function connect(create) {
    if (connection) return connection;
    var job = connectNow(create);
    connection = job;
    emit(message);
    return job.then(function (result) {
      if (connection === job) { connection = null; emit(message); }
      return result;
    }, function (e) {
      if (connection === job) { connection = null; emit(friendly(e)); }
      throw e;
    });
  }
  function connectNow(create) {
    if (!user) return Promise.reject(new Error("Сначала войдите через Google."));
    if (running) return sync();
    var cfg = config(), uid = user.uid, generation = epoch, identity = window.Store.cloudIdentity();
    if (identity && identity.indexOf(cfg.projectId + ":" + uid + ":") !== 0) {
      return Promise.reject(new Error("Это устройство связано с другим облачным аккаунтом. Его данные не отправлены. Сначала экспортируйте местную копию."));
    }
    var seedRef = collection("german").doc("seed");
    emit("Подключаю прогресс…");
    return db.runTransaction(function (tx) {
      return tx.get(seedRef).then(function (doc) {
        if (doc.exists) return parse(doc.data().payload);
        if (!create) throw new Error("Облачный прогресс не найден. Подключите устройство с основным прогрессом.");
        var seed = window.Store.cloudSeed(cfg.projectId + ":" + uid + ":" + Date.now().toString(36));
        tx.set(seedRef, { payload: payload(seed) }); return seed;
      });
    }).then(function (seed) {
      if (generation !== epoch || !user || user.uid !== uid) return;
      merging = true;
      try { window.Store.attachCloud(seed); } finally { merging = false; }
      localStorage.setItem(LINK, JSON.stringify({ projectId: cfg.projectId, uid: uid }));
      return collection("germanOperations").get({ source: "server" }).then(function (snapshot) {
        if (generation !== epoch || !user || user.uid !== uid) return;
        mergeSnapshot(snapshot);
        running = true;
        subscribed = collection("germanOperations").onSnapshot(function (next) {
          if (generation !== epoch) return;
          try { mergeSnapshot(next); schedule(); }
          catch (e) { stop(); emit(friendly(e)); }
        }, function (e) { stop(); emit(friendly(e)); });
        return sync();
      });
    }).catch(function (e) { emit(friendly(e)); throw new Error(friendly(e)); });
  }
  function deviceBackups() {
    if (!user) return Promise.reject(new Error("Сначала войдите."));
    return collection("germanDevices").get().then(function (snapshot) {
      var result = [];
      snapshot.forEach(function (doc) {
        if (doc.id === window.Store.device) return;
        var data = doc.data(), value = parse(data.payload);
        value.drafts = window.Practice.validateImport(value.drafts);
        value.sessions = window.Sessions.validateImport(value.sessions);
        result.push({ id: doc.id, at: data.updatedAt ? data.updatedAt.toMillis() : 0, data: value });
      });
      return result.sort(function (a, b) { return b.at - a.at; }).slice(0, 5);
    });
  }
  function restoreWork(value) {
    var drafts = window.Practice.validateImport(value.drafts), sessions = window.Sessions.validateImport(value.sessions);
    window.Practice.importDrafts(drafts); window.Sessions.importSessions(sessions); schedule();
  }
  function start() {
    if (started) return; started = true;
    window.Store.onChange(schedule);
    window.addEventListener("cloud-work-change", schedule);
    function resume() {
      if (running) { schedule(); return; }
      try {
        var link = parse(localStorage.getItem(LINK));
        if (user) connect(!(link && link.uid === user.uid && link.projectId === config().projectId)).catch(function (e) { emit(friendly(e)); });
      } catch (e) { emit(friendly(e)); }
    }
    window.addEventListener("online", resume);
    window.addEventListener("offline", function () { if (running) emit("Нет сети. Ответы сохраняются на устройстве и отправятся при подключении."); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) resume(); });
    try { if (config()) init().catch(function (e) { emit(friendly(e)); }); } catch (e) { emit(friendly(e)); }
  }
  return { init: init, start: start, config: config, saveConfig: saveConfig, signIn: signIn, signOut: signOut,
    connect: function () { return connect(true); }, sync: sync, status: status, deviceBackups: deviceBackups, restoreWork: restoreWork,
    onChange: function (fn) { listeners.push(fn); fn(status()); return function () { listeners = listeners.filter(function (other) { return other !== fn; }); }; }
  };
})();
