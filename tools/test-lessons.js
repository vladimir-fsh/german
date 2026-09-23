/* Проверка данных уроков: типы заданий, количество пропусков,
   ссылки на блоки теории, обязательное «почему».
   Запуск: node tools/test-lessons.js */
var env = require("./env.js");

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) pass++;
  else { fail++; console.log("  FAIL " + name + (extra ? "\n       " + extra : "")); }
}

/* файлы уроков подхватываются сами: всё, что лежит как data/lNN.js */
var lessonFiles = require("fs").readdirSync(__dirname + "/../data")
  .filter(function (f) { return /^l\d+\.js$/.test(f); })
  .sort()
  .map(function (f) { return "data/" + f; });
var win = env.load(["data/lessons.js", "data/vocab.js"].concat(lessonFiles));
var TYPES = { fill: 1, choice: 1, order: 1, translate: 1, pairs: 1 };

win.COURSE.lessons.forEach(function (meta) {
  var L = win["L" + meta.n];
  if (meta.status !== "ready") { ok("урок " + meta.n + " ещё не готов — файла и не ждём", !L || !!L.days); return; }
  ok("урок " + meta.n + ": файл загружен", !!L);
  if (!L) return;
  console.log("\nурок " + meta.n + " · " + L.title + " · дней " + L.days.length);

  L.days.forEach(function (day, di) {
    var where = "урок " + meta.n + ", день " + (di + 1);
    ok(where + ": заданий 14–18", day.ex.length >= 14 && day.ex.length <= 18, "их " + day.ex.length);
    (day.grammar ? [].concat(day.grammar) : []).forEach(function (gi) {
      ok(where + ": блок теории " + gi + " существует", !!L.grammar[gi]);
    });

    var kinds = {};
    day.ex.forEach(function (ex, i) {
      var id = where + ", задание " + (i + 1);
      ok(id + ": тип известен", !!TYPES[ex.type], ex.type);
      /* сборка предложения из плашек тратит время и не тренирует правило — в уроках её нет */
      ok(id + ": без order", ex.type !== "order");
      kinds[ex.type] = (kinds[ex.type] || 0) + 1;

      if (ex.type === "fill") {
        var blanks = (String(ex.q).match(/\{[^}]*\}/g) || []).length;
        var answers = Array.isArray(ex.a[0]) ? ex.a.length : ex.a.length;
        ok(id + ": пропусков столько же, сколько ответов", blanks === answers, blanks + " пропусков, " + answers + " ответов");
        ok(id + ": есть объяснение why", !!ex.why);
      }
      if (ex.type === "choice") {
        ok(id + ": индекс ответа в пределах вариантов", ex.a >= 0 && ex.a < ex.opts.length);
        ok(id + ": варианты не повторяются", new Set(ex.opts).size === ex.opts.length);
        ok(id + ": есть объяснение why", !!ex.why);
      }
      if (ex.type === "translate") {
        ok(id + ": есть русский текст", !!ex.ru);
        ok(id + ": есть хотя бы один ответ", Array.isArray(ex.a) && ex.a.length > 0);
        ok(id + ": есть объяснение why", !!ex.why);
      }
      if (ex.type === "order") {
        var built = ex.words.join(" ");
        var want = (Array.isArray(ex.a) ? ex.a[0] : ex.a);
        ok(id + ": из слов собирается ответ", sameWords(built, want), built + " ≠ " + want);
      }
      if (ex.type === "pairs") {
        ok(id + ": пар от 4 до 8", ex.pairs.length >= 4 && ex.pairs.length <= 8);
      }
    });
    var maxSame = 0;
    for (var k in kinds) maxSame = Math.max(maxSame, kinds[k]);
    ok(where + ": типы перемешаны", maxSame <= day.ex.length - 4, JSON.stringify(kinds));
  });

  ok("урок " + meta.n + ": 10 слов", !L.words || L.words.length === 10, L.words && L.words.length);
  (L.words || []).forEach(function (w) {
    ok("урок " + meta.n + ", слово " + w.de + ": пример и перевод", !!w.ru && !!w.ex && !!w.exru);
  });
  ok("урок " + meta.n + ": ссылки на оригинал", !!L.links && L.links.length > 0);
});

/* слова те же и в том же наборе — порядок задаёт ученик, пунктуацию не сверяем */
function sameWords(a, b) {
  var norm = function (s) { return String(s).toLowerCase().replace(/[.,!?;:]/g, "").split(/\s+/).filter(Boolean).sort().join(" "); };
  return norm(a) === norm(b);
}

console.log("\n" + pass + " ok, " + fail + " fail");
process.exit(fail ? 1 : 0);
