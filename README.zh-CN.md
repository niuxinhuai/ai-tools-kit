# AI Tools Kit

一个中英文 AI 工具箱，适合日常写作、代码解释、总结、翻译、工作流和本地自动化。它同时支持网页应用和命令行 CLI，Provider 可插拔，运行时零依赖。

English docs: [README.md](./README.md).

## 3 分钟上手

```bash
git clone https://github.com/niuxinhuai/ai-tools-kit.git
cd ai-tools-kit
cp .env.example .env
npm start
```

打开 <http://localhost:5177>。如果暂时没有模型密钥，可以用 `AI_PROVIDER=mock` 体验全部流程。

## 常用命令

```bash
npm run cli -- --list
npm run cli -- --tool rewrite --input "帮我把这句话改自然一点。" --lang zh --provider mock
npm run cli -- --tool summarize --files "docs/*.md" --out summaries --format md
npm run cli -- --tool summarize --files "docs/*.md" --format jsonl --retries 2
npm run cli -- --tool email-reply --input "感谢更新" --var audience=customer --var goal="确认下一步"
npm run cli -- --init-config
npm run cli -- --workflow workflows/content-pipeline.json --file notes.md --provider mock
npm run cli -- --doctor --provider deepseek
npm run cli -- --init --yes --with-api-token
AI_TOOLS_CACHE=1 ai-tools --tool summarize --file notes.md
```

## 核心能力

- 网页端 + CLI 一套零依赖 Node 项目。
- 内置文案改写、文件总结、Prompt 生成、代码解释、周报、翻译、社媒帖子、创意发散。
- 支持 OpenAI、OpenAI 兼容接口、DeepSeek、通义千问、豆包、Moonshot、Gemini、Anthropic、Ollama 和 mock 模式。
- 网页端支持流式输出、文件导入、结果导出、Prompt 预览和增强历史记录。
- CLI 支持批量处理、JSONL 输出、失败重试、多文件合并、长文本分块、本地缓存、工作流和 Provider fallback。
- 支持通过 `.ai-tools-kit.json` 保存项目级 CLI 默认配置。
- 支持通过 `tools/custom.json` 增加自定义工具，并提供 `tools/templates/` 模板库。
- 自定义工具支持 Prompt 变量，网页端自动生成表单，CLI 支持 `--var`。
- 提供本地 HTTP API、OpenAPI 规范、可选 API Token 鉴权、Docker 支持和 npm 发布配置。

## 内置工具

| ID | 工具 |
| --- | --- |
| `rewrite` | 文案改写器 |
| `summarize` | 文件总结器 |
| `prompt` | Prompt 生成器 |
| `code-explain` | 代码解释器 |
| `weekly-report` | 周报生成器 |
| `translate` | 双语翻译器 |
| `social-post` | 社媒帖子生成器 |
| `idea-lab` | 创意发散器 |

## 配置

复制 `.env.example` 并选择 Provider：

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=gpt-4o-mini
```

Ollama 示例：

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## 进阶文档

- Provider：[docs/PROVIDERS.zh-CN.md](./docs/PROVIDERS.zh-CN.md)
- 自定义工具：[docs/CUSTOM_TOOLS.zh-CN.md](./docs/CUSTOM_TOOLS.zh-CN.md)
- 项目配置：[docs/CONFIG.zh-CN.md](./docs/CONFIG.zh-CN.md)
- 工作流：[docs/WORKFLOWS.zh-CN.md](./docs/WORKFLOWS.zh-CN.md)
- API：[docs/API.zh-CN.md](./docs/API.zh-CN.md)
- OpenAPI：[openapi.json](./openapi.json)
- 部署：[docs/DEPLOYMENT.zh-CN.md](./docs/DEPLOYMENT.zh-CN.md)
- 安全：[docs/SECURITY.zh-CN.md](./docs/SECURITY.zh-CN.md)
- 变更日志：[CHANGELOG.md](./CHANGELOG.md)

## 脚本

```bash
npm start          # 启动网页端和 API server
npm run cli        # 运行 CLI
npm run check      # 语法检查
npm test           # smoke + CLI + API + package 测试
npm run test:api   # API 接口测试
```

## 开源协议

MIT
