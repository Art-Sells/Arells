# Alien generate worker

Long-timeout Lambda for Grok stills + videos. Managed in the **AWS Lambda console** (not Amplify publish).

## Amplify (Next app)

Set at **build** time (next.config inlines it — Amplify often drops custom runtime env):

```
ALIEN_GENERATE_WORKER_FUNCTION_NAME=arells-alien-generate-worker
```

Without that, create falls back to the browser and **stops when you leave the page**.
Do **not** set `ALIEN_GENERATE_ALLOW_CLIENT=1` on Amplify.

SSR (WS keys or compute role) needs `lambda:InvokeFunction` on that function.

## Rebuild + upload code

```bash
node workers/alien-generate/pack-zip.mjs
# upload workers/alien-generate/function.zip → Lambda (or S3 then update-function-code)
```

Handler: `index.handler`

Lambda env: `S3_BUCKET_NAME`, `GROK_API_KEY`, `WS_REGION` (and region via AWS).

**Do not set `WS_ACCESS_KEY_ID` / `AWS_ACCESS_KEY_ID` on this function** — they override the
execution role. Dead keys leave create stuck at 1% forever. Give the role S3 read/write on
`arellsusers` instead.
