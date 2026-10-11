const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {zip} = require('./artifact-utils');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const files = ['manifest.json', 'LICENSE', ...Object.values(manifest.icons),
  'src/core.js','src/adapter.js','src/summary-layout.js','src/content.js',
  'src/background.js','src/popup.html','src/popup.js','src/popup.css'].sort();
const entries = [...new Set(files)].map(name => ({name, data: fs.readFileSync(name)}));
const data = zip(entries);
fs.mkdirSync('dist', {recursive:true});
const target = path.join('dist', `calendar-weather-overlay-${manifest.version}.zip`);
fs.writeFileSync(target, data);
const hash = crypto.createHash('sha256').update(data).digest('hex');
fs.writeFileSync(`${target}.sha256`, `${hash}  ${path.basename(target)}\n`);
console.log(`Created ${target} (${data.length} bytes, ${entries.length} files).\nSHA-256: ${hash}`);
