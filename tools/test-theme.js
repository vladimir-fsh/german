const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(systemDark, saved, denied=false) {
  const attrs={}, root={style:{},setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k]}, meta={}, handlers={}, media={matches:systemDark,addEventListener:(type,fn)=>handlers.system=fn};
  let value=saved;
  const win={document:{documentElement:root,querySelector:()=>meta},localStorage:{getItem(){if(denied)throw Error('blocked');return value},setItem:(k,v)=>value=v,removeItem:()=>value=null},matchMedia:()=>media,addEventListener:(type,fn)=>handlers[type]=fn};
  win.window=win;vm.runInNewContext(fs.readFileSync('js/theme.js','utf8'),win);
  return {win,root,meta,attrs,handlers,media,setStored:v=>value=v};
}
test('системная и сохранённая темы согласуют фон, встроенные элементы и цвет браузера до первого экрана',()=>{
  for(const [system,saved,expected] of [[true,null,'dark'],[false,null,'light'],[true,'light','light'],[false,'dark','dark'],[true,'bad','dark']]){
    const h=setup(system,saved);assert.equal(h.win.Theme.current(),expected);assert.equal(h.root.style.colorScheme,expected);assert.equal(h.meta.content,h.root.style.backgroundColor);assert.equal(h.root.style.backgroundColor,expected==='dark'?'#131314':'#f0f4f9');
  }
});
test('ручной выбор сохраняется при смене системной темы, соседняя вкладка обновляет тему без перезагрузки',()=>{
  const h=setup(true,null);h.win.Theme.set('light');h.media.matches=false;h.handlers.system();h.media.matches=true;h.handlers.system();assert.equal(h.win.Theme.current(),'light');
  h.setStored('dark');h.handlers.storage({key:'de-theme'});assert.equal(h.root.style.colorScheme,'dark');assert.equal(h.meta.content,'#131314');
  h.setStored(null);h.media.matches=false;h.handlers.storage({key:null});assert.equal(h.win.Theme.current(),'light');
});
test('недоступное хранилище не мешает системной теме и её ручному переключению',()=>{
  const h=setup(true,null,true);assert.equal(h.win.Theme.current(),'dark');h.win.Theme.set('light');assert.equal(h.root.style.backgroundColor,'#f0f4f9');
});
test('тема подключена до стилей и не откладывается до app.js',()=>{
  const html=fs.readFileSync('index.html','utf8');assert.ok(html.indexOf('src="js/theme.js"')<html.indexOf('href="css/app.css"'));assert.equal((html.match(/name="theme-color"/g)||[]).length,1);
});
