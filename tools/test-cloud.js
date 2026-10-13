const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');
const files = ['js/progress-data.js', 'js/srs-config.js', 'js/sync.js', 'js/practice.js', 'js/sessions.js'];
function client(options) { return env.load(files, options); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }

test('общий снимок и ответы двух устройств сходятся; повторная доставка не меняет результат', () => {
  const a = client(), b = client();
  a.Store.mutate('answer', { ok: true });
  a.Store.mutate('wordHint', { key: 'G:nachvollziehen', text: 'Следуй мысленно за мыслью.' });
  const seed = a.Store.cloudSeed('project:user:seed');
  a.Store.attachCloud(seed); b.Store.attachCloud(seed);
  assert.equal(b.Store.state().totalTried, 1);
  assert.equal(b.Store.state().wordHints['G:nachvollziehen'], 'Следуй мысленно за мыслью.');
  a.Store.mutate('answer', { ok: false }); b.Store.mutate('answer', { ok: true });
  const ao = a.Store.cloudOperations(), bo = b.Store.cloudOperations();
  a.Store.mergeCloud(bo); b.Store.mergeCloud(ao);
  assert.deepEqual(copy(a.Store.state()), copy(b.Store.state()));
  assert.equal(a.Store.state().totalTried, 3); assert.equal(a.Store.state().totalCorrect, 2);
  a.Store.mergeCloud(bo); assert.equal(a.Store.state().totalTried, 3);
  const disk = copy(a.localStorage._dump()), reload = client({ storage: disk });
  reload.Store.attachCloud(seed); reload.Store.mergeCloud(bo);
  assert.deepEqual(copy(reload.Store.state()), copy(a.Store.state()));
});

test('ответ, сделанный во время загрузки исходного снимка, сохраняется', () => {
  const a = client(); a.Store.mutate('answer', { ok: true });
  const seed = a.Store.cloudSeed('project:user:seed');
  a.Store.mutate('answer', { ok: false });
  a.Store.attachCloud(seed);
  assert.equal(a.Store.state().totalTried, 2);
  assert.equal(a.Store.cloudOperations().length, 1);
});

test('разные исходные данные и другой аккаунт не заменяют местный прогресс', () => {
  const a = client(), b = client(); a.Store.mutate('answer', { ok: true }); b.Store.mutate('answer', { ok: false });
  const before = b.Store.exportBackup(), seed = a.Store.cloudSeed('project:user:seed');
  assert.throws(() => b.Store.attachCloud(seed), /разный начальный/);
  assert.equal(JSON.parse(b.Store.exportBackup()).state.totalCorrect, JSON.parse(before).state.totalCorrect);
  a.Store.attachCloud(seed);
  const other = copy(seed); other.cloudId = 'project:other:seed';
  assert.throws(() => a.Store.attachCloud(other), /другим облачным/);
});

test('повреждение или подмена ответа проверяется целиком до записи', () => {
  const a = client(), b = client(); a.Store.mutate('answer', { ok: true });
  const ops = a.Store.cloudOperations(); b.Store.mergeCloud(ops);
  const changed = copy(ops); changed[0].ok = false;
  assert.throws(() => b.Store.mergeCloud(changed), /разные данные/);
  const invalid = copy(ops); invalid.push({ type: 'made-up' });
  assert.throws(() => b.Store.mergeCloud(invalid));
  assert.equal(b.Store.state().totalCorrect, 1); assert.equal(b.Store.state().totalTried, 1);
  const seed = a.Store.cloudSeed('project:user:seed'); seed.state.wordHints = { constructor: 'bad' };
  assert.throws(() => b.Store.attachCloud(seed));
});

test('облачный снимок и журнал не содержат ключа OpenAI, тему и авторизацию', () => {
  const a = client(); const secret = 'sk-fake-secret-not-a-credential';
  a.localStorage.setItem('de-openai-settings-v1', JSON.stringify({ key: secret }));
  a.localStorage.setItem('de-firebase-auth-v1', secret);
  const seed = a.Store.cloudSeed('project:user:seed');
  assert.ok(!JSON.stringify(seed).includes(secret)); assert.ok(!JSON.stringify(a.Store.cloudOperations()).includes(secret));
});

test('подключение на новом устройстве обновляет снимок соседней вкладки с более поздними местными часами', () => {
  const source = client(); source.Store.mutate('answer', { ok: true });
  const seed = source.Store.cloudSeed('project:user:seed'); seed.at = 1;
  const storage = env.makeStorage(), a = client({localStorage: storage}), b = client({localStorage: storage});
  a.Store.attachCloud(seed);
  b._fire('storage', { key: 'de-b1-snapshot-v1' });
  assert.equal(b.Store.state().totalCorrect, 1);
  b.Store.mutate('answer', {ok: false});
  a._fire('storage', {key: 'de-b1-oplog-v2:' + b.Store.device});
  assert.equal(a.Store.state().totalTried, 2);
});

