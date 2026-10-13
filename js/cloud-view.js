window.mountCloud = function (host, back) {
  "use strict";
  var cloud = window.Cloud, disposed = false;
  function node(tag, text, cls) { var n = document.createElement(tag); n.textContent = text || ""; n.className = cls || ""; return n; }
  var card = node("section", "", "card ai-panel cloud-panel");
  card.appendChild(node("h2", "Облако и вход"));
  card.appendChild(node("p", "Войдите в один Google-аккаунт на всех устройствах. Ответы, слова и прикреплённые подсказки будут общими.", "muted"));
  card.appendChild(node("p", "Первое подключение выполните на телефоне с основным прогрессом. Если на устройствах уже разные исходные данные, приложение попросит сохранить копии и остановит автоматический перенос.", "note"));
  var account = node("p", "", "cloud-account"); card.appendChild(account);
  var status = node("p", "", "note"); status.setAttribute("role", "status"); card.appendChild(status);
  var actions = node("div", "", "btnrow cloud-actions");
  var login = node("button", "Войти через Google", "btn"); login.type = "button";
  var connect = node("button", "Подключить прогресс", "btn"); connect.type = "button";
  var retry = node("button", "Синхронизировать", "btn"); retry.type = "button";
  var logout = node("button", "Выйти из аккаунта", "btn sec"); logout.type = "button";
  [login, connect, retry, logout].forEach(function (b) { actions.appendChild(b); }); card.appendChild(actions);
  card.appendChild(node("p", "Без сети можно продолжать занятия. Ключ OpenAI хранится отдельно на каждом устройстве и в облако не отправляется.", "note"));
  var backups = node("section", "", "cloud-backups");
  var load = node("button", "Занятия с других устройств", "btn sec"); load.type = "button"; backups.appendChild(load);
  var list = node("div"); backups.appendChild(list); card.appendChild(backups);
  var advanced = node("details", "", "cloud-config"); advanced.appendChild(node("summary", "Подключение Firebase"));
  var form = node("form"), label = node("label", "Параметры веб-приложения (JSON)"); label.htmlFor = "firebase-config"; form.appendChild(label);
  var config = node("textarea", "", "ai-input"); config.id = "firebase-config"; config.rows = 5; config.spellcheck = false;
  config.setAttribute("autocapitalize", "none"); config.placeholder = '{"apiKey":"AIza…","projectId":"…","authDomain":"….firebaseapp.com","appId":"1:…:web:…"}';
  try { var value = cloud.config(); if (value) config.value = JSON.stringify(value, null, 2); else advanced.open = true; } catch (e) { status.textContent = e.message; advanced.open = true; }
  form.appendChild(config); var save = node("button", "Сохранить подключение", "btn sec"); save.type = "submit"; form.appendChild(save); advanced.appendChild(form); card.appendChild(advanced);
  var backButton = node("button", "К настройкам", "btn sec cloud-back"); backButton.type = "button"; backButton.onclick = back; card.appendChild(backButton);
  function render(state) {
    account.textContent = state.user ? state.user.email || "Вы вошли в Google" : "Вход ещё не выполнен";
    status.textContent = state.message;
    login.hidden = !!state.user; login.disabled = !state.configured;
    connect.hidden = !state.user || state.connected;
    retry.hidden = !state.connected; retry.disabled = state.busy;
    logout.hidden = !state.user;
    load.disabled = !state.user || !state.connected;
  }
  function call(button, action) {
    button.disabled = true;
    var promise;
    try { promise = action(); } catch (e) { status.textContent = e.message; button.disabled = false; return; }
    Promise.resolve(promise).then(function () { if (!disposed) { button.disabled = false; render(cloud.status()); } }, function (e) { if (!disposed) { button.disabled = false; render(cloud.status()); status.textContent = e.message; } });
  }
  login.onclick = function () { call(login, cloud.signIn); };
  connect.onclick = function () { call(connect, cloud.connect); };
  retry.onclick = function () { call(retry, cloud.sync); };
  logout.onclick = function () { call(logout, cloud.signOut); };
  form.onsubmit = function (e) { e.preventDefault(); call(save, function () { return cloud.saveConfig(config.value); }); };
  load.onclick = function () {
    call(load, function () {
      return cloud.deviceBackups().then(function (items) {
        if (disposed) return; list.textContent = "";
        if (!items.length) { list.appendChild(node("p", "Других сохранённых занятий пока нет.", "note")); return; }
        items.forEach(function (item) {
          var box = node("div", "", "cloud-backup"), data = item.data;
          box.appendChild(node("p", (item.at ? new Date(item.at).toLocaleString("ru-RU") : "Без даты") + " · черновиков: " + Object.keys(data.drafts).length + " · сессий: " + Object.keys(data.sessions).filter(function (key) { return !!data.sessions[key]; }).length, "note"));
          var button = node("button", "Загрузить это занятие", "btn sec"); button.type = "button";
          button.onclick = function () {
            if (!window.confirm("Загрузить черновики и незавершённые сессии? Они заменят местные черновики. Завершённый прогресс сохранится. При необходимости сначала экспортируйте местную резервную копию в разделе «Ещё».")) return;
            try { cloud.restoreWork(data); status.textContent = "Занятие загружено. Можно продолжить в курсе или карточках."; }
            catch (e) { status.textContent = e.message; }
          }; box.appendChild(button); list.appendChild(box);
        });
      });
    });
  };
  host.appendChild(card);
  var unsubscribe = cloud.onChange(render), detach = window.SwipeBack.mount(card, back);
  if (cloud.status().configured) {
    login.disabled = true;
    cloud.init().then(function () { if (!disposed) render(cloud.status()); }, function (e) { if (!disposed) status.textContent = e.message; });
  }
  return function () { disposed = true; unsubscribe(); detach(); };
};
