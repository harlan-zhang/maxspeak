const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTypeScript(entry, globals = {}, modules = new Map()) {
  const filename = path.resolve(__dirname, '..', entry);
  if (modules.has(filename)) return modules.get(filename);
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const exports = {};
  modules.set(filename, exports);
  const load = (id) => {
    if (id.startsWith('@/')) {
      return loadTypeScript(id.slice(2) + '.ts', globals, modules);
    }
    if (id.startsWith('.')) {
      return loadTypeScript(path.resolve(path.dirname(filename), id) + '.ts', globals, modules);
    }
    return require(id);
  };
  new Function('exports', 'require', ...Object.keys(globals), code)(
    exports, load, ...Object.values(globals)
  );
  return exports;
}

module.exports = loadTypeScript;
