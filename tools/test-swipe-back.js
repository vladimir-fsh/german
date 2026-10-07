const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");

function harness(top = 0, height = 1600) {
  const win = env.load(["js/swipe-back.js"]), handlers = {};
  let exits = 0, prevented = 0;
  win.innerHeight = 800; win.document.scrollingElement = { scrollTop: top, scrollHeight: height };
  win.document.activeElement = { matches: () => false };
  const host = { style: {}, classList: { add() {}, remove() {} },
    addEventListener(name, fn) { handlers[name] = fn; }, removeEventListener(name) { delete handlers[name]; } };
  const dispose = win.SwipeBack.mount(host, () => exits++);
  const event = (x, y, interactive = false) => ({ touches: [{ clientX: x, clientY: y }],
    target: { closest: () => interactive }, cancelable: true, preventDefault() { prevented++; } });
  return { win, host, handlers, dispose, event, get exits() { return exits; }, get prevented() { return prevented; } };
}

test("свайп наружу закрывает страницу только у соответствующего края", () => {
  for (const [top, dy, expected] of [[0, 120, 1], [800, -120, 1], [0, -120, 0], [800, 120, 0], [300, 120, 0]]) {
    const h = harness(top); h.handlers.touchstart(h.event(150, 300));
    h.handlers.touchmove(h.event(150, 300 + dy)); h.handlers.touchend();
    assert.equal(h.exits, expected); assert.equal(h.prevented, expected);
    assert.equal(h.host.style.transform, "");
  }
});

test("короткий, горизонтальный, отменённый и начатый внутри поля жест не закрывают страницу", () => {
  for (const [dx, dy, field] of [[0, 50, false], [200, 110, false], [0, 140, true]]) {
    const h = harness(); h.handlers.touchstart(h.event(150, 300, field));
    h.handlers.touchmove(h.event(150 + dx, 300 + dy)); h.handlers.touchend(); assert.equal(h.exits, 0);
  }
  const h = harness(); h.handlers.touchstart(h.event(150, 300));
  h.handlers.touchmove(h.event(150, 440)); h.handlers.touchcancel(); h.handlers.touchend(); assert.equal(h.exits, 0);
  h.dispose(); assert.equal(Object.keys(h.handlers).length, 0);
});

test("при фокусе ввода и при смене направления жест не закрывает страницу", () => {
  const h = harness(); h.win.document.activeElement.matches = () => true;
  h.handlers.touchstart(h.event(150, 300)); h.handlers.touchmove(h.event(150, 440)); h.handlers.touchend();
  assert.equal(h.exits, 0);
  h.win.document.activeElement.matches = () => false;
  h.handlers.touchstart(h.event(150, 300)); h.handlers.touchmove(h.event(150, 440));
  h.handlers.touchmove(h.event(150, 280)); h.handlers.touchend(); assert.equal(h.exits, 0);
});
