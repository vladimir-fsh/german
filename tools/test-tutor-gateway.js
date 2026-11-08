const test=require('node:test');
const assert=require('node:assert/strict');
const env=require('./env.js');

function fixture() {
  const w=env.load(['js/tutor-request.js','js/tutor-gateway.js']);
  let active=true,key='sk-test-private-browser-key';const requests=[];
  const session={uid:'owner',projectId:'german-test',current:()=>active,
    key:async()=>({configured:true,key,revision:'1'})};
  w.Cloud={status:()=>({user:active?{uid:'owner'}:null}),tutorSession:()=>Promise.resolve(session)};
  w.fetch=(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));
  return {w,requests,session,setKey:value=>{key=value},logout:()=>{active=false},
    ask:signal=>w.TutorGateway.request({type:'word',title:'anspruchsvoll'},[],'Поясни',signal)};
}
const response=text=>({ok:true,status:200,json:async()=>({output:[{type:'message',content:[{type:'output_text',text}]}]})});

test('ошибки OpenAI не показывают тело ответа провайдера и ключ',async()=>{
  for(const [status,code] of [[401,'API_KEY_REJECTED'],[403,'FORBIDDEN'],[404,'MODEL_UNAVAILABLE'],[429,'QUOTA'],[500,'UNAVAILABLE']]){
    const h=fixture(),pending=h.ask();await env.settle();let reads=0;
    h.requests[0].resolve({ok:false,status,json:async()=>{reads++;return {error:{message:'sk-private-upstream'}}}});
    await assert.rejects(pending,e=>e.code===code&&!e.message.includes('sk-'));assert.equal(reads,0);
  }
});

test('отмена во время загрузки ключа не отправляет запрос OpenAI',async()=>{
  const h=fixture(),controller=new AbortController();let finish;
  h.session.key=()=>new Promise(resolve=>{finish=resolve});
  const pending=h.ask(controller.signal);await env.settle();controller.abort();finish({configured:true,key:'sk-test-cancelled-key'});
  await assert.rejects(pending,{name:'AbortError'});assert.equal(h.requests.length,0);
});

test('смена аккаунта при разборе ответа не возвращает прежний текст',async()=>{
  const h=fixture(),pending=h.ask();await env.settle();let finish;
  h.requests[0].resolve({ok:true,status:200,json:()=>new Promise(resolve=>{finish=resolve})});await env.settle();h.logout();
  finish({output:[{type:'message',content:[{type:'output_text',text:'Чужой ответ'}]}]});
  await assert.rejects(pending,{name:'AbortError'});
});

test('каждый запрос читает актуальный ключ, отсутствие ключа не обращается к OpenAI',async()=>{
  const h=fixture();let pending=h.ask();await env.settle();h.requests[0].resolve(response('Первый'));await pending;
  h.setKey('sk-test-replaced-on-other-device');pending=h.ask();await env.settle();
  assert.equal(h.requests[1].options.headers.Authorization,'Bearer sk-test-replaced-on-other-device');
  assert.doesNotMatch(h.requests[1].options.body,/sk-test/);h.requests[1].resolve(response('Второй'));await pending;
  h.session.key=async()=>({configured:false,key:''});await assert.rejects(h.ask(),{code:'API_KEY_REQUIRED'});
  assert.equal(h.requests.length,2);
});
