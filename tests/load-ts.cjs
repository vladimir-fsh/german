const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const requireFromRepo = createRequire(path.join(root, 'package.json'));
const ts = requireFromRepo('typescript');
module.exports = function createLoader(globals = {}, overrides = {}) {
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative).exports;
    const filename = path.join(root, relative);
    const loadedModule = { exports: {} }; cache.set(relative, loadedModule);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    function localRequire(name) {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) { const base = 'src/' + name.slice(2); return load(fs.existsSync(path.join(root, base + '.ts')) ? base + '.ts' : base + '.tsx'); }
      return requireFromRepo(name);
    }
    vm.runInNewContext('(function(require,module,exports){' + output + '\n})', { console, Date, Intl, process, crypto: globalThis.crypto, TextDecoder, Request, Response, URL, setTimeout, clearTimeout, ...globals }, { filename })(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load;
};
