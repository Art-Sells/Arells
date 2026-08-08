import { spawn } from 'node:child_process';

const nextArgs = process.argv.slice(2);
const child = spawn('npx', ['next', 'dev', ...nextArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
