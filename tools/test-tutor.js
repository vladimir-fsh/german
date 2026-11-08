const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');

test('контекст слова содержит примеры, теория превращается в текст без разметки', () => {
  const w = env.load(['js/tutor-context.js']);
  const word = w.TutorContext.word({de:'anspruchsvoll',ru:'требовательный',ex:'Die Aufgabe ist anspruchsvoll.',exru:'Задание сложное.',reg:'gehoben',regEx:'Ein anspruchsvoller Text.',regExRu:'Сложный текст.'},'ru',false);
  assert.equal(word.word,'anspruchsvoll'); assert.equal(word.alternativeExample,'Ein anspruchsvoller Text.');
  const theory = w.TutorContext.theory({title:'Окончания',html:'<h3>Хак</h3><p>klein &amp; gut</p><table><tr><td>der</td><td>die</td></tr></table><script>bad()</script>'});
  assert.match(theory.text,/klein & gut/); assert.match(theory.text,/der \| die/);
  assert.doesNotMatch(theory.text,/<|bad\(\)/);
});

test('непроверенное задание не раскрывает ответы, why и правильные пары; проверенное содержит результат и ввод', () => {
  const c = env.load(['js/tutor-context.js']).TutorContext;
  const ex = {type:'fill',q:'ein {klein} Mann',a:['kleiner'],why:'Сигнал рода',articleHint:'мужчина: e'};
  let data=c.exercise(ex,{values:['en'],zeros:[false]},null,'День 1');
  assert.equal(data.input[0],'en'); assert.equal(data.sampleAnswer,undefined); assert.equal(data.explanation,undefined);
  data=c.exercise(ex,{values:['en']},{verdict:'incorrect'},'День 1');
  assert.equal(data.sampleAnswer[0],'kleiner'); assert.equal(data.explanation,ex.why);
  data=c.exercise({type:'pairs',pairs:[['b','2'],['a','1']]},{},null,'Пары');
  assert.deepEqual(Array.from(data.pairOptions.left),['a','b']);
  assert.equal(data.pairs,undefined); assert.equal(data.sampleAnswer,undefined);
});

// Небольшой DOM для настоящих обработчиков чата, сетевой транспорт подставной.
function fixture(options={}) {
  const w=env.load(['js/tutor-context.js','js/tutor-gateway.js','js/tutor-session.js','js/tutor.js']);
  const nodes=[];
  function node(tag) {
    const classes=new Set(); let text='';
    const n={tag,children:[],style:{},attrs:{},hidden:false,value:'',scrollHeight:100,
      set textContent(v){text=String(v);this.children=[]},get textContent(){return text+this.children.map(x=>x.textContent).join('')},
      appendChild(x){this.children.push(x);return x},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},
      focus(){w.document.activeElement=this},blur(){w.document.activeElement=null},
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
      contains:x=>nodes.includes(x),querySelectorAll:()=>[],getClientRects:()=>[{}]};
    nodes.push(n);return n;
  }
  w.document.createElement=node; w.document.body=node('body'); w.document.documentElement=node('html');
  const app=node('main'),bar=node('nav'); w.document.getElementById=id=>id==='app'?app:bar;
  w.innerHeight=844; w.AbortController=AbortController;
  const timers=[]; w.setTimeout=fn=>{timers.push(fn);return fn};w.clearTimeout=()=>{};
  const requests=[],statusRequests=[];let configured=!!options.configured;
  w.fetch=(url,opts)=>{
    if(JSON.parse(opts.body).data.action==='status'){
      if(options.manualStatus)return new Promise((resolve,reject)=>statusRequests.push({url,opts,resolve,reject}));
      statusRequests.push({url,opts});return Promise.resolve({ok:true,json:async()=>({result:{configured}})});
    }
    return new Promise((resolve,reject)=>requests.push({url,opts,resolve,reject,setConfigured:value=>{configured=value}}));
  };
  let user=null;const listeners=[];
  w.Cloud={status:()=>({user}),config:()=>({projectId:'german-test'}),onChange:fn=>{listeners.push(fn);fn({user})},
    tutorSession:()=>user?Promise.resolve({uid:user.uid,projectId:'german-test',token:'firebase-test-id-token'}):Promise.reject(Error('Войдите через Google'))};
  w.location={hash:''};
  w.Tutor.init(); w.Tutor.setContext('word:a',()=>({type:'word',title:'anspruchsvoll',word:'anspruchsvoll'}));
  w.Tutor.open();
  const cls=c=>nodes.find(n=>n.className===c), btn=text=>nodes.find(n=>n.tag==='button'&&n.textContent===text);
  const submit=()=>cls('tutor-compose').onsubmit({preventDefault(){}});
  function connect(uid='owner') {user={uid,email:uid+'@example.invalid'};listeners.forEach(fn=>fn({user}));}
  function logout(){user=null;listeners.forEach(fn=>fn({user}));}
  return {w,nodes,requests,statusRequests,setConfigured:value=>{configured=value},timers,cls,btn,submit,connect,logout,app,bar,question:nodes.find(n=>n.tag==='textarea')};
}
function answer(r,text) {r.resolve({ok:true,json:async()=>({result:{text}})})}
function failure(r,status) {r.resolve({ok:false,status,json:async()=>({error:{status:status===401?'UNAUTHENTICATED':status===429?'RESOURCE_EXHAUSTED':'UNAVAILABLE',message:'private upstream error'}})})}

