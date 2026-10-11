const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const files = [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons || {}), ...manifest.content_scripts.flatMap(script => script.js)];
for (const file of files) if (!fs.existsSync(file)) throw new Error(`Missing manifest file: ${file}`);
for (const [size, file] of Object.entries(manifest.icons || {})) {
  const bytes = fs.readFileSync(file);
  if (bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== Number(size) || bytes.readUInt32BE(20) !== Number(size)) throw new Error(`Invalid PNG icon: ${file}`);
}
for (const directory of ['src', 'scripts', 'tests']) {
  for (const name of fs.readdirSync(directory)) {
    if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', path.join(directory, name)], {stdio: 'inherit'});
  }
}
console.log('Manifest paths and JavaScript syntax verified.');
