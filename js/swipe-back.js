/* Закрытие вложенной страницы жестом наружу от края прокрутки. */
window.SwipeBack = (function () {
  "use strict";
  function mount(host, back) {
    var start = null, distance = 0, dragging = false;
    var interactive = "input, textarea, select, button, a, summary, [contenteditable]";
    function reset() {
      start = null; distance = 0; dragging = false;
      host.style.transform = ""; host.style.opacity = "";
      host.classList.remove("swiping-back");
    }
    function begin(event) {
      reset();
      if (event.touches.length !== 1 || event.target.closest(interactive)) return;
      if (document.activeElement && document.activeElement.matches("input, textarea, select, [contenteditable]")) return;
      var scroller = document.scrollingElement || document.documentElement;
      var top = scroller.scrollTop, end = scroller.scrollHeight - window.innerHeight - top;
      if (top > 2 && end > 2) return;
      var touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, top: top <= 2, bottom: end <= 2 };
    }
    function move(event) {
      if (!start) return;
      if (event.touches.length !== 1) { reset(); return; }
      var touch = event.touches[0], dx = touch.clientX - start.x, dy = touch.clientY - start.y;
      var outward = (dy > 0 && start.top) || (dy < 0 && start.bottom);
      if (!outward || Math.abs(dy) < 14 || Math.abs(dy) < Math.abs(dx) * 1.5) {
        distance = 0; host.style.transform = ""; host.style.opacity = ""; return;
      }
      if (event.cancelable) event.preventDefault();
      distance = dy; dragging = true; host.classList.add("swiping-back");
      host.style.transform = "translateY(" + Math.max(-80, Math.min(80, dy * 0.5)) + "px)";
      host.style.opacity = String(Math.max(0.65, 1 - Math.abs(dy) / 600));
    }
    function end() { var close = dragging && Math.abs(distance) >= 100; reset(); if (close) back(); }
    host.addEventListener("touchstart", begin, { passive: true });
    host.addEventListener("touchmove", move, { passive: false });
    host.addEventListener("touchend", end);
    host.addEventListener("touchcancel", reset);
    return function () {
      reset();
      host.removeEventListener("touchstart", begin);
      host.removeEventListener("touchmove", move);
      host.removeEventListener("touchend", end);
      host.removeEventListener("touchcancel", reset);
    };
  }
  return { mount: mount };
})();
