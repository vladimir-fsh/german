/* Только настройки личного подключения OpenAI. */
window.mountGermanAI = function (host, backToSettings) {
  "use strict";
  var AI = window.GermanAI;
  function node(tag, text, cls) {
    var element = document.createElement(tag);
    if (text) element.textContent = text;
    if (cls) element.className = cls;
    return element;
  }
  function field(parent, title, id, tag) {
    var label = node("label", title); label.htmlFor = id; parent.appendChild(label);
    var input = node(tag || "input", null, "ai-input"); input.id = id; parent.appendChild(input); return input;
  }
  var card = node("section", null, "card ai-panel");
  card.appendChild(node("h2", "Подключение OpenAI"));
  card.appendChild(node("div", "Смахните вниз в начале или вверх в конце страницы, чтобы выйти.", "note"));
  card.appendChild(node("p", "Сохраните API-ключ и выберите модель. Запросы пока не отправляются.", "muted"));
  var setup = node("form", null, "ai-settings");
  var key = field(setup, "API-ключ", "openai-key");
  key.type = "password"; key.placeholder = "sk-…"; key.maxLength = 1024; key.autocomplete = "off";
  key.spellcheck = false; key.setAttribute("autocapitalize", "none");
  var model = field(setup, "Модель", "openai-model", "select");
  AI.models.forEach(function (item) { var option = node("option", item.label); option.value = item.id; model.appendChild(option); });
  model.value = AI.defaultModel; model.required = true;
  setup.appendChild(node("p", "Sol - баланс качества и стоимости. Astra дороже, Luna экономнее. Доступ зависит от вашего аккаунта OpenAI.", "note"));
  setup.appendChild(node("p", "Ключ хранится в этом браузере без шифрования и доступен скриптам сайта. Он не входит в резервные копии. Сохраняйте только на своём устройстве.", "note"));
  var links = node("p", null, "note");
  var apiKeys = node("a", "Создать API-ключ"); apiKeys.href = "https://platform.openai.com/api-keys";
  apiKeys.target = "_blank"; apiKeys.rel = "noopener noreferrer"; links.appendChild(apiKeys);
  links.appendChild(document.createTextNode(" · API оплачивается отдельно от подписки ChatGPT.")); setup.appendChild(links);
  var buttons = node("div", null, "btnrow");
  var save = node("button", "Сохранить", "btn"); save.type = "submit";
  var remove = node("button", "Удалить ключ", "btn sec"); remove.type = "button";
  buttons.appendChild(save); buttons.appendChild(remove); setup.appendChild(buttons);
  var settingsStatus = node("p", null, "note"); settingsStatus.setAttribute("role", "status"); setup.appendChild(settingsStatus);
  card.appendChild(setup);

  function refresh() {
    try {
      var config = AI.settings(); model.value = config.model;
      key.placeholder = config.key ? "Сохранён. Вставьте сюда новый для замены" : "sk-…";
      settingsStatus.textContent = config.key ? "Ключ сохранён на этом устройстве." : "Ключ ещё не сохранён.";
    } catch (e) { settingsStatus.textContent = e.message; }
  }
  setup.onsubmit = function (event) {
    event.preventDefault();
    try {
      AI.save(key.value, model.value); key.value = ""; refresh();
      settingsStatus.textContent = "Ключ и модель сохранены на этом устройстве.";
    } catch (e) { settingsStatus.textContent = e.message; }
  };
  remove.onclick = function () {
    try { AI.remove(); key.value = ""; refresh(); settingsStatus.textContent = "Ключ удалён с этого устройства."; }
    catch (e) { settingsStatus.textContent = e.message; }
  };

  refresh(); host.appendChild(card);
  var detachSwipe = window.SwipeBack.mount(card, backToSettings);
  return function () { detachSwipe(); key.value = ""; };
};