test('иконка открывает компактный чат и сразу фокусирует вопрос, настройки доступны отдельно',()=>{
  const h=fixture();
  assert.equal(h.w.document.activeElement,h.question);
  assert.equal(h.cls('tutor-settings').hidden,true);assert.equal(h.cls('tutor-log').hidden,true);
  assert.equal(h.cls('tutor-footer').hidden,false);assert.equal(h.requests.length,0);
  h.question.value='Поясни это слово';h.question.oninput();h.w.Tutor.close();h.w.Tutor.open();
  assert.equal(h.question.value,'Поясни это слово');assert.equal(h.w.document.activeElement,h.question);
  h.btn('Добавить API-ключ').onclick();assert.equal(h.cls('tutor-settings').hidden,false);assert.equal(h.cls('tutor-footer').hidden,true);
  assert.notEqual(h.w.document.activeElement,h.question);
  h.btn('К чату').onclick();assert.equal(h.w.document.activeElement,h.question);
});

test('панель следует за видимой областью при открытии клавиатуры и возвращает прокрутку при закрытии',()=>{
  const h=fixture();h.w.visualViewport={height:430,offsetTop:14};h.w._fire('resize');
  const overlay=h.cls('tutor-overlay');
  assert.equal(overlay.style.height,'430px');assert.equal(overlay.style.top,'14px');
  h.w.visualViewport.height=844;h.w.visualViewport.offsetTop=0;h.w._fire('resize');
  assert.equal(overlay.style.height,'844px');assert.equal(overlay.style.top,'0px');
  h.w.Tutor.close();assert.equal(overlay.hidden,true);assert.equal(h.app.inert,false);assert.equal(h.bar.inert,false);
});

test('без входа запросов нет; после входа передаётся Firebase token и актуальный экран без ключа OpenAI', async () => {
  const h=fixture();h.question.value='Поясни';h.submit();
  assert.equal(h.requests.length,0);h.connect();
  assert.equal(h.nodes.filter(n=>n.tag==='input')[0].value,'');
  assert.doesNotMatch(JSON.stringify(h.w.localStorage._dump()),/sk-test/);
  h.btn('Разбери на части').onclick(); h.btn('Разбери на части').onclick();await env.settle();
  assert.equal(h.requests.length,1); const r=h.requests[0];
  assert.equal(r.url,'https://europe-west3-german-test.cloudfunctions.net/explainGerman'); assert.equal(r.opts.headers.Authorization,'Bearer firebase-test-id-token');
  assert.equal(r.opts.credentials,'omit'); assert.match(JSON.stringify(JSON.parse(r.opts.body).data.context),/anspruchsvoll/);
  answer(r,'Anspruch + voll');await env.settle();
  assert.match(h.cls('tutor-log').textContent,/Anspruch \+ voll/);
  h.question.value='А что значит Anspruch?';h.submit();
  await env.settle();const body=JSON.parse(h.requests[1].opts.body).data;
  assert.ok(body.history.some(m=>m.role==='assistant'&&m.content==='Anspruch + voll'));
  answer(h.requests[1],'Притязание');await env.settle();
  h.w.Tutor.close();assert.equal(h.app.inert,false);assert.equal(h.bar.inert,false);
});



test('быстрая кнопка учитывает слово из поля и сохраняет его при ошибке', async () => {
  const h=fixture();h.connect();h.question.value='anspruchsvoll';
  h.btn('Разбери на части').onclick();
  await env.settle();const body=JSON.parse(h.requests[0].opts.body).data;
  assert.match(body.question,/Ученик уточнил слово, фрагмент или вопрос: anspruchsvoll/);
  assert.match(h.cls('tutor-log').textContent,/Разбери на части: anspruchsvoll/);
  failure(h.requests[0],429);await env.settle();
  assert.equal(h.question.value,'anspruchsvoll');
});

test('ошибки сети и API оставляют вопрос для повтора; отмена и тайм-аут не засоряют историю', async () => {
  for (const code of [401,429,500]) {
    const h=fixture();h.connect();h.question.value='Поясни';h.submit();
    await env.settle();failure(h.requests[0],code);await env.settle();
    assert.equal(h.question.value,'Поясни');
    assert.match(h.cls('tutor-status').textContent,code===401?/Google/:code===429?/лимит/:/недоступен/);
    h.submit();await env.settle();assert.equal(JSON.parse(h.requests[1].opts.body).data.history.length,0);
    answer(h.requests[1],'Ответ');await env.settle();
  }
  const h=fixture();h.connect();h.question.value='Поясни';h.submit();
  await env.settle();h.submit(); assert.equal(h.requests[0].opts.signal.aborted,true);
  h.requests[0].reject(Object.assign(Error('aborted'),{name:'AbortError'}));await env.settle();
  assert.equal(h.question.value,'Поясни');
  h.submit();await env.settle();h.timers.at(-1)();h.requests[1].reject(Object.assign(Error('aborted'),{name:'AbortError'}));await env.settle();
  assert.match(h.cls('tutor-status').textContent,/слишком много времени/);
});





