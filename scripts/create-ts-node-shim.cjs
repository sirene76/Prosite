const fs = require("fs");
const path = require("path");

const binDir = path.resolve("node_modules/.bin");
const shimTarget = path.resolve("scripts/ts-node-shim.js");

if (!fs.existsSync(shimTarget)) {
  console.error(`ts-node shim not found at ${shimTarget}`);
  process.exit(1);
}

fs.mkdirSync(binDir, { recursive: true });

const unixShimPath = path.join(binDir, "ts-node");
const unixShim = `#!/usr/bin/env node\nrequire('path').resolve;\nrequire(require('path').resolve(__dirname, '../../scripts/ts-node-shim.js'));\n`;
fs.writeFileSync(unixShimPath, unixShim, { mode: 0o755 });

const windowsShimPath = path.join(binDir, "ts-node.cmd");
const windowsShim = `@ECHO OFF\r\nnode "%~dp0..\\scripts\\ts-node-shim.js" %*\r\n`;
fs.writeFileSync(windowsShimPath, windowsShim, { mode: 0o755 });
