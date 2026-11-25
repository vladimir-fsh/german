const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");

const valid = (p) => /^\/(review|vocab(\/repeat)?|l\d+(\/d\d+)?)?$/.test(p);

function page(storage) {
  return env.load(["js/last-route.js"], { localStorage: storage }).LastRoute;
}

test("новый запуск без маршрута открывает последний экран", () => {
  const storage = env.makeStorage();
  page(storage).remember("/review");
  assert.equal(page(storage).initial("/", valid), "/review");
});

test("явный маршрут в адресе важнее сохранённого", () => {
  const storage = env.makeStorage();
  page(storage).remember("/review");
  assert.equal(page(storage).initial("/l20/d1", valid), "/l20/d1");
});

test("главная, неизвестный и отсутствующий маршрут оставляют главную", () => {
  const storage = env.makeStorage();
  assert.equal(page(storage).initial("/", valid), "/");
  page(storage).remember("/");
  assert.equal(page(storage).initial("/", valid), "/");
  storage.setItem("de-b1-route-v1", "/gone");
  assert.equal(page(storage).initial("/", valid), "/");
});

test("недоступное хранилище не ломает запуск", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const route = page(broken);
  route.remember("/review");
  assert.equal(route.initial("/", valid), "/");
});
