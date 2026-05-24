# Deployment

AI Tools Kit is a small Node HTTP server. It serves the web UI and the `/api/run` / `/api/run-stream` endpoints from the same process.

## Docker

```bash
cp .env.example .env
docker build -t ai-tools-kit .
docker run --env-file .env -p 5177:5177 ai-tools-kit
```

Open <http://localhost:5177>.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

## Render

Use these settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | empty |
| Start command | `npm start` |
| Environment | set `AI_PROVIDER`, model, and provider API keys |

## Railway

Railway can run the project directly:

```bash
npm start
```

Set `PORT`, `AI_PROVIDER`, and your provider secrets in Railway variables.

## API Token

For public deployments, set:

```bash
AI_TOOLS_API_TOKEN=your_random_token
```

Users can enter this token in the web UI, and scripts can send it as a Bearer token.

## Vercel Note

This repository currently uses a long-running Node server and streaming responses. For Vercel, either deploy it as a Docker-backed service elsewhere, or refactor `server/index.js` into Vercel serverless route handlers.
