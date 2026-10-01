/* Окружение для тестов: минимальный браузер поверх node.
   Файлы js/ грузятся как обычные скрипты, поэтому им нужны window,
   localStorage и document — здесь они поддельные, но с тем же поведением. */
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var ROOT = path.join(__dirname, "..");

function makeStorage(seed) {
  var mem = Object.create(null);
  if (seed) for (var k in seed) mem[k] = seed[k];
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; },
    clear: function () { for (var k in mem) delete mem[k]; },
    _dump: function () { return mem; }
  };
}

/* Поддельная база артефакта: документы в памяти + подписки,
   как у claude.use("db") — onSnapshot на документ и на коллекцию. */
function makeDb() {
  var docs = Object.create(null);
  var docSubs = Object.create(null);
  var colSubs = Object.create(null);

  function notifyDoc(id) {
    (docSubs[id] || []).forEach(function (fn) {
      fn({ exists: docs[id] !== undefined, data: function () { return docs[id]; } });
    });
  }
  function notifyCol(col) {
    (colSubs[col] || []).forEach(function (fn) {
      var list = [];
      for (var id in docs) {
        if (id.indexOf(col + "/") === 0) list.push({ id: id, data: (function (d) { return function () { return d; }; })(docs[id]) });
      }
      fn({ docs: list });
    });
  }

  var db = {
    doc: function (id) {
      return {
        set: function (data) { docs[id] = data; notifyDoc(id); notifyCol(id.split("/")[0]); return Promise.resolve(); },
        get: function () { return Promise.resolve({ exists: docs[id] !== undefined, data: function () { return docs[id]; } }); },
        onSnapshot: function (fn) { (docSubs[id] = docSubs[id] || []).push(fn); notifyDoc(id); },
        acquire: function () { return Promise.resolve({ acquired: true }); }
      };
    },
    collection: function (col) {
      return { onSnapshot: function (fn) { (colSubs[col] = colSubs[col] || []).push(fn); notifyCol(col); } };
    },
    _docs: docs,
    _seed: function (id, data) { docs[id] = data; },
    _emitDoc: notifyDoc,
    _emitCol: notifyCol
  };
  return db;
}

/* Загружает скрипты проекта в общий контекст и возвращает его window. */
function load(files, opts) {
  opts = opts || {};
  var win = {};
  win.window = win;
  win.localStorage = opts.localStorage || makeStorage(opts.storage);
  /* обработчики событий запоминаем, чтобы тест мог их дёрнуть: win._fire("visibilitychange") */
  var handlers = {};
  function on(type, fn) { (handlers[type] = handlers[type] || []).push(fn); }
  win.document = {
    hidden: false,
    addEventListener: on,
    getElementById: function () { return null; },
    createElement: function () { return { style: {}, dataset: {}, classList: { add: function () {}, remove: function () {} } }; }
  };
  win.addEventListener = on;
  win._fire = function (type) { (handlers[type] || []).forEach(function (fn) { fn({ type: type }); }); };
  win._handlers = handlers;
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;
  /* часы можно сдвинуть вперёд, не дожидаясь реального времени:
     opts.clock = { skew: 0 }, дальше skew меняется прямо в тесте */
  win.Date = opts.clock ? new Proxy(Date, {
    get: function (t, p) { return p === "now" ? function () { return Date.now() + (opts.clock.skew || 0); } : t[p]; }
  }) : Date;
  win.Math = Math;
  win.JSON = JSON;
  win.console = console;
  if (opts.db) {
    var db = opts.db;
    win.claude = { use: function (what) { return Promise.resolve(what === "db" ? db : null); } };
  }
  var ctx = vm.createContext(win);
  files.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  });
  return win;
}

/* Ждёт, пока разберётся очередь промисов и таймеров. */
function settle(ms) {
  return new Promise(function (res) { setTimeout(res, ms || 5); });
}

module.exports = { load: load, makeDb: makeDb, makeStorage: makeStorage, settle: settle, ROOT: ROOT };
