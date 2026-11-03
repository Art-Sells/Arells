# Alien generate worker

Long-timeout Lambda for Grok stills + videos. Managed in the **AWS Lambda console** (not Amplify publish).

## Amplify (Next app)

Set:

```
ALIEN_GENERATE_WORKER_FUNCTION_NAME=arells-alien-generate-worker
```

SSR compute role needs `lambda:InvokeFunction` on that function.

## Rebuild + upload code

```bash
node workers/alien-generate/pack-zip.mjs
# upload workers/alien-generate/function.zip → Lambda (or S3 then update-function-code)
```

Handler: `index.handler`

Lambda env: `S3_BUCKET_NAME`, `GROK_API_KEY`, `WS_REGION`
