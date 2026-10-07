/* Ни один тест не обращается к сети и не использует настоящий ключ. */
const test = require("node:test");
const assert = require("node:assert/strict");
const env = require("./env.js");
const FILES = ["js/progress-data.js", "js/srs-config.js", "js/sync.js", "js/openai.js"];
const KEY = "sk-fake-test-key-not-a-credential";
function client() { const win = env.load(FILES); win.AbortController = AbortController; return win; }
function reply(data, status = 200) { return Promise.resolve({ ok: status === 200, status, json: () => Promise.resolve(data) }); }
function message(text) { return { type: "message", content: [{ type: "output_text", text }] }; }

test("ключ сохраняется отдельно, заменяется и удаляется; экспорт и журнал его не содержат", () => {
  const win = client(), ai = win.GermanAI;
  ai.save("  " + KEY + "  ", "gpt-4.1-mini");
  const reloaded = env.load(FILES, { storage: { "de-openai-settings-v1": win.localStorage.getItem("de-openai-settings-v1") } });
  assert.equal(reloaded.GermanAI.settings().key, KEY);
  ai.save("", "gpt-4.1"); assert.equal(ai.settings().key, KEY); assert.equal(ai.settings().model, "gpt-4.1");
  win.Store.mutate("answer", { ok: true });
  assert.ok(!win.Store.exportBackup().includes(KEY));
  assert.ok(!win.Store.exportRaw().includes(KEY));
  ai.save("sk-another-fake-test-key", "gpt-4.1-mini"); assert.notEqual(ai.settings().key, KEY);
  ai.remove(); assert.equal(ai.settings().key, "");
});

test("повреждение и запрет записи не маскируются успешным сохранением", () => {
  const win = client();
  win.localStorage.setItem("de-openai-settings-v1", "{broken");
  assert.throws(() => win.GermanAI.settings(), /повреждены/);
  win.GermanAI.remove(); assert.equal(win.GermanAI.settings().key, "");
  win.localStorage.setItem = () => { throw Error("quota"); };
  assert.throws(() => win.GermanAI.save(KEY, "gpt-4.1-mini"), /не сохранён/);
  assert.equal(win.GermanAI.settings().key, "");
});

test("Responses получает только вопрос и инструкции, ключ только в заголовке; собираются все текстовые части", async () => {
  const win = client(); win.GermanAI.save(KEY, "gpt-4.1-mini");
  let calls = 0;
  win.fetch = async (url, options) => {
    calls++; assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer " + KEY);
    assert.equal(options.redirect, "error"); assert.equal(options.credentials, "omit");
    const body = JSON.parse(options.body);
    assert.equal(body.input, "Объясни kennen"); assert.equal(body.model, "gpt-4.1-mini");
    assert.equal(body.store, false); assert.equal(body.max_output_tokens, 2000);
    assert.ok(!options.body.includes(KEY)); assert.ok(!("previous_response_id" in body));
    return reply({ status: "completed", output: [{ type: "reasoning" }, message("kennen"), message("знать кого-то") ] });
  };
  assert.equal(await win.GermanAI.ask("Объясни kennen").promise, "kennen\n\nзнать кого-то");
  assert.equal(calls, 1);
});

test("без ключа, с пустым или слишком длинным вопросом запрос не отправляется", () => {
  const win = client(); win.fetch = () => assert.fail("Unexpected request");
  assert.throws(() => win.GermanAI.ask("Hallo"), /сохраните/);
  win.GermanAI.save(KEY, "gpt-4.1-mini");
  assert.throws(() => win.GermanAI.ask("   "), /Введите вопрос/);
  assert.throws(() => win.GermanAI.ask("a".repeat(6001)), /6000/);
});

test("список моделей использует сильную модель по умолчанию и подходящий режим запроса", async () => {
  const win = client(), ai = win.GermanAI;
  assert.equal(ai.settings().model, "gpt-6.1-sol");
  assert.throws(() => ai.save(KEY, "made-up-model"), /из списка/);
  for (const model of ai.models) {
    ai.save(KEY, model.id);
    win.fetch = async (url, options) => {
      const body = JSON.parse(options.body); assert.equal(body.model, model.id);
      if (model.effort) { assert.equal(body.reasoning.effort, "low"); assert.equal(body.max_output_tokens, 6000); }
      else { assert.ok(!body.reasoning); assert.equal(body.max_output_tokens, 2000); }
      return reply({ output: [message("Объяснение")] });
    };
    assert.equal(await ai.ask("Объясни Dativ").promise, "Объяснение");
  }
});

test("ошибки API не показывают серверный текст с ключом и не повторяют платный запрос", async () => {
  const win = client(); win.GermanAI.save(KEY, "gpt-4.1-mini");
  for (const [status, code, expected] of [[401, "", /Ключ не принят/], [403, "", /Нет доступа/], [404, "", /Модель не найдена/], [429, "insufficient_quota", /баланс/], [429, "rate_limit_exceeded", /лимит запросов/], [500, "", /временно недоступен/]]) {
    let calls = 0;
    win.fetch = () => { calls++; return reply({ error: { code, message: KEY } }, status); };
    await assert.rejects(win.GermanAI.ask("Hallo").promise, expected);
    assert.equal(calls, 1);
  }
  win.fetch = () => Promise.reject(Error(KEY));
  await assert.rejects(win.GermanAI.ask("Hallo").promise, (e) => !e.message.includes(KEY) && /интернет/.test(e.message));
});

test("отмена и таймаут завершают запрос; некорректный, пустой и обрезанный ответы различаются", async () => {
  const win = client(); win.GermanAI.save(KEY, "gpt-4.1-mini");
  win.fetch = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Error("abort")));
  });
  const pending = win.GermanAI.ask("Hallo"); await Promise.resolve(); pending.cancel();
  await assert.rejects(pending.promise, /отменён/);
  let timeout;
  win.setTimeout = (fn) => { timeout = fn; return 1; }; win.clearTimeout = () => {};
  const slow = win.GermanAI.ask("Hallo"); await Promise.resolve(); timeout();
  await assert.rejects(slow.promise, /за минуту/);
  win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.reject(Error("bad json")) });
  await assert.rejects(win.GermanAI.ask("Hallo").promise, /непонятный ответ/);
  win.fetch = () => reply({ output: [] });
  await assert.rejects(win.GermanAI.ask("Hallo").promise, /не вернула текст/);
  win.fetch = () => reply({ status: "incomplete", output: [message("Часть ответа")] });
  assert.match(await win.GermanAI.ask("Hallo").promise, /Часть ответа[\s\S]*не завершён/);
});
