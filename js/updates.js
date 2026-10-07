/* Проверка версии не меняет прогресс и не перезагружает тренировку. */
window.AppUpdates = (function () {
  "use strict";
  var meta = document.querySelector('meta[name="app-version"]');
  var current = meta ? meta.content : "local", latest = current;
  var status = "", pending = null, lastCheck = 0, listener = null, started = false;
  function newer(a, b) {
    var x = /^v(\d+)\.(\d+)$/.exec(a), y = /^v(\d+)\.(\d+)$/.exec(b);
    return !!(x && y && (+x[1] > +y[1] || (+x[1] === +y[1] && +x[2] > +y[2])));
  }
  function notify() {
    var badge = document.getElementById("update-badge");
    if (badge) badge.hidden = !newer(latest, current);
    if (listener) listener();
  }
  function check() {
    if (pending) return pending;
    if (current === "local") { status = "Проверка доступна в опубликованной версии."; notify(); return Promise.resolve(); }
    lastCheck = Date.now(); status = "Проверяю обновления…";
    var controller = window.AbortController ? new window.AbortController() : null;
    var url = new URL("version.json", window.location.href);
    url.searchParams.set("check", String(lastCheck));
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = setTimeout(function () { if (controller) controller.abort(); reject(new Error("timeout")); }, 10000);
    });
    var request = Promise.resolve().then(function () {
      return window.fetch(url.href, { cache: "no-store", credentials: "omit", signal: controller ? controller.signal : undefined });
    }).then(function (response) {
      if (!response.ok) throw new Error("HTTP");
      return response.json();
    });
    pending = Promise.race([request, timeout]).then(function (data) {
      if (!data || !/^v[1-9]\d*\.[1-9]\d*$/.test(data.version)) throw new Error("version");
      if (newer(data.version, latest)) latest = data.version;
      status = newer(latest, current) ? "Доступна версия " + latest + "."
        : newer(current, data.version) ? "Сервер ещё обновляется. Проверьте позже." : "У вас актуальная версия.";
    }).catch(function () {
      status = "Не удалось проверить обновления. Проверьте интернет и попробуйте ещё раз.";
    }).then(function () { clearTimeout(timer); pending = null; notify(); });
    notify(); return pending;
  }
  function reload() {
    if (window.Store && window.Store.storageError()) {
      status = "Есть несохранённые или повреждённые данные. Сначала экспортируйте резервную копию ниже.";
      notify(); return false;
    }
    var url = new URL(window.location.href);
    url.searchParams.set("update", latest + "-" + Date.now());
    window.location.replace(url.href);
    return true;
  }
  function mount(host) {
    function node(tag, text, cls) {
      var element = document.createElement(tag);
      element.textContent = text; if (cls) element.className = cls; return element;
    }
    var panel = node("div", "", "app-updates");
    panel.appendChild(node("div", current === "local" ? "Локальная версия" : "Версия " + current, "muted"));
    var message = node("div", "", "note"); message.setAttribute("role", "status");
    panel.appendChild(message);
    var buttons = node("div", "", "btnrow");
    var checkButton = node("button", "Проверить обновления", "btn sec");
    var reloadButton = node("button", "Перезагрузить приложение", "btn");
    buttons.appendChild(checkButton); buttons.appendChild(reloadButton); panel.appendChild(buttons); host.appendChild(panel);
    function render() {
      message.textContent = status; message.hidden = !status;
      checkButton.disabled = !!pending || current === "local";
      reloadButton.textContent = newer(latest, current) ? "Обновить до " + latest : "Перезагрузить приложение";
    }
    checkButton.onclick = check; reloadButton.onclick = reload;
    listener = render; render();
    if (!lastCheck || Date.now() - lastCheck > 60000) check();
    return function () { if (listener === render) listener = null; };
  }
  function start() {
    if (started) return; started = true;
    function resume() { if (!document.hidden && (!lastCheck || Date.now() - lastCheck > 60000)) check(); }
    window.addEventListener("pageshow", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    resume();
  }
  return { check: check, reload: reload, mount: mount, start: start };
})();
