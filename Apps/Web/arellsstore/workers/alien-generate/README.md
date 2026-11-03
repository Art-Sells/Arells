# Alien generate worker

Long-timeout Lambda for Grok stills + videos. **Shipped by the same Amplify git-push build** as arellsstore (`amplify.yml` → `deploy-amplify.mjs`).

## Amplify Console env (required for worker publish + invoke)

| Variable | Purpose |
| --- | --- |
| `ALIEN_GENERATE_WORKER_FUNCTION_NAME` | e.g. `arells-alien-generate-worker` (SSR arm invoke + deploy target) |
| `ALIEN_GENERATE_WORKER_ROLE_ARN` | Lambda **execution** role ARN (S3 on `arellsusers` + CloudWatch Logs) |
| `S3_BUCKET_NAME` | same as app |
| `GROK_API_KEY` | same as app |
| `WS_REGION` / `AWS_REGION` | `us-west-1` |

If `ALIEN_GENERATE_WORKER_ROLE_ARN` is missing, Amplify still deploys Next but **skips** worker publish (logged warning).

## IAM

1. **Worker execution role** (`ALIEN_GENERATE_WORKER_ROLE_ARN`): `AWSLambdaBasicExecutionRole` + S3 read/write on your users bucket.
2. **Amplify build service role**: `lambda:CreateFunction`, `UpdateFunctionCode`, `UpdateFunctionConfiguration`, `GetFunction`, `iam:PassRole` on the worker role.
3. **Amplify SSR compute role**: `lambda:InvokeFunction` on `arn:aws:lambda:us-west-1:ACCOUNT:function:arells-alien-generate-worker`.

## Local

```bash
node workers/alien-generate/build.mjs
ALIEN_GENERATE_WORKER_ROLE_ARN=arn:aws:iam::…:role/… node workers/alien-generate/deploy-amplify.mjs
```
