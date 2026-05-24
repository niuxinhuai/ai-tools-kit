# Contributing

Thanks for improving AI Tools Kit.

## Local Development

```bash
cp .env.example .env
npm start
```

Use `AI_PROVIDER=mock` when you want to test without an API key.

## Add a Tool

1. For local/private tools, prefer `tools/custom.json`.
2. For built-in tools, add a tool definition in `src/tools.js`.
3. Make sure it has Chinese and English title, description, input label, placeholder, and options.
4. Add a sample in `public/app.js`.
5. Run `npm test` and `npm run check`.

## Add a Provider

1. Add default provider metadata in `src/providers.js`.
2. Reuse the OpenAI-compatible request path when possible.
3. Add provider docs in `docs/PROVIDERS.md` and `docs/PROVIDERS.zh-CN.md`.
