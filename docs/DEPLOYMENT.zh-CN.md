# 部署指南

AI Tools Kit 是一个轻量 Node HTTP 服务。网页 UI 和 `/api/run`、`/api/run-stream` 接口在同一个进程里提供。

## Docker

```bash
cp .env.example .env
docker build -t ai-tools-kit .
docker run --env-file .env -p 5177:5177 ai-tools-kit
```

打开 <http://localhost:5177>。

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

## Render

推荐配置：

| 配置项 | 值 |
| --- | --- |
| Runtime | Node |
| Build command | 留空 |
| Start command | `npm start` |
| Environment | 设置 `AI_PROVIDER`、模型和对应 Provider 密钥 |

## Railway

Railway 可以直接运行：

```bash
npm start
```

在 Railway Variables 中配置 `PORT`、`AI_PROVIDER` 和 Provider 密钥。

## API Token

公开部署时建议设置：

```bash
AI_TOOLS_API_TOKEN=your_random_token
```

用户可以在网页端填写这个 token，脚本也可以通过 Bearer token 方式调用 API。

## Vercel 说明

当前项目是长驻 Node 服务，并支持流式响应。若要部署到 Vercel，需要把 `server/index.js` 拆成 Vercel serverless route handlers；或者先用 Docker / Render / Railway 部署。
