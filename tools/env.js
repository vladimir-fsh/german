var fs = require("fs");
var path = require("path");
var vm = require("vm");
var ROOT = path.join(__dirname, "..");

function makeStorage(seed) {
  var mem = Object.create(null);
  if (seed) for (var k in seed) mem[k] = seed[k];
  return {
    get length() { return Object.keys(mem).length; },
    key: function (i) { return Object.keys(mem)[i] || null; },
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; },
    clear: function () { for (var k in mem) delete mem[k]; },
    _dump: function () { return mem; }
  };
}

function load(files, opts) {
  opts = opts || {};
  var win = {};
  win.window = win;
  win.localStorage = opts.localStorage || makeStorage(opts.storage);
  var handlers = {};
  function on(type, fn) { (handlers[type] = handlers[type] || []).push(fn); }
  win.document = {
    hidden: false,
    addEventListener: on,
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    createElement: function () { return { style: {}, dataset: {}, classList: { add: function () {}, remove: function () {} } }; }
  };
  win.addEventListener = on;
  win._fire = function (type, details) { (handlers[type] || []).forEach(function (fn) { fn(Object.assign({ type: type }, details)); }); };
  win._handlers = handlers;
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;
  win.Date = opts.clock ? new Proxy(Date, {
    get: function (t, p) { return p === "now" ? function () { return Date.now() + (opts.clock.skew || 0); } : t[p]; }
  }) : Date;
  win.Math = Math;
  win.JSON = JSON;
  win.console = console;
  var ctx = vm.createContext(win);
  files.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  });
  return win;
}

function settle(ms) {
  return new Promise(function (res) { setTimeout(res, ms || 5); });
}

module.exports = { load: load, makeStorage: makeStorage, settle: settle, ROOT: ROOT };
