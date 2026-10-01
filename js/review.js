/* План повторения: сохраняем конкретный вариант и проверяем ту же цель. */
window.ReviewPlan = (function () {
  "use strict";
  function same(a, b) {
    return a.type === b.type && a.q === b.q && a.ru === b.ru && a.full === b.full && a.prompt === b.prompt && JSON.stringify(a.words) === JSON.stringify(b.words) && JSON.stringify(a.a) === JSON.stringify(b.a) && JSON.stringify(a.opts) === JSON.stringify(b.opts) && JSON.stringify(a.pairs) === JSON.stringify(b.pairs);
  }
  function variant(item) {
    var original = item.r.ex;
    if (!item.r.box) return original;
    var match = item.id.match(/^L(\d+)D(\d+)-(\d+)$/), lesson = window["L" + item.r.n];
    var day = match && lesson && lesson.days[+match[2]], current = day && day.ex[+match[3]];
    var skill = original.skill || (current && same(original, current) && current.skill);
    if (!skill || !day) return original;
    var candidates = day.ex.filter(function (ex) { return ex.skill === skill && !same(ex, original); });
    var productive = candidates.filter(function (ex) { return ex.type === "fill" || ex.type === "translate"; });
    if (productive.length) candidates = productive;
    return candidates.length ? candidates[(item.r.box - 1) % candidates.length] : original;
  }
  function create(due) {
    return { id: "review-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12), i: 0, at: Date.now(), records: [], items: due.map(function (item) { return { id: item.id, n: item.r.n, box: item.r.box, due: item.r.due, ex: variant(item) }; }) };
  }
  function pending(item, state) { var error = state.srs[item.id]; return error && error.box === item.box && error.due === item.due; }
  function grade(session, index, result) {
    var item = session.items[index];
    return { id: item.id, attemptId: session.id + ":" + index, ok: result.ok, verdict: result.verdict, expectedBox: item.box, expectedDue: item.due };
  }
  return { variant: variant, create: create, pending: pending, grade: grade };
})();
