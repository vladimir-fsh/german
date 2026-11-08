/* Жесты карточки и эффект принятого ответа. */
window.VocabGestures = (function () {
  "use strict";
  function bind(drag, flip, options) {
    var x0 = 0, y0 = 0, dx = 0, dy = 0, pointer = null, axis = "", locked = false, moved = false;
    var lastX = 0, lastT = 0, vx = 0, scrollBody = null, scrollStart = 0;
    var W = Math.max(46, Math.min(90, window.innerWidth * 0.18));
    var UP = Math.max(70, Math.min(120, window.innerHeight * 0.12));
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function reset() {
      drag.classList.remove("held");
      drag.style.transition = reduced ? "none" : "transform .28s cubic-bezier(.2,.8,.3,1)";
      drag.style.transform = "";
    }
    var finishGesture = function (kind, schedule) {
      var direction = kind === "bad" ? -1 : 1;
      window.VocabFrames.update(drag, schedule);
      drag.classList.remove("held");
      drag.classList.add("vcommit-" + kind);
      /* На время эффекта остаёмся в точке отпускания, без возврата к центру. */
      if (!reduced) setTimeout(function () {
        if (!options.active()) return;
        drag.style.transition = "transform .24s ease-in, opacity .24s ease-in";
        drag.style.transform = "translate(" + (kind === "known" ? 0 : direction * 170) + "px," + (kind === "known" ? -180 : -8) + "px) rotate(" + (kind === "known" ? 0 : direction * 8) + "deg) scale(.92)";
        drag.style.opacity = 0;
      }, 210);
    };

    drag.addEventListener("pointerdown", function (e) {
      if (options.busy() || pointer !== null || e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
      scrollBody = flip.classList && flip.classList.contains('flipped') ? flip.querySelector('.vback .vinner') : null;
      if (scrollBody && scrollBody.scrollHeight <= scrollBody.clientHeight + 1) scrollBody = null;
      scrollStart = scrollBody ? scrollBody.scrollTop : 0;
      pointer = e.pointerId;
      axis = ""; locked = false; moved = false; dx = 0; dy = 0; vx = 0;
      x0 = lastX = e.clientX; y0 = e.clientY; lastT = Date.now();
      try { drag.setPointerCapture(pointer); } catch (err) {}
      drag.style.transition = "none";
      drag.classList.add("held");
    });
    drag.addEventListener("pointermove", function (e) {
      if (pointer !== e.pointerId || options.busy()) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      if (!locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? "y" : "x";
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 40) locked = true;
      }
      moved = true;
      if (axis === 'y' && scrollBody && !(dy > 0 && scrollStart <= 1)) {
        scrollBody.scrollTop = scrollStart - dy;
        return;
      }
      var now = Date.now(), dt = now - lastT;
      if (dt > 0) vx = (e.clientX - lastX) / dt;
      lastX = e.clientX; lastT = now;
      var vertical = axis === "y", allowed = !vertical || (!options.calibration && dy < 0);
      var ox = vertical ? dx * .1 : Math.max(-120, Math.min(120, dx * .65));
      var oy = vertical ? (allowed ? Math.max(-110, dy * .65) : dy * .12) : dy * .12;
      drag.style.transform = reduced ? "" : "translate(" + ox + "px," + oy + "px) rotate(" + (vertical ? 0 : ox * .035) + "deg)";
    });
    function release(e) {
      if (pointer !== e.pointerId) return;
      pointer = null;
      if (options.busy() || !options.active()) return;
      drag.classList.remove("held");
      var cancelled = e.type !== "pointerup";
      if (moved && axis === 'y' && scrollBody && !(dy > 0 && scrollStart <= 1)) { reset(); return; }
      if (!cancelled && moved) {
        if (axis === "y" && dy >= UP) { reset(); options.undo(); return; }
        if (axis === "y" && !options.calibration && dy <= -UP) { options.known(); return; }
        var flick = Date.now() - lastT < 100 && Math.abs(vx) > .5 && Math.abs(dx) > 24 && (vx > 0) === (dx > 0);
        if (axis === "x" && (Math.abs(dx) >= W || flick)) { options.answer(dx > 0); return; }
      }
      reset();
      if (!cancelled && !moved) options.flip();
    }
    drag.addEventListener("pointerup", release);
    drag.addEventListener("pointercancel", release);
    drag.addEventListener("lostpointercapture", release);
    return finishGesture;
  }

  return { bind: bind };
})();
