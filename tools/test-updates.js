const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function client(current = 'v4.1') {
  const events = {}, badge = { hidden: true }, requests = [], navigations = [];
  function node() { return { children: [], appendChild(n) { this.children.push(n); }, setAttribute() {} }; }
  const context = {
    URL, Promise, Date, AbortController, clearTimeout,
    setTimeout: (fn) => setTimeout(fn, 40),
    document: {
      hidden: false,
      querySelector: () => ({ content: current }),
      getElementById: () => badge,
      createElement: node,
      addEventListener: (type, fn) => { events[type] = fn; }
    },
    location: { href: 'https://example.com/german/?keep=yes#/more', replace: url => navigations.push(url) },
    addEventListener: (type, fn) => { events[type] = fn; },
    Store: { storageError: () => '' },
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ version: 'v5.1' }) }; }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('js/updates.js', 'utf8'), context);
  const host = node();
  context.AppUpdates.mount(host);
  return { context, api: context.AppUpdates, badge, requests, navigations, panel: host.children[0], events };
}

test('проверка без кэша показывает новую версию, но сама не перезагружает', async () => {
  const c = client();
  await c.api.check();
  assert.equal(c.requests.length, 1);
  const request = c.requests[0];
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(new URL(request.url).pathname, '/german/version.json');
  assert.ok(new URL(request.url).searchParams.has('check'));
  assert.equal(c.badge.hidden, false);
  assert.match(c.panel.children[1].textContent, /v5.1/);
  assert.equal(c.navigations.length, 0);
});

test('обновление сохраняет origin, путь, маршрут и другие параметры', async () => {
  const c = client(); await c.api.check();
  assert.equal(c.api.reload(), true);
  const url = new URL(c.navigations[0]);
  assert.equal(url.origin, 'https://example.com');
  assert.equal(url.pathname, '/german/');
  assert.equal(url.hash, '#/more');
  assert.equal(url.searchParams.get('keep'), 'yes');
  assert.match(url.searchParams.get('update'), /^v5\.1-/);
});

test('ошибка сохранения блокирует перезагрузку', async () => {
  const c = client(); await c.api.check();
  c.context.Store.storageError = () => 'quota';
  assert.equal(c.api.reload(), false);
  assert.equal(c.navigations.length, 0);
  assert.match(c.panel.children[1].textContent, /резервную копию/);
});

test('ошибки сети, плохая версия и таймаут не объявляются успешной проверкой', async () => {
  for (const reply of [() => Promise.reject(Error('offline')), async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => ({ version: 'bad' }) }), () => new Promise(() => {})]) {
    const c = client(); await c.api.check(); c.context.fetch = reply;
    await c.api.check();
    assert.match(c.panel.children[1].textContent, /Не удалось/);
    assert.equal(c.panel.children[2].children[0].disabled, false);
    assert.equal(c.navigations.length, 0);
  }
});

test('сравнение числовое, учитывает повторную сборку и не предлагает откат', async () => {
  for (const [current, remote, update] of [['v9.1', 'v10.1', true], ['v5.1', 'v5.2', true], ['v6.1', 'v5.1', false], ['v5.1', 'v5.1', false]]) {
    const c = client(current);
    c.context.fetch = async () => ({ ok: true, json: async () => ({ version: remote }) });
    await c.api.check();
    assert.equal(c.badge.hidden, !update);
  }
});

test('локальный запуск не обращается к серверу; возвращение не дублирует частые проверки', async () => {
  const local = client('local'); await local.api.check(); assert.equal(local.requests.length, 0);
  const c = client(); await c.api.check(); c.api.start();
  c.events.pageshow(); c.events.visibilitychange();
  assert.equal(c.requests.length, 1);
});
