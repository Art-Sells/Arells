/**
 * Build handler bundle + zip for manual Lambda upload (console / S3).
 *   node workers/alien-generate/pack-zip.mjs
 * → workers/alien-generate/function.zip (handler index.handler)
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

sh('node', [path.join(__dirname, 'build.mjs')]);

const pkg = path.join(__dirname, '.lambda-pack');
fs.rmSync(pkg, { recursive: true, force: true });
fs.mkdirSync(pkg, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'dist/index.js'), path.join(pkg, 'index.js'));
fs.writeFileSync(
  path.join(pkg, 'package.json'),
  JSON.stringify(
    { name: 'arells-alien-generate-worker', private: true, version: '1.0.0', main: 'index.js' },
    null,
    2
  )
);
sh('npm', ['install', '--omit=dev', 'sharp@0.35.5', 'aws-sdk@2.1659.0'], { cwd: pkg });
fs.cpSync(path.join(root, 'src/server-data/alien-compose'), path.join(pkg, 'src/server-data/alien-compose'), {
  recursive: true,
});

const zipPath = path.join(__dirname, 'function.zip');
fs.rmSync(zipPath, { force: true });
sh('zip', ['-rq', zipPath, '.'], { cwd: pkg });
console.log('packed', zipPath);
