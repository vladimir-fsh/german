window.LastRoute = (function () {
  "use strict";
  var KEY = "de-b1-route-v1";
  function remember(path) {
    try { localStorage.setItem(KEY, path); } catch (e) {}
  }
  function initial(path, valid) {
    if (path !== "/") return path;
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    return saved && valid(saved) ? saved : path;
  }
  return { remember: remember, initial: initial };
})();
