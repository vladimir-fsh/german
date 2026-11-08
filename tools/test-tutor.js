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
  const w=env.load(['js/progress-data.js','js/srs-config.js','js/sync.js','js/word-explanations.js','js/tutor-context.js','js/tutor-request.js','js/tutor-gateway.js','js/tutor-session.js','js/tutor.js']);
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
  const app=node('main'),bar=node('nav'),chatTab=node('button');chatTab.textContent='Чат';chatTab.className='tab';
  w.document.getElementById=id=>({'app':app,'tabbar':bar,'tutor-tab':chatTab})[id]||null;
  w.innerHeight=844; w.AbortController=AbortController;
  const timers=[]; w.setTimeout=fn=>{timers.push(fn);return fn};w.clearTimeout=()=>{};
  const requests=[],statusRequests=[],saves=[],keys=new Map();let revision=1;
  if(options.configured)keys.set('owner',{key:'sk-test-browser-personal-key',revision:'1'});
  w.fetch=(url,opts)=>new Promise((resolve,reject)=>requests.push({url,opts,resolve,reject}));
  let user=null,generation=0;const listeners=[];
  w.Cloud={status:()=>({user}),config:()=>({projectId:'german-test'}),onChange:fn=>{listeners.push(fn);fn({user})},
    tutorSession:()=>{
      if(!user)return Promise.reject(Error('Войдите через Google'));
      const uid=user.uid,version=generation,current=()=>!!user&&user.uid===uid&&generation===version;
      return Promise.resolve({uid,projectId:'german-test',current,key:(action,key,signal)=>{
        if(action==='read')return Promise.resolve({...keys.get(uid),configured:keys.has(uid)});
        if(action==='status'){
          const item={uid,action,signal};statusRequests.push(item);
          if(options.manualStatus)return new Promise((resolve,reject)=>Object.assign(item,{resolve,reject}));
          return Promise.resolve({configured:keys.has(uid),revision:keys.get(uid)?.revision});
        }
        return new Promise((resolve,reject)=>saves.push({uid,key,signal,resolve:()=>{
          if(current()&&!signal?.aborted)keys.set(uid,{key,revision:String(++revision)});
          resolve({configured:true});
        },reject}));
      }});
    }};
  w.location={hash:''};
  w.Tutor.init(); w.Tutor.setContext('word:a',()=>({type:'word',title:'anspruchsvoll',word:'anspruchsvoll'}));
  chatTab.onclick();
  const cls=c=>nodes.find(n=>n.className===c), btn=text=>nodes.find(n=>n.tag==='button'&&n.textContent===text);
  const submit=()=>cls('tutor-compose').onsubmit({preventDefault(){}});
  function connect(uid='owner') {generation++;user={uid,email:uid+'@example.invalid'};listeners.forEach(fn=>fn({user}));}
  function logout(){generation++;user=null;listeners.forEach(fn=>fn({user}));}
  return {w,nodes,requests,statusRequests,saves,keys,timers,cls,btn,submit,connect,logout,app,bar,chatTab,question:nodes.find(n=>n.tag==='textarea')};
}
function answer(r,text) {r.resolve({ok:true,status:200,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]})})}
function failure(r,status) {r.resolve({ok:false,status,json:async()=>({error:{message:'private upstream error'}})})}

test('после любой подсказки обе команды исчезают до новой беседы, закрытие их не возвращает',async()=>{
  for(const label of ['Объясни проще','Разбери на части']){
    const h=fixture({configured:true});h.connect();await env.settle();h.btn(label).onclick();
    assert.equal(h.btn('Объясни проще').hidden,true);assert.equal(h.btn('Разбери на части').hidden,true);
    assert.equal(h.cls('tutor-quick').hidden,true);await env.settle();answer(h.requests[0],'Ответ');await env.settle();
    h.w.Tutor.close();h.chatTab.onclick();await env.settle();assert.equal(h.cls('tutor-quick').hidden,true);
    h.w.Tutor.setContext('word:b',()=>({type:'word',title:'bekommen'}));
    assert.equal(h.btn('Объясни проще').hidden,false);assert.equal(h.btn('Разбери на части').hidden,false);
  }
});

