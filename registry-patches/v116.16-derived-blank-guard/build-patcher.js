'use strict';
// Regenerates patcher.html from the patch source so the two can never drift. Run: node build-patcher.js
const fs = require('node:fs');
const path = require('node:path');
const patch = fs.readFileSync(path.join(__dirname, 'rlh-v11616-derived-blank-guard.js'), 'utf8');
if (/<\/?script/i.test(patch)) throw new Error('Patch source must not contain script tag text.');
const tpl = fs.readFileSync(path.join(__dirname, 'patcher.template.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'patcher.html'), tpl.replace('__PATCH_SOURCE__', () => patch));
console.log('patcher.html written');
