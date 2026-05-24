# 安全说明

AI Tools Kit 默认面向本地使用或自托管使用。

## API Key

- API Key 应放在 `.env` 或服务端环境变量里。
- 网页端不需要把 API Key 存到浏览器 localStorage。
- `/api/health` 只会报告是否配置了 Key，不会返回 Key 的具体值。
- 如果是共享或公开部署，不建议从浏览器传 `provider.apiKey`。

## API Token

设置 `AI_TOOLS_API_TOKEN` 可以保护会调用模型的接口：

```bash
AI_TOOLS_API_TOKEN=change_me
```

请求时携带：

```text
Authorization: Bearer change_me
```

它会保护 `/api/run`、`/api/run-stream` 和 `/api/prompt`。健康检查和元数据接口保持公开。

## 部署

如果公开部署，请加认证或只开放给可信用户。API 接口会调用你配置的 AI Provider，公开暴露可能消耗你的额度。

## 本地数据

网页历史记录存储在用户本机浏览器 localStorage 中。除非用户重新运行或导出结果，否则不会主动发送到其他地方。
