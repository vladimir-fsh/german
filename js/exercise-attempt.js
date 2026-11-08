/* Жизненный цикл попытки: черновик, подсказка, восстановление и однократный зачёт.
   Учебный день и повтор ошибок сохраняют разные правила записи прогресса. */
window.ExerciseAttempt = (function () {
  "use strict";
  function create(options) {
    var store = options.store, engine = options.engine;
    function mount(run, index, ex, host, view, policy) {
      var record = run.records[index] || (run.records[index] = {}), api = null;
      function active() {
        return (!view.active || view.active()) && run.records[index] === record && !record.omitted && policy.valid();
      }
      function persist() { policy.save(); }
      function reconcile() {
        if (!active() || !record.result) return;
        policy.commit(record.result);
      }
      function accept(result) {
        if (!active()) return;
        if (!record.result) { record.result = result; persist(); }
        reconcile();
        if (view.onResult) view.onResult();
      }
      if (!record.result && record.draft && record.draft.result) { record.result = record.draft.result; persist(); }
      var draft = record.draft;
      if (draft && record.result) {
        draft = JSON.parse(JSON.stringify(draft)); draft.result = record.result;
      }
      api = engine.render(ex, host, function (ok, result) { accept(result); }, {
        draft: draft,
        isHinted: function () { return !!(record.usedHint || (record.result && record.result.usedHint)); },
        onDraft: function (next) { if (!active()) return; record.draft = next; persist(); }
      });
      if (api.result && !record.result && active()) { record.result = api.result; persist(); }
      reconcile();
      return {
        check: function () { if (active() && !record.result && api.check) api.check(); },
        state: function () { return { draft: api.getDraft ? api.getDraft() : record.draft,
          result: record.result || null, canCheck: !record.result && !!api.check }; },
        hint: function () { if (!active()) return; record.usedHint = true; persist(); }
      };
    }
    function day(run, index, ex, host, view) {
      var id = "L" + run.n + "D" + run.di + "-" + index, token = run.id + ":" + index;
      return mount(run, index, ex, host, view, {
        valid: function () { return !(store.state().deletedExercises || {})[id]; },
        save: function () { options.practice.save(run); },
        commit: function (result) {
          if (store.state().answered[token]) return;
          store.mutate("answer", { ok: result.ok, verdict: result.verdict, attemptId: token });
          if (!result.ok && result.verdict !== "needs-review") store.mutate("srsAdd", { id: id, ex: ex, n: run.n });
        }
      });
    }
    function review(run, index, host, view) {
      var item = run.items[index];
      return mount(run, index, item.ex, host, view, {
        valid: function () { return !options.review.deleted(item, store.state()); },
        save: function () { run.at = Date.now(); options.sessions.save("review", run); },
        commit: function (result) {
          var grade = options.review.grade(run, index, result);
          if (!store.state().answered[grade.attemptId]) store.mutate("reviewAnswer", grade);
        }
      });
    }
    return { day: day, review: review };
  }
  return { create: create };
})();
