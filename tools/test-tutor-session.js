const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');

function fixture() {
  const w = env.load(['js/tutor-session.js']);
  const calls = [], settings = [], timers = new Map(); let seq = 0;
  function deferred(list, data) { return new Promise((resolve, reject) => list.push({ ...data, resolve, reject })); }
  const session = w.TutorSession.create({
    controller: () => new AbortController(),
    gateway: {
      request: (context, history, question, signal) => deferred(calls, { context, history, question, signal }),
      settings: (action, key, signal) => deferred(settings, { action, key, signal })
    },
    setTimeout: (fn, ms) => { timers.set(++seq, { fn, ms }); return seq; },
    clearTimeout: id => timers.delete(id)
  });
  session.setAccount({ uid: 'owner' });
  session.setContext('word:a', () => ({ word: 'anspruchsvoll' }));
  return { session, calls, settings, timers,
    timeout(ms) { [...timers.values()].find(x => x.ms === ms).fn(); } };
}
const tick = () => env.settle();

test('подсказки скрываются после нажатия до новой беседы, включая ошибку и повторное открытие',async()=>{
  const h=fixture(),s=h.session;assert.equal(s.state().suggestionsUsed,false);
  s.preset('explain','Объясни проще');assert.equal(s.state().suggestionsUsed,true);await tick();
  h.calls[0].reject(new TypeError('network'));await tick();assert.equal(s.state().suggestionsUsed,true);
  s.close();s.open();assert.equal(s.state().suggestionsUsed,true);
  s.setContext('word:a',()=>({word:'anspruchsvoll'}));assert.equal(s.state().suggestionsUsed,true);
  s.setContext('word:b',()=>({word:'bekommen'}));assert.equal(s.state().suggestionsUsed,false);
  s.preset('parts','Разбери на части');assert.equal(s.state().suggestionsUsed,true);s.stop();
  assert.equal(s.state().suggestionsUsed,true);s.setAccount({uid:'other'});assert.equal(s.state().suggestionsUsed,false);
});

test('ответ хранит ключ исходного слова, не подменяя его текущим контекстом',async()=>{
  const h=fixture(),s=h.session;s.setContext('word:a',()=>({type:'word',wordKey:'V:anspruchsvoll'}));
  s.ask('Поясни');await tick();h.calls[0].resolve('Anspruch + voll');await tick();
  assert.equal(s.state().messages[1].wordKey,'V:anspruchsvoll');
});

test('беседа передаёт свежий контекст, отмечает подсказку и продолжает историю', async () => {
  const h = fixture(), s = h.session; let word = 'anspruchsvoll', hints = 0;
  s.setContext('word:a', () => ({ word }), () => hints++);
  assert.equal(hints, 0); word = 'Anspruch'; s.setDraft('Почему?'); s.ask('Почему?');
  assert.equal(hints, 1); assert.equal(s.ask('Дубль'), false); await tick();
  assert.equal(h.calls[0].context.word, word); assert.equal(h.calls[0].history.length, 0);
  h.calls[0].resolve('Требование'); await tick();
  s.ask('А voll?'); await tick(); assert.equal(h.calls[1].history.length, 2);
  h.calls[1].resolve('Полный'); await tick();
  assert.equal(s.state().messages.length, 4); assert.equal(h.timers.size, 0);
});

test('смена экрана отменяет запрос и не принимает поздний ответ', async () => {
  const h = fixture(), s = h.session; s.ask('Первое'); await tick();
  s.setContext('word:b', () => ({ word: 'bekommen' }));
  assert.equal(h.calls[0].signal.aborted, true);
  h.calls[0].resolve('Старый ответ'); await tick();
  assert.equal(s.state().messages.length, 0); assert.equal(s.state().pending, false);
  s.ask('Второе'); await tick(); assert.equal(h.calls[1].context.word, 'bekommen');
  h.calls[1].resolve('Получать'); await tick();
});

