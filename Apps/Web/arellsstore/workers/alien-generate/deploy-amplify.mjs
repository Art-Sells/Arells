/**
 * Build + publish arells-alien-generate-worker from the Amplify (or local) pipeline.
 *
 * Required env (Amplify Console):
 *   ALIEN_GENERATE_WORKER_FUNCTION_NAME  (e.g. arells-alien-generate-worker)
 *   ALIEN_GENERATE_WORKER_ROLE_ARN       (Lambda execution role: logs + S3 on arellsusers)
 *   S3_BUCKET_NAME, GROK_API_KEY
 * Optional: AWS_REGION / WS_REGION (default us-west-1)
 *
 * Amplify's *build* service role needs lambda:CreateFunction|UpdateFunctionCode|
 * UpdateFunctionConfiguration|GetFunction and iam:PassRole on the worker role.
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
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (${r.status})`);
  }
}

function shOut(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || `${cmd} failed`).trim());
  }
  return (r.stdout || '').trim();
}

function main() {
  const functionName =
    process.env.ALIEN_GENERATE_WORKER_FUNCTION_NAME?.trim() ||
    'arells-alien-generate-worker';
  const roleArn = process.env.ALIEN_GENERATE_WORKER_ROLE_ARN?.trim();
  const region =
    process.env.WS_REGION?.trim() || process.env.AWS_REGION?.trim() || 'us-west-1';
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  const grokKey = process.env.GROK_API_KEY?.trim();

  if (!roleArn) {
    console.log(
      '⚠️  ALIEN_GENERATE_WORKER_ROLE_ARN unset — skipping worker Lambda deploy (Next app still deploys).'
    );
    console.log(
      '   Create a Lambda execution role (S3 + CloudWatch Logs), set that ARN on Amplify, redeploy.'
    );
    return;
  }
  if (!bucket) throw new Error('S3_BUCKET_NAME required to deploy worker');
  if (!grokKey) throw new Error('GROK_API_KEY required to deploy worker');

  console.log('🔧 Building alien-generate worker bundle…');
  sh('node', ['workers/alien-generate/build.mjs']);

  const pkg = path.join(__dirname, '.lambda-pack');
  fs.rmSync(pkg, { recursive: true, force: true });
  fs.mkdirSync(pkg, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'dist/index.js'), path.join(pkg, 'index.js'));
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(
      {
        name: 'arells-alien-generate-worker',
        private: true,
        version: '1.0.0',
        main: 'index.js',
      },
      null,
      2
    )
  );

  console.log('📦 Installing sharp + aws-sdk for Lambda (linux)…');
  sh(
    'npm',
    ['install', '--omit=dev', 'sharp@0.35.5', 'aws-sdk@2.1659.0'],
    { cwd: pkg }
  );

  const dataSrc = path.join(root, 'src/server-data/alien-compose');
  const dataDest = path.join(pkg, 'src/server-data/alien-compose');
  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.cpSync(dataSrc, dataDest, { recursive: true });

  const zipPath = path.join(__dirname, 'function.zip');
  fs.rmSync(zipPath, { force: true });
  sh('zip', ['-rq', zipPath, '.'], { cwd: pkg });

  const envPath = path.join(__dirname, 'env.json');
  fs.writeFileSync(
    envPath,
    JSON.stringify({
      Variables: {
        S3_BUCKET_NAME: bucket,
        GROK_API_KEY: grokKey,
        WS_REGION: region,
        AWS_REGION: region,
        ALIEN_GENERATE_WORKER_FUNCTION_NAME: functionName,
      },
    })
  );

  let exists = false;
  try {
    shOut('aws', [
      'lambda',
      'get-function',
      '--function-name',
      functionName,
      '--region',
      region,
    ]);
    exists = true;
  } catch {
    exists = false;
  }

  if (!exists) {
    console.log(`🚀 Creating Lambda ${functionName}…`);
    sh('aws', [
      'lambda',
      'create-function',
      '--function-name',
      functionName,
      '--runtime',
      'nodejs20.x',
      '--role',
      roleArn,
      '--handler',
      'index.handler',
      '--timeout',
      '900',
      '--memory-size',
      '3008',
      '--zip-file',
      `fileb://${zipPath}`,
      '--region',
      region,
      '--environment',
      `file://${envPath}`,
    ]);
  } else {
    console.log(`🚀 Updating Lambda code ${functionName}…`);
    sh('aws', [
      'lambda',
      'update-function-code',
      '--function-name',
      functionName,
      '--zip-file',
      `fileb://${zipPath}`,
      '--region',
      region,
    ]);
    console.log('⏳ Waiting for code update…');
    sh('aws', [
      'lambda',
      'wait',
      'function-updated-v2',
      '--function-name',
      functionName,
      '--region',
      region,
    ]);
    console.log('🔧 Updating Lambda config…');
    sh('aws', [
      'lambda',
      'update-function-configuration',
      '--function-name',
      functionName,
      '--timeout',
      '900',
      '--memory-size',
      '3008',
      '--runtime',
      'nodejs20.x',
      '--handler',
      'index.handler',
      '--role',
      roleArn,
      '--region',
      region,
      '--environment',
      `file://${envPath}`,
    ]);
  }

  console.log(`✅ Worker Lambda ready: ${functionName} (${region})`);
  console.log(
    `   Set Amplify env ALIEN_GENERATE_WORKER_FUNCTION_NAME=${functionName} (SSR invoke) if not already.`
  );
}

try {
  main();
} catch (err) {
  console.error('❌ Worker deploy failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}