test('ответ сохраняется к исходному слову один раз, сохранение доступно снова после удаления',async()=>{
  const h=fixture({configured:true});h.connect();await env.settle();
  h.w.Tutor.setContext('word:a',()=>({type:'word',title:'anspruchsvoll',wordKey:'V:stable-word'}));
  h.btn('Объясни проще').onclick();await env.settle();answer(h.requests[0],'Anspruch + voll');await env.settle();
  h.btn('Сохранить объяснение').onclick();const notes=h.w.WordExplanations.list('V:stable-word');
  assert.equal(notes.length,1);assert.equal(notes[0].text,'Anspruch + voll');assert.equal(h.btn('Сохранено').disabled,true);
  h.w.WordExplanations.remove('V:stable-word',notes[0].id);
  assert.equal(h.nodes.filter(n=>n.tag==='button'&&n.textContent==='Сохранить объяснение').at(-1).disabled,false);
  assert.equal(h.w.WordExplanations.list('V:anspruchsvoll').length,0);
});

test('вкладка открывает чат поверх экрана без плавающей кнопки и сразу фокусирует вопрос',()=>{
  const h=fixture();
  assert.equal(h.cls('tutor-launcher'),undefined);assert.equal(h.chatTab.attrs['aria-expanded'],'true');
  assert.equal(h.w.location.hash,'');
  assert.equal(h.w.document.activeElement,h.question);
  assert.equal(h.cls('tutor-settings').hidden,true);assert.equal(h.cls('tutor-log').hidden,true);
  assert.equal(h.cls('tutor-footer').hidden,false);assert.equal(h.requests.length,0);
  h.question.value='Поясни это слово';h.question.oninput();h.w.Tutor.close();
  assert.equal(h.chatTab.attrs['aria-expanded'],'false');h.chatTab.onclick();
  assert.equal(h.question.value,'Поясни это слово');assert.equal(h.w.document.activeElement,h.question);
  h.btn('Добавить API-ключ').onclick();assert.equal(h.cls('tutor-settings').hidden,false);assert.equal(h.cls('tutor-footer').hidden,true);
  assert.notEqual(h.w.document.activeElement,h.question);
  h.btn('К чату').onclick();assert.equal(h.w.document.activeElement,h.question);
});

test('панель следует за видимой областью при открытии клавиатуры и возвращает прокрутку при закрытии',()=>{
  const h=fixture();h.w.visualViewport={height:430,offsetTop:14};h.w._fire('resize');
  const overlay=h.cls('tutor-overlay');
  assert.equal(overlay.style.height,'430px');assert.equal(overlay.style.top,'14px');
  assert.equal(overlay.classList.contains('keyboard-open'),true);
  h.w.visualViewport.height=844;h.w.visualViewport.offsetTop=0;h.w._fire('resize');
  assert.equal(overlay.style.height,'844px');assert.equal(overlay.style.top,'0px');
  assert.equal(overlay.classList.contains('keyboard-open'),false);
  h.w.Tutor.close();assert.equal(overlay.hidden,true);assert.equal(h.app.inert,false);assert.equal(h.bar.inert,false);
});

test('адресная строка и увеличение страницы не убирают безопасный нижний отступ',()=>{
  const h=fixture(),overlay=h.cls('tutor-overlay');
  h.w.visualViewport={height:780,offsetTop:0,scale:1};h.w._fire('resize');
  assert.equal(overlay.classList.contains('keyboard-open'),false);
  h.w.visualViewport={height:422,offsetTop:0,scale:2};h.w._fire('resize');
  assert.equal(overlay.classList.contains('keyboard-open'),false);
  // Некоторые браузеры уменьшают innerHeight вместе с клавиатурой.
  h.w.innerHeight=430;h.w.document.documentElement.clientHeight=844;
  h.w.visualViewport={height:430,offsetTop:0,scale:1};h.w._fire('resize');
  assert.equal(overlay.classList.contains('keyboard-open'),true);
});

test('без входа запросов нет; личный ключ идёт только в заголовок OpenAI, контекст и история берутся с экрана',async()=>{
  const h=fixture({configured:true});h.question.value='Поясни';h.submit();assert.equal(h.requests.length,0);
  h.connect();await env.settle();h.btn('Разбери на части').onclick();h.btn('Разбери на части').onclick();await env.settle();
  assert.equal(h.requests.length,1);const r=h.requests[0],body=JSON.parse(r.opts.body);
  assert.equal(r.url,'https://api.openai.com/v1/responses');assert.equal(r.opts.headers.Authorization,'Bearer sk-test-browser-personal-key');
  assert.equal(r.opts.credentials,'omit');assert.match(body.input[0].content,/anspruchsvoll/);
  assert.doesNotMatch(r.opts.body,/sk-test-browser|firebase-test-id-token/);
  answer(r,'Anspruch + voll');await env.settle();assert.match(h.cls('tutor-log').textContent,/Anspruch \+ voll/);
  h.question.value='А что значит Anspruch?';h.submit();await env.settle();
  assert.ok(JSON.parse(h.requests[1].opts.body).input.some(m=>m.role==='assistant'&&m.content==='Anspruch + voll'));
  answer(h.requests[1],'Притязание');await env.settle();h.w.Tutor.close();assert.equal(h.app.inert,false);
});

