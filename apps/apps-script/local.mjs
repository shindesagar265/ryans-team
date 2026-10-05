import { build } from 'esbuild';

await build({
  entryPoints: ['src/localServer.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outfile: 'dist/localServer.mjs',
  sourcemap: true,
});
await import('./dist/localServer.mjs');