test('отмена, ошибка и тайм-аут восстанавливают вопрос без неудачной истории', async () => {
  const h = fixture(), s = h.session;
  for (const mode of ['stop', 'error', 'timeout']) {
    s.setDraft('Anspruch'); s.preset('parts', 'Разбери на части'); await tick();
    const call = h.calls.at(-1);
    assert.match(call.question, /Ученик уточнил.*Anspruch/);
    if (mode === 'stop') s.stop('Остановлен');
    else if (mode === 'timeout') h.timeout(80000);
    else call.reject(new TypeError('network'));
    await tick();
    assert.equal(s.state().draft, 'Anspruch'); assert.equal(s.state().messages.length, 0);
    assert.equal(s.state().pending, false); assert.equal(h.timers.size, 0);
    if (mode !== 'error') {
      assert.equal(call.signal.aborted, true); call.resolve('Поздний ответ'); await tick();
      assert.equal(s.state().messages.length, 0);
    }
  }
  assert.match(s.state().status, /слишком много времени/);
});

test('смена аккаунта отменяет оба запроса и очищает беседу и статус ключа', async () => {
  const h = fixture(), s = h.session; s.open(); s.ask('Поясни'); await tick();
  s.setAccount({ uid: 'other' });
  assert.equal(h.calls[0].signal.aborted, true); assert.equal(h.settings[0].signal.aborted, true);
  h.calls[0].resolve('Прежний аккаунт'); h.settings[0].resolve({ configured: true }); await tick();
  assert.equal(s.state().configured, null); assert.equal(s.state().messages.length, 0);
  h.settings[1].resolve({ configured: false }); await tick(); assert.equal(s.state().configured, false);
  s.setAccount(null); assert.equal(s.ask('Вопрос'), false); assert.equal(s.state().configured, null);
});

test('ключ уходит только адаптеру, готовность проверяется после повторного открытия', async () => {
  const h = fixture(), s = h.session, key = 'sk-test-secret-123456';
  assert.equal(s.saveKey('bad'), false); assert.equal(h.settings.length, 0);
  assert.equal(s.saveKey(key), true); assert.equal(h.settings[0].key, key);
  assert.doesNotMatch(JSON.stringify(s.state()), /sk-test/);
  h.settings[0].resolve({ configured: true }); await tick(); assert.equal(s.state().configured, true);
  s.close(); s.open(); assert.equal(h.settings[1].action, 'status'); assert.equal(h.settings[1].key, undefined);
  h.settings[1].resolve({ configured: true }); await tick(); assert.equal(s.state().configured, true);
});

test('закрытие отменяет проверку ключа, но позволяет завершить объяснение', async () => {
  const h = fixture(), s = h.session; s.open(); s.setDraft('Вопрос'); s.ask('Вопрос'); await tick();
  s.close(); assert.equal(h.settings[0].signal.aborted, true); assert.equal(h.calls[0].signal.aborted, false);
  h.settings[0].resolve({ configured: true }); h.calls[0].resolve('Ответ'); await tick();
  assert.equal(s.state().configured, null); assert.equal(s.state().messages.length, 2);
});

test('зависшее сохранение ключа разблокирует повтор, поздний ответ игнорируется', async () => {
  const h = fixture(), s = h.session; s.saveKey('sk-test-secret-12345'); h.timeout(60000);
  assert.equal(s.state().settingsPending, false); assert.equal(s.state().configured, false);
  assert.match(s.state().keyStatus, /дождаться сервера/);
  h.settings[0].resolve({ configured: true }); await tick(); assert.equal(s.state().configured, false);
  s.refresh(); h.settings[1].resolve({ configured: true }); await tick(); assert.equal(s.state().configured, true);
});

test('ошибка чтения настройки указывает на соединение с Firebase', async () => {
  const h = fixture(), s = h.session; s.open();
  h.settings[0].reject(new TypeError('Failed to fetch')); await tick();
  assert.match(s.state().keyStatus, /связаться с Firebase/);
  assert.match(s.state().keyStatus, /интернет/);
  assert.equal(s.state().settingsPending, false);
});
