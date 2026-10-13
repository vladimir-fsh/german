/* Тема применяется до CSS и первого экрана, включая фон окна браузера. */
window.Theme = (function () {
  "use strict";
  var root = document.documentElement, meta = document.querySelector('meta[name="theme-color"]');
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var preference = null;
  function valid(value) { return value === "dark" || value === "light" ? value : null; }
  try { preference = valid(localStorage.getItem("de-theme")); } catch (e) {}
  function current() { return preference || (media.matches ? "dark" : "light"); }
  function paint() {
    var theme = current(), background = theme === "dark" ? "#131314" : "#f0f4f9";
    if (preference) root.setAttribute("data-theme", preference);
    else root.removeAttribute("data-theme");
    root.style.backgroundColor = background;
    root.style.colorScheme = theme;
    if (meta) meta.content = background;
  }
  function set(value) {
    preference = valid(value); paint();
    try { if (preference) localStorage.setItem("de-theme", preference); else localStorage.removeItem("de-theme"); } catch (e) {}
  }
  paint();
  if (media.addEventListener) media.addEventListener("change", paint);
  else if (media.addListener) media.addListener(paint);
  window.addEventListener("storage", function (event) {
    if (event.key !== "de-theme" && event.key !== null) return;
    try { preference = valid(localStorage.getItem("de-theme")); paint(); } catch (e) {}
  });
  return { current: current, set: set };
})();
