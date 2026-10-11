const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const files = [manifest.background.service_worker, manifest.action.default_popup, ...manifest.content_scripts.flatMap(script => script.js)];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`Missing manifest file: ${file}`);
for (const directory of ['src', 'scripts', 'tests']) {
  for (const name of fs.readdirSync(directory)) {
    if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', path.join(directory, name)], {stdio: 'inherit'});
  }
}
console.log('Manifest paths and JavaScript syntax verified.');
