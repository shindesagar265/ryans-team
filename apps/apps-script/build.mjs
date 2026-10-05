import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/Code.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'SwimWaveBundle',
  platform: 'neutral',
  target: 'es2020',
  outfile: 'dist/Code.js',
  sourcemap: false,
  minify: false,
});
const output = await readFile('dist/Code.js', 'utf8');
await writeFile('dist/Code.js', `${output}\nfunction doGet(e) { return SwimWaveBundle.doGet(e); }\nfunction doPost(e) { return SwimWaveBundle.doPost(e); }\nfunction setupSpreadsheet() { return SwimWaveBundle.setupSpreadsheet(); }\n`);
await copyFile('appsscript.json', 'dist/appsscript.json');
console.log('Apps Script bundle created in dist/');
