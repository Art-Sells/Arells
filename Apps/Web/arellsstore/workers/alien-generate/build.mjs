import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const entry = path.join(__dirname, 'handler.ts');
const outfile = path.join(__dirname, 'dist/index.js');

const r = spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    entry,
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=cjs',
    `--outfile=${outfile}`,
    '--sourcemap',
    '--external:sharp',
    '--external:aws-sdk',
    '--external:@aws-sdk/*',
  ],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
);

if (r.status !== 0) process.exit(r.status || 1);
console.log('built workers/alien-generate/dist/index.js');
