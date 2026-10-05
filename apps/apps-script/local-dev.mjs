import { build } from 'esbuild';

const result = await build({
  entryPoints: ['src/localServer.ts'],
  absWorkingDir: import.meta.dirname,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  write: false,
});

const source = result.outputFiles[0].text;
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
