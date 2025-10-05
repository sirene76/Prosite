#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: ts-node <file> [args...]");
  process.exit(1);
}

const [entry, ...restArgs] = args;
const resolved = path.resolve(entry);

if (!fs.existsSync(resolved)) {
  console.error(`ts-node shim: Cannot find entry file ${entry}`);
  process.exit(1);
}

const source = fs.readFileSync(resolved, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
    esModuleInterop: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
  },
  fileName: resolved,
});

process.argv = [process.argv[0], resolved, ...restArgs];

const compiledModule = new Module(resolved, module.parent || module);
compiledModule.filename = resolved;
compiledModule.paths = Module._nodeModulePaths(path.dirname(resolved));
compiledModule._compile(transpiled.outputText, resolved);
