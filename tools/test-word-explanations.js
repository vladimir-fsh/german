const test=require('node:test');
const assert=require('node:assert/strict');
const env=require('./env.js');
const FILES=['js/progress-data.js','js/srs-config.js','js/sync.js','js/word-explanations.js'];
const key='V:anspruchsvoll';

test('сохранение не меняет расписание, повторный клик не создаёт дубликат; объяснения входят в копию',()=>{
  const w=env.load(FILES),before=JSON.parse(JSON.stringify(w.Store.state()));
  w.WordExplanations.save(key,'Anspruch + voll');w.WordExplanations.save(key,'Anspruch + voll');
  w.WordExplanations.save(key,'Бытовой пример');assert.equal(w.WordExplanations.list(key).length,2);
  assert.equal(w.WordExplanations.list('L18:anspruchsvoll').length,0);
  assert.deepEqual(w.Store.state().vocab,before.vocab);assert.equal(w.Store.state().totalTried,before.totalTried);
  const restored=env.load(FILES);restored.Store.importBackup(w.Store.exportBackup());
  assert.equal(restored.WordExplanations.list(key).length,2);
  const reload=env.load(FILES,{storage:{...w.localStorage._dump()}});assert.equal(reload.WordExplanations.list(key).length,2);
});

test('два устройства сохраняют разные объяснения, удаление переживает повторную доставку и перезагрузку',()=>{
  const origin=env.load(FILES),seed=origin.Store.cloudSeed('notes-test'),a=env.load(FILES),b=env.load(FILES);
  a.Store.attachCloud(seed);b.Store.attachCloud(seed);
  a.WordExplanations.save(key,'Первое');b.WordExplanations.save(key,'Второе');
  a.Store.mergeCloud(b.Store.cloudOperations());b.Store.mergeCloud(a.Store.cloudOperations());
  assert.equal(a.WordExplanations.list(key).length,2);assert.deepEqual(JSON.parse(JSON.stringify(a.Store.state().wordExplanations)),JSON.parse(JSON.stringify(b.Store.state().wordExplanations)));
  const first=b.WordExplanations.list(key).find(x=>x.text==='Первое');b.WordExplanations.remove(key,first.id);
  a.Store.mergeCloud(b.Store.cloudOperations());a.Store.mergeCloud(b.Store.cloudOperations());
  assert.deepEqual(Array.from(a.WordExplanations.list(key),x=>x.text),['Второе']);
  const reloaded=env.load(FILES,{storage:{...a.localStorage._dump()}});assert.deepEqual(Array.from(reloaded.WordExplanations.list(key),x=>x.text),['Второе']);
  const reversed=a.Store._reduce(seed.state,a.Store.cloudOperations().slice().reverse());
  assert.deepEqual(reversed.wordExplanations,a.Store.state().wordExplanations);
});

test('удалённое объяснение не оживает от старой операции; повторное сохранение создаёт новую запись',()=>{
  const w=env.load(FILES);w.WordExplanations.save(key,'Текст');const first=w.WordExplanations.list(key)[0];
  const add=w.Store.cloudOperations().find(x=>x.type==='wordExplanationSave');
  w.WordExplanations.remove(key,first.id);assert.equal(w.WordExplanations.list(key).length,0);
  const ops=w.Store.cloudOperations();assert.equal(w.Store._reduce(null,ops.concat(add)).wordExplanations[key][first.id].deleted,true);
  const target=env.load(FILES);target.Store.importBackup(w.Store.exportBackup());assert.equal(target.WordExplanations.list(key).length,0);
  w.WordExplanations.save(key,'Текст');assert.equal(w.WordExplanations.list(key).length,1);assert.notEqual(w.WordExplanations.list(key)[0].id,first.id);
});

test('старое состояние без объяснений поднимается, повреждённая копия не заменяет прогресс',()=>{
  const w=env.load(FILES),old=JSON.parse(JSON.stringify(w.Store.state()));delete old.wordExplanations;
  const restored=env.load(FILES,{storage:{'de-b1-progress-v1':JSON.stringify(old)}});
  assert.equal(restored.Store.ready(),true);restored.WordExplanations.save(key,'Сохранено');
  const before=JSON.stringify(restored.Store.state()),bad=JSON.parse(restored.Store.exportBackup());
  bad.state.wordExplanations[key].bad={text:'x'.repeat(14001),at:1};
  assert.throws(()=>restored.Store.importBackup(JSON.stringify(bad)));assert.equal(JSON.stringify(restored.Store.state()),before);
  for(const args of [{key:'bad',text:'Текст'},{key,text:' '},{key,text:'x'.repeat(14001)}])assert.throws(()=>w.Store.mutate('wordExplanationSave',args));
});

test('личные объяснения считаются прогрессом при первом подключении облака',()=>{
  const local=env.load(FILES),remote=env.load(FILES);local.WordExplanations.save(key,'Личная заметка');remote.Store.mutate('answer',{ok:true});
  assert.throws(()=>local.Store.attachCloud(remote.Store.cloudSeed('other-seed')),/разный начальный прогресс/);
  assert.equal(local.WordExplanations.list(key)[0].text,'Личная заметка');
});
