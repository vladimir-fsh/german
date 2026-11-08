const test = require('node:test');
const assert = require('node:assert/strict');
const {createKeyStore,createSettingsHandler}=require('../firebase/functions/key-store');
const {createHandler}=require('../firebase/functions/tutor');

function setup(options={}){
  const docs=new Map(),versions=new Map(),calls=[],reserved=[],released=[];let number=0;
  const secrets={getProjectId:async()=> 'german-test',
    addSecretVersion:async req=>{calls.push('add');if(options.secretFail)throw Error('private '+req.payload.data.toString());
      const name='projects/123456/secrets/OPENAI_API_KEY/versions/'+(++number);versions.set(name,req.payload.data.toString());return [{name}];},
    accessSecretVersion:async req=>{calls.push(req.name);return [{payload:{data:Buffer.from(versions.get(req.name)||'')}}]}};
  const db={collection:name=>({doc:uid=>({get:async()=>({exists:docs.has(name+'/'+uid),data:()=>docs.get(name+'/'+uid)}),
    set:async value=>{if(options.metaFail)throw Error('metadata unavailable');docs.set(name+'/'+uid,value)}})})};
  const store=createKeyStore({secrets,db,timestamp:()=>123});
  const quota={reserve:async uid=>{reserved.push(uid);return 'lease'},release:async(...args)=>released.push(args)};
  const handler=createSettingsHandler({getOwner:()=> 'owner',store,quota});
  return {docs,versions,calls,store,handler,quota,reserved,released,options};
}
function req(action,key,uid='owner'){return {auth:uid?{uid}:null,data:action==='status'?{action}:{action,key}}}

test('сохранение доступно только владельцу; статус никогда не возвращает ключ',async()=>{
  const h=setup();await assert.rejects(h.handler(req('save','sk-test-owner-only-key',null)),{code:'unauthenticated'});
  await assert.rejects(h.handler(req('save','sk-test-owner-only-key','other')),{code:'permission-denied'});
  assert.equal(h.calls.length,0);assert.equal(h.reserved.length,0);
  assert.deepEqual(await h.handler(req('status')),{configured:false});
  const result=await h.handler(req('save','sk-test-owner-only-key'));
  assert.deepEqual(result,{configured:true});assert.deepEqual(await h.handler(req('status')),{configured:true});
  assert.doesNotMatch(JSON.stringify(result)+JSON.stringify([...h.docs.values()]),/sk-test/);
  assert.equal([...h.versions.values()][0],'sk-test-owner-only-key');assert.deepEqual(h.released,[['owner','lease']]);
});

test('замена ключа сразу используется чатом по точной версии, без latest, кэша или повторного deploy',async()=>{
  const h=setup(),seen=[];
  const chat=createHandler({getOwner:()=> 'owner',getSecret:uid=>h.store.read(uid),quota:h.quota,
    fetchImpl:async(url,opts)=>{seen.push(opts.headers.Authorization);return {ok:true,status:200,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'Ответ'}]}]})}}});
  const ask=()=>chat({auth:{uid:'owner'},data:{context:{type:'word',title:'gut'},history:[],question:'Поясни'}});
  await assert.rejects(ask(),{code:'failed-precondition'});
  await h.handler(req('save','sk-first-test-key-only'));await ask();
  await h.handler(req('save','sk-second-test-key-only'));await ask();
  assert.deepEqual(seen,['Bearer sk-first-test-key-only','Bearer sk-second-test-key-only']);
  assert.ok(h.calls.includes('projects/123456/secrets/OPENAI_API_KEY/versions/2'));assert.ok(!h.calls.some(x=>x.includes('latest')));
});

test('при отказе Secret Manager или записи указателя старый ключ остаётся активным, ошибка не раскрывает ввод',async()=>{
  const h=setup();await h.handler(req('save','sk-old-test-key-only'));
  h.options.secretFail=true;
  await assert.rejects(h.handler(req('save','sk-new-private-test-key')),e=>e.code==='unavailable'&&!e.message.includes('sk-'));
  assert.equal(await h.store.read('owner'),'sk-old-test-key-only');
  h.options.secretFail=false;h.options.metaFail=true;
  await assert.rejects(h.handler(req('save','sk-new-private-test-key')),{code:'unavailable'});
  assert.equal(await h.store.read('owner'),'sk-old-test-key-only');assert.equal(h.released.length,3);
});

test('произвольный секрет, чтение значения и неверный ключ отклоняются без записи',async()=>{
  const h=setup();
  for(const d of [{action:'read'},{action:'save',key:'bad'},{action:'save',key:'sk-valid-test-only',secretName:'other'},
    {action:'status',key:'sk-valid-test-only'}]){
    await assert.rejects(h.handler({auth:{uid:'owner'},data:d}),{code:'invalid-argument'});
  }
  assert.equal(h.calls.length,0);assert.equal(h.reserved.length,0);
  h.docs.set('tutorSettings/owner',{version:'projects/other-project/secrets/OTHER_KEY/versions/1'});
  await assert.rejects(h.store.read('owner'),{code:'failed-precondition'});assert.equal(h.calls.length,0);
});