/* Подставной Firestore проверяет сам транспорт без сети и настоящих аккаунтов. */
function fakeFirestore() {
  const docs = new Map(), watches = new Map(); let fail = false;
  function changes(prefix) {
    const entries = [...docs].filter(([key]) => key.startsWith(prefix + '/') && !key.slice(prefix.length+1).includes('/'));
    function read(value) { const data=copy(value);if(data.updatedAt!=null)data.updatedAt={toMillis:()=>1};return data; }
    const snapshot = {docChanges:()=>entries.map(([key,value])=>({type:'added',doc:{id:key.split('/').at(-1),data:()=>read(value)}})),forEach:fn=>entries.forEach(([key,value])=>fn({id:key.split('/').at(-1),data:()=>read(value)}))};
    return snapshot;
  }
  function notify() { watches.forEach((fns,prefix)=>fns.forEach(fn=>queueMicrotask(()=>fn(changes(prefix))))); }
  function ref(key) {
    return {path:key,collection:name=>collection(key+'/'+name),get:()=>Promise.resolve({exists:docs.has(key),data:()=>copy(docs.get(key))}),set:value=>{
      if(fail)return Promise.reject({code:'unavailable'});docs.set(key,copy(value));notify();return Promise.resolve();
    }};
  }
  function collection(prefix) {return {doc:id=>ref(prefix+'/'+id),get:()=>Promise.resolve(changes(prefix)),onSnapshot:fn=>{
    const fns=watches.get(prefix)||new Set();fns.add(fn);watches.set(prefix,fns);queueMicrotask(()=>fn(changes(prefix)));return ()=>fns.delete(fn);
  }};}
  const db={collection,runTransaction:async fn=>{
    const pending=[]; const result=await fn({get:r=>r.get(),set:(r,v)=>pending.push([r.path,copy(v)])});
    if(fail)throw {code:'unavailable'};pending.forEach(([k,v])=>docs.set(k,v));notify();return result;
  },batch:()=>{const pending=[];return {set:(r,v)=>pending.push([r.path,copy(v)]),commit:()=>{
    if(fail)return Promise.reject({code:'unavailable'});
    pending.forEach(([k,v])=>{if(docs.has(k)&&JSON.stringify(docs.get(k))!==JSON.stringify(v))throw {code:'permission-denied'};docs.set(k,v)});notify();return Promise.resolve();
  }}}};
  return {db,docs,setFail:value=>{fail=value}};
}
function transport(backend, uid='test-user') {
  const win=client(), callbacks=[];let current=null;
  const auth={onAuthStateChanged:fn=>{callbacks.push(fn);queueMicrotask(()=>fn(current))},signInWithPopup:()=>{current={uid,email:'test@example.invalid'};callbacks.forEach(fn=>fn(current));return Promise.resolve()},signOut:()=>{current=null;callbacks.forEach(fn=>fn(null));return Promise.resolve()}};
  win.firebase={initializeApp:()=>({auth:()=>auth,firestore:()=>backend.db}),auth:{GoogleAuthProvider:function(){this.setCustomParameters=()=>{}}},firestore:{FieldValue:{serverTimestamp:()=>1}}};
  win.FIREBASE_CONFIG={apiKey:'AIzaFakePublicConfig',projectId:'german-test',authDomain:'german-test.firebaseapp.com',appId:'1:123:web:abc'};
  const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/cloud.js'),'utf8'),win);
  return win;
}

test('транспорт сохраняет источник, два устройства, подсказки и черновики без ключа; офлайн-ответ доходит после повтора', async () => {
  const db=fakeFirestore(), a=transport(db), b=transport(db);
  a.localStorage.setItem('de-openai-settings-v1','sk-fake-private-key');
  a.Store.mutate('answer',{ok:true});
  a.Cloud.start();b.Cloud.start();await a.Cloud.init();await b.Cloud.init();
  assert.equal(db.docs.size,0);await a.Cloud.signIn();await b.Cloud.signIn();assert.equal(db.docs.size,0);
  try {
    await a.Cloud.connect();await b.Cloud.connect();await env.settle();
    assert.equal(b.Store.state().totalCorrect,1);
    a.Store.mutate('answer',{ok:false});b.Store.mutate('wordHint',{key:'G:nachvollziehen',text:'Мысленно пройди тот же путь.'});
    await a.Cloud.sync();await b.Cloud.sync();await env.settle();
    assert.equal(b.Store.state().totalTried,2);assert.equal(a.Store.state().wordHints['G:nachvollziehen'],'Мысленно пройди тот же путь.');
    assert.ok(!JSON.stringify([...db.docs]).includes('sk-fake-private-key'));
    db.setFail(true);a.Store.mutate('answer',{ok:true});
    await assert.rejects(a.Cloud.sync(),/Нет связи/);assert.equal(a.Store.state().totalTried,3);
    db.setFail(false);await a.Cloud.sync();await env.settle();assert.equal(b.Store.state().totalTried,3);
    const backups=await b.Cloud.deviceBackups();assert.equal(backups.length,1);
    assert.ok(backups[0].data.sessions);assert.ok(backups[0].data.drafts);
  } finally {await a.Cloud.signOut();await b.Cloud.signOut();}
});

test('вход в другой аккаунт не отправляет ему чужой локальный прогресс', async () => {
  const db=fakeFirestore(), a=transport(db,'alice');await a.Cloud.init();await a.Cloud.signIn();await a.Cloud.connect();await a.Cloud.signOut();
  const original=copy(a.localStorage._dump()), b=transport(db,'bob');
  Object.keys(original).filter(key=>key.startsWith('de-b1-')).forEach(key=>b.localStorage.setItem(key,original[key]));
  /* Перезагрузка поднимает связанное состояние с диска. */
  const b2=transport(db,'bob');b2.Store.attachCloud(JSON.parse([...db.docs].find(([key])=>key==='users/alice/german/seed')[1].payload));
  await b2.Cloud.init();await b2.Cloud.signIn();
  try {await assert.rejects(b2.Cloud.connect(),/другим облачным аккаунтом/);assert.ok(![...db.docs.keys()].some(key=>key.startsWith('users/bob/')))}
  finally {await b2.Cloud.signOut();}
});
