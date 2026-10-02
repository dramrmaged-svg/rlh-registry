'use strict';
// Regenerates patcher.html from the patch source and edits.json so they can never drift. Run: node build-patcher.js
const fs = require('node:fs');
const path = require('node:path');
const patch = fs.readFileSync(path.join(__dirname, 'rlh-v11617-net-activity-definitions.js'), 'utf8');
const edits = fs.readFileSync(path.join(__dirname, 'edits.json'), 'utf8');
if (/<\/?script/i.test(patch) || /<\/script/i.test(edits)) throw new Error('Patch source / edits must not contain script tag text that would close an inline block.');
JSON.parse(edits);
const tpl = fs.readFileSync(path.join(__dirname, 'patcher.template.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'patcher.html'), tpl.replace('__PATCH_SOURCE__', () => patch).replace('__EDITS_JSON__', () => edits));
console.log('patcher.html written');