test('быстрая команда сохраняет фрагмент после ошибки, отмена и тайм-аут возвращают вопрос',async()=>{
  const h=fixture({configured:true});h.connect();h.question.value='anspruchsvoll';h.btn('Разбери на части').onclick();await env.settle();
  assert.match(JSON.parse(h.requests[0].opts.body).input.at(-1).content,/Ученик уточнил.*anspruchsvoll/);
  failure(h.requests[0],429);await env.settle();assert.equal(h.question.value,'anspruchsvoll');
  assert.match(h.cls('tutor-status').textContent,/лимит/);
  h.submit();await env.settle();h.submit();assert.equal(h.requests[1].opts.signal.aborted,true);
  answer(h.requests[1],'Отменённый ответ');await env.settle();assert.equal(h.question.value,'anspruchsvoll');
  h.submit();await env.settle();h.timers.at(-1)();answer(h.requests[2],'Поздний ответ');await env.settle();
  assert.match(h.cls('tutor-status').textContent,/слишком много времени/);
});

test('ключ сохраняется в Firebase один раз, команды появляются после подтверждения и на другом устройстве',async()=>{
  const h=fixture();h.connect();await env.settle();h.btn('Добавить API-ключ').onclick();await env.settle();
  const field=h.nodes.find(n=>n.tag==='input');field.value='sk-test-save-in-firebase';h.cls('tutor-key-form').onsubmit({preventDefault(){}});
  assert.equal(field.value,'');await env.settle();assert.equal(h.requests.length,0);assert.equal(h.saves[0].key,'sk-test-save-in-firebase');
  h.saves[0].resolve();await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,true);
  assert.equal(h.cls('tutor-settings').hidden,true);assert.equal(h.btn('Объясни проще').hidden,false);
  assert.doesNotMatch(JSON.stringify(h.w.localStorage._dump()),/sk-test-save/);
  h.w.Tutor.close();h.chatTab.onclick();await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,true);
  const other=fixture({configured:true});other.connect();await env.settle();assert.equal(other.btn('Добавить API-ключ').hidden,true);
  other.logout();assert.equal(other.btn('Добавить API-ключ').hidden,false);
});

test('неверный ключ снова открывает добавление, новый ключ заменяет его без перезагрузки',async()=>{
  const h=fixture({configured:true});h.connect();await env.settle();h.btn('Объясни проще').onclick();await env.settle();
  failure(h.requests[0],401);await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,false);
  h.btn('Добавить API-ключ').onclick();await env.settle();assert.equal(h.cls('tutor-settings').hidden,false);
  const field=h.nodes.find(n=>n.tag==='input');field.value='sk-test-replacement-key';h.cls('tutor-key-form').onsubmit({preventDefault(){}});await env.settle();
  h.saves[0].resolve();await env.settle();assert.equal(h.btn('Добавить API-ключ').hidden,true);
  h.question.value='Поясни';h.submit();await env.settle();assert.equal(h.requests[1].opts.headers.Authorization,'Bearer sk-test-replacement-key');
  answer(h.requests[1],'Ответ');await env.settle();
});

test('ошибка записи и смена аккаунта не возвращают ключ в поле, поздний статус не открывает чужую настройку',async()=>{
  const h=fixture({manualStatus:true});h.connect();await env.settle();h.statusRequests[0].resolve({configured:false});await env.settle();
  h.btn('Добавить API-ключ').onclick();await env.settle();h.statusRequests[1].resolve({configured:false});await env.settle();
  const field=h.nodes.find(n=>n.tag==='input');field.value='sk-test-failed-storage';h.cls('tutor-key-form').onsubmit({preventDefault(){}});await env.settle();
  h.saves[0].reject(Error('Не удалось сохранить ключ в Firebase.'));await env.settle();assert.equal(field.value,'');
  assert.doesNotMatch(h.cls('tutor-key-status muted').textContent,/sk-test/);
  h.w.Tutor.close();h.chatTab.onclick();await env.settle();const old=h.statusRequests[2];
  h.logout();h.connect('other');await env.settle();old.resolve({configured:true});h.statusRequests[3].resolve({configured:false});await env.settle();
  assert.equal(h.btn('Добавить API-ключ').hidden,false);assert.equal(field.value,'');
});
