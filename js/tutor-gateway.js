/* В браузере только Firebase ID token. Ключ OpenAI доступен серверной функции. */
window.TutorGateway = (function () {
  "use strict";
  function signedIn() { return !!(window.Cloud && window.Cloud.status().user); }
  function error(code) {
    var messages = {
      UNAUTHENTICATED: "Войдите через Google, чтобы пользоваться чатом.",
      PERMISSION_DENIED: "Этот аккаунт не подключён к личному чату.",
      FAILED_PRECONDITION: "Чат ещё не настроен на сервере Firebase.",
      RESOURCE_EXHAUSTED: "Достигнут лимит чата или OpenAI. Повторите позже и проверьте баланс API.",
      DEADLINE_EXCEEDED: "Ответ занял слишком много времени. Повторите запрос.",
      INVALID_ARGUMENT: "Не удалось отправить этот материал. Сократите вопрос или начните новый диалог."
    };
    return new Error(messages[code] || "Сервис объяснений сейчас недоступен. Повторите позже.");
  }
  function call(name, data, signal) {
    if (!window.Cloud) return Promise.reject(error("UNAUTHENTICATED"));
    return window.Cloud.tutorSession().then(function (session) {
      if (signal && signal.aborted) throw { name: "AbortError" };
      return window.fetch("https://europe-west3-" + session.projectId + ".cloudfunctions.net/" + name, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.token },
        body: JSON.stringify({ data: data }), signal: signal, credentials: "omit", referrerPolicy: "no-referrer"
      }).then(function (res) {
        if (res.status === 404) throw new Error("Чат ещё не опубликован на сервере Firebase.");
        return res.json().then(function (body) {
          var current = window.Cloud.status().user;
          if (!current || current.uid !== session.uid || window.Cloud.config().projectId !== session.projectId || (signal && signal.aborted)) throw { name: "AbortError" };
          if (body.error) throw error(body.error.status);
          if (!res.ok) throw error(res.status === 401 ? "UNAUTHENTICATED" : "UNAVAILABLE");
          var result = body.data || body.result;
          if (!result || typeof result !== "object") throw error("UNAVAILABLE");
          return result;
        });
      });
    });
  }
  function request(data, history, question, signal) {
    return call("explainGerman", { context: data, history: history.slice(-12).map(function (m) {
      return { role: m.role, content: m.content };
    }), question: question }, signal).then(function (result) {
      if (typeof result.text !== "string" || !result.text.trim() || result.text.length > 14000) throw error("UNAVAILABLE");
      return result.text;
    });
  }
  function settings(action, key, signal) {
    var data = { action: action }; if (action === "save") data.key = key;
    return call("tutorSettings", data, signal).then(function (result) {
      if (typeof result.configured !== "boolean") throw error("UNAVAILABLE");
      return { configured: result.configured };
    });
  }
  return { signedIn: signedIn, request: request, settings: settings };
})();