function settingsAnswer(r,configured){if(r.setConfigured)r.setConfigured(configured);r.resolve({ok:true,json:async()=>({result:{configured}})})}
test('добавление ключа заменяется двумя командами после сохранения, включая повторное открытие и другое устройство',async()=>{
  const h=fixture();assert.equal(h.btn('Добавить API-ключ').hidden,false);
  assert.equal(h.btn('Объясни проще').hidden,true);assert.equal(h.btn('Разбери на части').hidden,true);
  h.connect();await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,false);
  h.btn('Добавить API-ключ').onclick();await env.settle();
  const field=h.nodes.find(n=>n.tag==='input');field.value='sk-single-setup-test-only';
  h.cls('tutor-key-form').onsubmit({preventDefault(){}});await env.settle();settingsAnswer(h.requests[0],true);await env.settle();
  assert.equal(h.btn('Добавить API-ключ').hidden,true);assert.equal(h.cls('tutor-settings').hidden,true);
  assert.equal(h.btn('Объясни проще').hidden,false);assert.equal(h.btn('Разбери на части').hidden,false);
  assert.equal(h.cls('tutor-footer').hidden,false);assert.equal(field.value,'');
  h.w.Tutor.close();h.w.Tutor.open();assert.equal(h.btn('Добавить API-ключ').hidden,true);await env.settle();
  assert.equal(h.btn('Добавить API-ключ').hidden,true);
  const other=fixture({configured:true});other.connect();await env.settle();assert.equal(other.btn('Добавить API-ключ').hidden,true);
  other.logout();assert.equal(other.btn('Добавить API-ключ').hidden,false);
});

test('ошибка проверки и поздний ответ прежнего аккаунта не скрывают первичную настройку',async()=>{
  const h=fixture({manualStatus:true});h.connect();await env.settle();
  failure(h.statusRequests[0],500);await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,false);
  h.w.Tutor.close();h.w.Tutor.open();await env.settle();const old=h.statusRequests[1];
  h.logout();h.connect('other');await env.settle();settingsAnswer(old,true);settingsAnswer(h.statusRequests[2],false);await env.settle();
  assert.equal(h.btn('Добавить API-ключ').hidden,false);
});

test('настройки сохраняют ключ только через Firebase, очищают поле и получают лишь статус на другом устройстве',async()=>{
  const h=fixture();h.connect();h.w.Tutor.open(true);await env.settle();
  assert.match(h.statusRequests[0].url,/\/tutorSettings$/);assert.equal(JSON.parse(h.statusRequests[0].opts.body).data.action,'status');
  const field=h.nodes.find(n=>n.tag==='input'),key='sk-only-test-settings-not-real';field.value=key;
  h.cls('tutor-key-form').onsubmit({preventDefault(){}});
  assert.equal(field.value,'');await env.settle();
  const r=h.requests[0];assert.match(r.url,/\/tutorSettings$/);
  assert.deepEqual(JSON.parse(r.opts.body),{data:{action:'save',key}});
  assert.doesNotMatch(JSON.stringify(h.w.localStorage._dump()),/sk-only-test/);
  settingsAnswer(r,true);await env.settle();assert.match(h.cls('tutor-key-status muted').textContent,/Ключ сохранён/);
  h.w.Tutor.close();h.w.Tutor.open();h.btn('Объясни проще').onclick();await env.settle();
  assert.doesNotMatch(h.requests[1].opts.body,/sk-only-test/);answer(h.requests[1],'Пояснение');await env.settle();
  const other=fixture({configured:true});other.connect();other.w.Tutor.open();await env.settle();
  assert.equal(other.nodes.find(n=>n.tag==='input').value,'');assert.match(other.cls('tutor-key-status muted').textContent,/Ключ сохранён/);
});

test('ошибка сохранения и смена аккаунта не возвращают ключ в поле или статус',async()=>{
  const h=fixture(),field=h.nodes.find(n=>n.tag==='input');field.value='sk-only-test-settings-not-real';
  h.cls('tutor-key-form').onsubmit({preventDefault(){}});assert.equal(h.requests.length,0);
  h.connect();await env.settle();field.value='sk-only-test-settings-not-real';h.cls('tutor-key-form').onsubmit({preventDefault(){}});await env.settle();
  failure(h.requests[0],500);await env.settle();assert.equal(field.value,'');assert.doesNotMatch(h.cls('tutor-key-status muted').textContent,/sk-only-test/);
  field.value='sk-only-test-new-key-not-real';h.cls('tutor-key-form').onsubmit({preventDefault(){}});await env.settle();
  const old=h.requests[1];h.logout();settingsAnswer(old,true);await env.settle();
  assert.equal(field.value,'');assert.equal(old.opts.signal.aborted,true);assert.equal(h.cls('tutor-key-status muted').textContent,'');
});
