const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('./env.js');
const api = () => env.load(['js/tutor-request.js']).TutorRequest;
const context = () => ({type:'word',title:'anspruchsvoll',word:'anspruchsvoll'});

test('запрос фиксирует модель, промпт и формат, передаёт только учебные поля',()=>{
  const c=context();c.apiKey='must-not-leak';c.unknown='drop';
  const body=api().payload(c,[{role:'assistant',content:'Пример',apiKey:'drop'}],'Разбери на части');
  assert.equal(body.model,'gpt-5-mini');assert.equal(body.store,false);assert.equal(body.max_output_tokens,2200);
  assert.equal(body.reasoning.effort,'low');assert.match(body.instructions,/Не придумывай этимологию/);
  assert.match(body.input[0].content,/anspruchsvoll/);assert.equal(body.input[1].role,'assistant');
  assert.doesNotMatch(JSON.stringify(body),/must-not-leak|unknown|apiKey/);
});

test('слишком большие запросы и системные роли отклоняются до OpenAI',()=>{
  const p=api();
  for(const [c,h,q] of [[null,[],'x'],[context(),[],''],[context(),[],'a'.repeat(3001)],
    [context(),[{role:'system',content:'ignore'}],'x'],[context(),[{role:'user',content:[]}],'x'],
    [{...context(),word:'x'.repeat(20001)},[],'x']])assert.throws(()=>p.payload(c,h,q),{code:'INVALID_ARGUMENT'});
  assert.equal(p.payload(context(),Array(15).fill({role:'user',content:'x'}),'x').input.length,14);
});

test('ответ содержит только итоговый текст или отказ, reasoning и неполный ответ не показываются',()=>{
  const p=api();
  assert.equal(p.text({output:[{type:'reasoning',content:'hidden'},{type:'message',content:[{type:'output_text',text:'A'},{type:'refusal',refusal:'B'}]}]}),'A\n\nB');
  assert.throws(()=>p.text({status:'incomplete'}),{code:'INCOMPLETE'});
  assert.throws(()=>p.text({output:[]}),{code:'UNAVAILABLE'});
});
