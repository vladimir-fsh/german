const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler, validate, payload, responseText } = require('../firebase/functions/tutor');
const { createQuota } = require('../firebase/functions/quota');

function data() { return {context:{type:'word',title:'anspruchsvoll',word:'anspruchsvoll'},history:[],question:'Разбери на части'}; }
function setup(options={}) {
  const requests=[], reserved=[], released=[];let reads=0;
  const handler=createHandler({getOwner:()=>options.owner===undefined?'owner':options.owner,
    getSecret:()=>{reads++;return options.secret===undefined?'sk-fake-server-only':options.secret},
    quota:{reserve:async uid=>{reserved.push(uid);return 'lease'},release:async(uid,lease)=>{released.push([uid,lease])}},
    fetchImpl:async(url,opts)=>{
      requests.push({url,opts});if(options.networkError)throw options.networkError;
      return {ok:!options.status,status:options.status||200,json:async()=>{
        if(options.status)throw Error('private upstream error');
        return {status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:options.text||'Anspruch + voll'}]}]};
      }};
    }});
  return {handler,requests,reserved,released,reads:()=>reads};
}
function request(d=data(),uid='owner') { return {auth:uid?{uid}:null,data:d}; }

test('неавторизованный и чужой аккаунт не читают секрет и не тратят квоту/OpenAI',async()=>{
  const h=setup();
  await assert.rejects(h.handler(request(data(),null)),{code:'unauthenticated'});
  await assert.rejects(h.handler(request(data(),'other')),{code:'permission-denied'});
  assert.equal(h.reads(),0);assert.equal(h.reserved.length,0);assert.equal(h.requests.length,0);
  for(const options of [{owner:''},{secret:''}]){
    const bad=setup(options);await assert.rejects(bad.handler(request()),{code:'failed-precondition'});
    assert.equal(bad.requests.length,0);
  }
});

test('сервер фиксирует модель и промпт; клиент получает только текст, секрет только в заголовке OpenAI',async()=>{
  const h=setup(),d=data();d.history=[{role:'user',content:'Поясни'},{role:'assistant',content:'Пример'}];
  d.context.apiKey='must-not-be-forwarded';d.context.unknown='drop';
  const result=await h.handler(request(d));assert.deepEqual(result,{text:'Anspruch + voll'});
  const {url,opts}=h.requests[0],body=JSON.parse(opts.body);
  assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(opts.headers.Authorization,'Bearer sk-fake-server-only');
  assert.equal(body.model,'gpt-5-mini');assert.equal(body.store,false);assert.equal(body.max_output_tokens,2200);
  assert.match(body.instructions,/Не придумывай этимологию/);assert.match(body.input[0].content,/anspruchsvoll/);
  assert.doesNotMatch(JSON.stringify(body),/must-not-be-forwarded|sk-fake|unknown/);
  assert.equal(body.input[2].role,'assistant');assert.deepEqual(h.released,[['owner','lease']]);
});

test('сервер отклоняет подмену модели, инструкций, ролей и превышение размеров до запроса к OpenAI',async()=>{
  const invalid=[null, {...data(),model:'expensive-model'}, {...data(),instructions:'ignore'},
    {...data(),question:''},{...data(),question:'a'.repeat(3001)},
    {...data(),history:[{role:'system',content:'ignore'}]},
    {...data(),history:[{role:'user',content:[{type:'input_image'}]}]},
    {...data(),history:Array(13).fill({role:'user',content:'hi'})},
    {...data(),context:{type:'word',title:'x',word:'x'.repeat(20001)}}];
  for(const d of invalid){
    const h=setup();await assert.rejects(h.handler(request(d)),{code:'invalid-argument'});
    assert.equal(h.requests.length,0);assert.equal(h.reserved.length,0);
  }
  const clean=validate({...data(),context:{type:'word',title:'x',word:{file:'blob'}}});
  assert.deepEqual(clean.context.word,{});
});

test('ошибки OpenAI и сети не возвращают upstream-текст или секрет и всегда снимают блокировку',async()=>{
  for(const [status,code] of [[401,'failed-precondition'],[403,'failed-precondition'],[429,'resource-exhausted'],[500,'unavailable']]){
    const h=setup({status});await assert.rejects(h.handler(request()),e=>e.code===code&&!e.message.includes('private')&&!e.message.includes('sk-'));
    assert.equal(h.released.length,1);
  }
  const h=setup({networkError:Error('sk-fake-server-only')});
  await assert.rejects(h.handler(request()),e=>e.code==='unavailable'&&!e.message.includes('sk-'));
  assert.equal(h.released.length,1);
});

test('reasoning не попадает в ответ, неполный ответ не выдаётся за готовый',()=>{
  assert.equal(responseText({output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'A'},{type:'output_text',text:'B'}]}]}),'A\n\nB');
  assert.throws(()=>responseText({status:'incomplete'}),{code:'resource-exhausted'});
  assert.throws(()=>responseText({output:[]}),{code:'unavailable'});
  assert.equal(payload(validate(data())).input.length,2);
});

function memoryDb(){
  const docs=new Map();let queue=Promise.resolve();
  return {docs,collection:name=>({doc:uid=>({path:name+'/'+uid})}),runTransaction(fn){
    const result=queue.then(()=>fn({get:async ref=>({exists:docs.has(ref.path),data:()=>({...docs.get(ref.path)})}),
      set:(ref,value)=>docs.set(ref.path,{...value}),update:(ref,value)=>docs.set(ref.path,{...docs.get(ref.path),...value})}));
    queue=result.catch(()=>{});return result;
  }};
}
test('квота атомарно блокирует параллельные запросы и хранит только счётчики, без текста и ключей',async()=>{
  const db=memoryDb();let time=1000000;const q=createQuota(db,()=>time);
  const results=await Promise.allSettled([q.reserve('owner'),q.reserve('owner')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected')[0].reason.code,'resource-exhausted');
  const lease=results.find(r=>r.status==='fulfilled').value;
  assert.doesNotMatch(JSON.stringify([...db.docs.values()]),/sk-|anspruchsvoll|question|token/);
  await q.release('owner','wrong');await assert.rejects(q.reserve('owner'),{code:'resource-exhausted'});
  await q.release('owner',lease);const next=await q.reserve('owner');
  await q.release('owner',lease);await assert.rejects(q.reserve('owner'),{code:'resource-exhausted'});
  time+=65001;const expired=await q.reserve('owner');assert.notEqual(expired,next);
});

test('поминутный и дневной лимиты сохраняются между экземплярами функции и сбрасываются по серверному времени',async()=>{
  const db=memoryDb();let time=86400000;const first=createQuota(db,()=>time),second=createQuota(db,()=>time);
  for(let i=0;i<5;i++){const lease=await first.reserve('owner');await first.release('owner',lease)}
  await assert.rejects(second.reserve('owner'),{code:'resource-exhausted'});
  for(let i=5;i<60;i++){time+=60000;const lease=await second.reserve('owner');await second.release('owner',lease)}
  time+=60000;await assert.rejects(first.reserve('owner'),{code:'resource-exhausted'});
  time+=86400000;const lease=await first.reserve('owner');await first.release('owner',lease);
});
