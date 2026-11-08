/* Учебные данные для чата. Разметка и состояние хранилища сюда не попадают. */
window.TutorContext = (function () {
  "use strict";
  function text(html) {
    var entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
    return String(html || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(?:td|th)>/gi, " | ").replace(/<br\s*\/?\s*>|<\/(?:p|div|tr|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]*>/g, "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (all, name) {
        if (name.charAt(0) !== "#") return entities[name.toLowerCase()];
        var n = name.charAt(1).toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return n > 0 && n < 65536 ? String.fromCharCode(n) : all;
      }).replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n\n").trim().slice(0, 18000);
  }
  function word(w, direction, back) {
    return { type: "word", title: w.de, word: w.de, translation: w.ru,
      example: w.ex || "", exampleTranslation: w.exru || "", alternative: w.reg || "",
      alternativeExample: w.regEx || "", alternativeExampleTranslation: w.regExRu || "",
      direction: direction === "de" ? "немецкий → русский" : "русский → немецкий",
      side: back ? "оборот" : "лицевая сторона" };
  }
  function theory(g) { return { title: g.title, text: text(g.html) }; }
  function describe(data) {
    var lines = [data.title || "Текущий экран"];
    var fields = { word: "Слово", translation: "Перевод", example: "Пример", exampleTranslation: "Перевод примера",
      alternative: "Другой вариант", alternativeExample: "Пример варианта", alternativeExampleTranslation: "Перевод примера варианта",
      direction: "Направление", side: "Сторона карточки", description: "Описание", text: "Теория",
      instruction: "Условие", question: "Задание", articleHint: "Артикли", options: "Варианты", input: "Ваш ввод",
      explanation: "Объяснение", verdict: "Результат", note: "Примечание", topics: "Темы" };
    Object.keys(fields).forEach(function (key) {
      var value = data[key]; if (Array.isArray(value)) value = value.join(" / ");
      if (value) lines.push(fields[key] + ": " + value);
    });
    if (data.checked != null) lines.push(data.checked ? "Ответ уже проверен" : "Ответ ещё не проверен");
    if (data.selectedOption != null) lines.push("Ваш выбор: " + (data.options[data.selectedOption] || ""));
    if (data.sampleAnswer != null) lines.push("Образец: " + (data.exerciseType === "choice" ? data.options[data.sampleAnswer] : [].concat(data.sampleAnswer).join(" / ")));
    (data.openTheory || []).forEach(function (g) { lines.push("Открытая теория: " + g.title + "\n" + g.text); });
    (data.words || []).forEach(function (w) { lines.push(w.de + " - " + w.ru); });
    if (data.pairOptions) lines.push("Пары: " + data.pairOptions.left.join(" / ") + "\n" + data.pairOptions.right.join(" / "));
    if (data.cards != null) lines.push("Карточек: " + data.cards);
    if (data.answered != null) lines.push("Ответов: " + data.answered + ", верных: " + data.correct + ", с подсказкой: " + data.hints);
    return lines.join("\n\n");
  }
  function exercise(ex, draft, result, title) {
    draft = draft || {};
    var out = { type: "exercise", title: title, exerciseType: ex.type,
      instruction: ex.prompt || "", question: ex.q || "", translation: ex.ru || "",
      articleHint: ex.articleHint || "", options: ex.opts || ex.words || [],
      input: draft.values || [], zeroEndings: draft.zeros || [], selectedOption: draft.choice,
      checked: !!result };
    /* До проверки не раскрываем ключи, объяснение и порядок правильных пар. */
    if (ex.pairs) out.pairOptions = {
      left: ex.pairs.map(function (p) { return p[0]; }).sort(),
      right: ex.pairs.map(function (p) { return p[1]; }).sort()
    };
    if (result) { out.sampleAnswer = ex.a != null ? ex.a : ex.pairs; out.explanation = ex.why; out.verdict = result.verdict; }
    return out;
  }
  return { text: text, word: word, theory: theory, exercise: exercise, describe: describe };
})();
