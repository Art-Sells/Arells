# Long-timeout character worker (Grok compose + i2v). Not Amplify SSR.
FROM public.ecr.aws/lambda/nodejs:20

COPY package.json yarn.lock* package-lock.json* ./
RUN npm install --omit=dev sharp aws-sdk dotenv 2>/dev/null || yarn install --production

COPY workers/alien-generate/dist/index.js ./index.js
COPY src/server-data/alien-compose ./src/server-data/alien-compose

CMD ["index.handler"]
