/* Прохождение серии заданий: позиция, пропуск, удаление, возобновление и итог.
   Экран строит DOM и показывает текущее задание, правила дня и повтора ошибок
   живут здесь. Попыткой каждого задания управляет ExerciseAttempt. */
window.ExerciseRun = (function () {
  "use strict";
  function create(options) {
    var store = options.store, practice = options.practice, sessions = options.sessions, plan = options.review;
    var attempts = window.ExerciseAttempt.create(options);

    /* alive() - экран ещё открыт. Любое действие после ухода с экрана ничего не меняет. */
    function walk(draft, rules, alive) {
      var finished = false, attempt = null, record = null;
      function open() { return !finished && alive() && draft.i < rules.count; }
      function finish(manual) {
        if (finished) return null;
        finished = true;
        run.finished = true;
        run.outcome = rules.finish(manual);
        return run.outcome;
      }
      function omit(why) {
        if (!open()) return false;
        var mine = draft.records[draft.i] || (draft.records[draft.i] = {});
        if (!mine.result) mine.omitted = why;
        draft.i++; rules.save();
        return true;
      }
      var run = {
        id: draft.id, finished: false, outcome: null,
        /* Ставит на текущее задание и монтирует его в host. null - показывать нечего:
           серия закончилась (finished) или экран закрыт. */
        show: function (host, onResult) {
          if (finished || !alive()) return null;
          while (draft.i < rules.count && rules.skips(draft.i)) draft.i++;
          if (draft.i >= rules.count) { finish(false); return null; }
          rules.save();
          var index = draft.i, mine = record = draft.records[index] || (draft.records[index] = {});
          attempt = rules.mount(index, host, {
            active: function () { return !finished && alive() && mine === draft.records[draft.i]; },
            onResult: onResult
          });
          return { index: index, id: rules.id(index), ex: rules.exercise(index), position: rules.position(index), count: rules.visible() };
        },
        state: function () {
          var s = attempt.state();
          return { draft: s.draft, result: s.result, answered: !!s.result, canCheck: s.canCheck };
        },
        check: function () { attempt.check(); },
        hint: function () { attempt.hint(); },
        /* true - позиция сдвинулась, экран показывает следующее задание */
        next: function () {
          if (!(record && record.result) || !open()) return false;
          draft.i++; rules.save();
          return true;
        }
      };
      if (rules.removable) {
        run.skip = function () { return !(record && record.result) && omit("skipped"); };
        run.remove = function (reason) {
          if (!reason || !open()) return false;
          var index = draft.i;
          store.mutate("exerciseDelete", { id: rules.id(index), ex: rules.exercise(index), reason: reason });
          return rules.deleted(index) && omit("deleted");
        };
        /* manual - день засчитан кнопкой, итог берётся только из сохранённых ответов */
        run.finish = finish;
      }
      return run;
    }

    /* День: черновик Practice, пропуск и удаление, итог попадает в dayDone или practiceDone. */
    function day(n, di, list, alive) {
      var draft = practice.load(n, di, list) || practice.create(n, di, list);
      function id(index) { return "L" + n + "D" + di + "-" + index; }
      function deleted(index) { return !!(store.state().deletedExercises || {})[id(index)]; }
      function visible() {
        return list.map(function (ex, index) { return index; }).filter(function (index) { return !deleted(index); });
      }
      return walk(draft, {
        count: list.length, removable: true, id: id, deleted: deleted,
        exercise: function (index) { return list[index]; },
        visible: function () { return visible().length; },
        position: function (index) { return visible().indexOf(index); },
        save: function () { practice.save(draft); },
        skips: function (index) {
          var gone = deleted(index), mine = draft.records[index];
          if (!gone && !(mine && mine.omitted)) return false;
          mine = draft.records[index] || (draft.records[index] = {});
          if (!mine.result && gone) mine.omitted = "deleted";
          return true;
        },
        mount: function (index, host, view) { return attempts.day(draft, index, list[index], host, view); },
        finish: function (manual) {
          var stats = practice.stats(draft), of = stats.answered;
          if (manual) {
            of = 0;
            draft.records.forEach(function (mine) { if (mine && mine.result) of++; });
            of = Math.max(of, stats.correct);
          }
          var op = { n: n, di: di, score: stats.correct, of: of, uncertain: stats.uncertain, hints: stats.hints, attemptId: draft.id, records: draft.records };
          if (manual) op.manual = true;
          /* ответов не было - в истории нечего показывать, остаётся только отметка дня */
          if (manual && !of) { delete op.attemptId; delete op.records; }
          if (manual || of) store.mutate(!manual && stats.skipped ? "practiceDone" : "dayDone", op);
          if (of) touchStreak();
          practice.remove(n, di);
          return { manual: !!manual, of: of, stats: stats };
        }
      }, alive);
    }

    function touchStreak() {
      var today = window.ProgressData.day(new Date());
      if (store.state().lastDay !== today) store.mutate("touchDay", { day: today });
    }

    /* Повтор ошибок: сессия Sessions, устаревшие задания пропускаются, итог - пустая очередь.
       due() вызывается только когда сохранённой сессии нет. */
    function review(due, alive) {
      var draft = sessions.load("review") || plan.create(due(), store.state());
      var run = walk(draft, {
        count: draft.items.length,
        id: function (index) { return draft.items[index].id; },
        exercise: function (index) { return draft.items[index].ex; },
        visible: function () { return draft.items.length; },
        position: function (index) { return index; },
        save: function () { draft.at = Date.now(); sessions.save("review", draft); },
        skips: function (index) {
          var item = draft.items[index], state = store.state();
          return plan.deleted(item, state) || !(window.ExerciseAttempt.checked(draft.records[index]) || plan.pending(item, state));
        },
        mount: function (index, host, view) { return attempts.review(draft, index, host, view); },
        finish: function () { sessions.clear("review"); return null; }
      }, alive);
      run.empty = !draft.items.length;
      return run;
    }

    return { day: day, review: review };
  }
  return { create: create };
})();
