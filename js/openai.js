/* Личный ключ хранится отдельно от Store: без синхронизации и экспорта. */
window.GermanAI = (function () {
  "use strict";
  var STORAGE = "de-openai-settings-v1", DEFAULT_MODEL = "gpt-6.1-sol";
  var MODELS = [
    { id: "gpt-6.1-sol", label: "GPT-6.1 Sol · рекомендую", effort: "low" },
    { id: "gpt-6-astra", label: "GPT-6 Astra · максимум качества", effort: "low" },
    { id: "gpt-6-luna", label: "GPT-6 Luna · экономнее", effort: "low" },
    { id: "gpt-4.1", label: "GPT-4.1 · без рассуждений" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini · прежний вариант" }
  ];
  var ENDPOINT = "https://api.openai.com/v1/responses";
  var INSTRUCTIONS = "Ты помощник русскоговорящего ученика немецкого A2-B1. " +
    "Объясняй кратко по-русски, немецкие примеры давай с переводом. " +
    "Предпочитай естественные повседневные слова, книжные и официальные варианты указывай дополнительно. " +
    "При проверке перевода учитывай допустимые варианты и объясняй конкретные ошибки. " +
    "Не выдавай близкие по смыслу слова за полностью взаимозаменяемые. " +
    "Пиши обычным текстом без Markdown-таблиц и HTML. Вместо длинного тире используй дефис.";

  function error(message) { var e = new Error(message); e.userMessage = message; return e; }
  function validate(key, model) {
    if (typeof key !== "string" || !/^sk-[A-Za-z0-9_-]+$/.test(key) || key.length > 1024) {
      throw error("Вставьте API-ключ OpenAI, начинающийся с sk-, без пробелов.");
    }
    if (!MODELS.some(function (item) { return item.id === model; })) {
      throw error("Выберите модель из списка.");
    }
    return { key: key, model: model };
  }
  function settings() {
    var raw;
    try { raw = localStorage.getItem(STORAGE); }
    catch (e) { throw error("Браузер не разрешил прочитать сохранённый ключ."); }
    if (!raw) return { key: "", model: DEFAULT_MODEL };
    try { var value = JSON.parse(raw); return validate(value.key, value.model); }
    catch (e) { throw error("Настройки OpenAI повреждены. Удалите ключ и сохраните его заново."); }
  }
  function save(key, model) {
    key = String(key || "").trim(); model = String(model || "").trim();
    if (!key) key = settings().key;
    var value = validate(key, model);
    try { localStorage.setItem(STORAGE, JSON.stringify(value)); }
    catch (e) { throw error("Ключ не сохранён: браузер запретил запись или закончилось место."); }
  }
  function remove() {
    try { localStorage.removeItem(STORAGE); }
    catch (e) { throw error("Не удалось удалить ключ из браузера. Попробуйте ещё раз."); }
  }
  function apiError(status, code) {
    if (status === 401) return error("Ключ не принят OpenAI. Проверьте его или сохраните новый.");
    if (status === 403) return error("Нет доступа к модели или API. Проверьте разрешения ключа.");
    if (status === 404) return error("Модель не найдена или недоступна этому ключу. Проверьте её название.");
    if (status === 429 && code === "insufficient_quota") return error("Закончился баланс или бюджет OpenAI API. Проверьте оплату API.");
    if (status === 429) return error("Превышен лимит запросов OpenAI. Повторите позже.");
    if (status >= 500) return error("OpenAI временно недоступен. Повторите позже.");
    return error("OpenAI отклонил запрос. Проверьте модель и разрешения ключа (HTTP " + status + ").");
  }
  function answerText(data) {
    var parts = [];
    if (!data || data.error || data.status === "failed") throw error("OpenAI не смог завершить ответ. Повторите запрос позже.");
    (Array.isArray(data.output) ? data.output : []).forEach(function (item) {
      if (item.type !== "message") return;
      (Array.isArray(item.content) ? item.content : []).forEach(function (part) {
        if (part.type === "output_text" && typeof part.text === "string") parts.push(part.text);
        if (part.type === "refusal" && typeof part.refusal === "string") parts.push(part.refusal);
      });
    });
    if (!parts.join("").trim()) throw error("Модель не вернула текст. Попробуйте более короткий вопрос или другую текстовую модель.");
    return parts.join("\n\n") + (data.status === "incomplete" ? "\n\nОтвет не завершён. Можно задать более узкий вопрос." : "");
  }
  function ask(question) {
    var config = settings();
    if (!config.key) throw error("Сначала сохраните API-ключ в настройках подключения.");
    question = String(question || "").trim();
    if (!question || question.length > 6000) throw error("Введите вопрос длиной от 1 до 6000 символов.");
    if (!window.fetch || !window.AbortController) throw error("Обновите браузер: отправка запросов не поддерживается.");
    var controller = new window.AbortController(), reason = "", finished = false;
    var selected = MODELS.filter(function (item) { return item.id === config.model; })[0];
    var body = { model: config.model, instructions: INSTRUCTIONS, input: question, store: false, max_output_tokens: selected.effort ? 6000 : 2000 };
    if (selected.effort) body.reasoning = { effort: selected.effort };
    var timer = setTimeout(function () { reason = "timeout"; controller.abort(); }, 60000);
    function clean() { finished = true; clearTimeout(timer); }
    var promise = Promise.resolve().then(function () {
      return window.fetch(ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.key },
        credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer",
        signal: controller.signal,
        body: JSON.stringify(body)
      });
    }).then(function (response) {
      return response.json().catch(function () {
        if (!response.ok) throw apiError(response.status);
        throw error("OpenAI вернул непонятный ответ. Повторите позже.");
      }).then(function (data) {
        if (!response.ok) throw apiError(response.status, data && data.error && data.error.code);
        return answerText(data);
      });
    }).then(function (text) { clean(); return text; }, function (e) {
      clean();
      if (reason) throw error(reason === "timeout" ? "Ответ не пришёл за минуту. Попробуйте позже." : "Запрос отменён.");
      if (e.userMessage) throw e;
      throw error("Не удалось связаться с OpenAI. Проверьте интернет; браузер или среда приложения могли заблокировать запрос.");
    });
    return { promise: promise, cancel: function () { if (!finished) { reason = "cancel"; controller.abort(); } } };
  }
  return { settings: settings, save: save, remove: remove, ask: ask, defaultModel: DEFAULT_MODEL, models: MODELS };
})();
