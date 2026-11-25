/* Последний открытый экран: переживает перезапуск приложения и закрытие вкладки. */
window.LastRoute = (function () {
  "use strict";
  var KEY = "de-b1-route-v1";
  function remember(path) {
    try { localStorage.setItem(KEY, path); } catch (e) {}
  }
  /* Адрес без маршрута (запуск с иконки, новая вкладка) открывает последний экран.
     Явный маршрут в адресе важнее сохранённого. */
  function initial(path, valid) {
    if (path !== "/") return path;
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    return saved && valid(saved) ? saved : path;
  }
  return { remember: remember, initial: initial };
})();
