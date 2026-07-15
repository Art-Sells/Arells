import { spawn } from 'node:child_process';

/**
 * Local `yarn dev`: start Next, then warm the portfolio snapshot in the background
 * (no curl, no instrumentation / Edge crypto bundling).
 */
const nextArgs = process.argv.slice(2);
const child = spawn('npx', ['next', 'dev', ...nextArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

const port = (() => {
  const i = nextArgs.indexOf('-p');
  if (i >= 0 && nextArgs[i + 1]) return String(nextArgs[i + 1]);
  const eq = nextArgs.find((a) => a.startsWith('--port='));
  if (eq) return eq.slice('--port='.length);
  return process.env.PORT || '3000';
})();

const base = `http://127.0.0.1:${port}`;

async function warmPortfolioSnapshot() {
  if (process.env.PORTFOLIO_SNAPSHOT_BOOTSTRAP_DISABLED === '1') return;

  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1500 : 1000));
    try {
      const res = await fetch(`${base}/api/portfolio/recompute-snapshot`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log(
          `[portfolio-snapshot] warmed after yarn dev (rows=${body.rowCount ?? '?'} wau=${body.wau ?? '?'})`
        );
        return;
      }
      // Server up but unauthorized — stop polling (misconfigured secret)
      if (res.status === 401 || res.status === 403) {
        console.warn(`[portfolio-snapshot] warm skipped — HTTP ${res.status}`);
        return;
      }
    } catch {
      // Next not listening yet
    }
  }
  console.warn('[portfolio-snapshot] warm timed out — open /my-portfolio once to bootstrap');
}

void warmPortfolioSnapshot();

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
