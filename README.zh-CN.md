# AI Tools Kit

一个实用的中英文 AI 小工具集合，同时支持网页应用和命令行 CLI。适合日常高频任务：文案改写、文件总结、Prompt 生成、代码解释、翻译、社媒帖子、周报生成和创意发散。

English docs: [README.md](./README.md).

## 功能亮点

- 网页端 + CLI 一套项目。
- 支持中文、英文、中英双语输出。
- Web 和 CLI 共用同一套工具定义。
- 支持 OpenAI、OpenAI 兼容接口、DeepSeek、通义千问、豆包、Moonshot、Gemini、Anthropic、Ollama 和本地 Mock 模式。
- 网页端支持 OpenAI 兼容接口和 Ollama 的流式输出。
- 支持文本文件导入和浏览器本地历史记录。
- 零运行依赖，不需要构建步骤。

## 快速开始

```bash
git clone https://github.com/niuxinhuai/ai-tools-kit.git
cd ai-tools-kit
cp .env.example .env
npm start
```

打开 <http://localhost:5177>。

如果暂时没有模型密钥，可以在 `.env` 中使用本地演示模式：

```bash
AI_PROVIDER=mock
```

## CLI 用法

```bash
npm run cli -- --list
npm run cli -- --tool rewrite --input "帮我把这句话改自然一点。" --lang zh --provider mock
cat notes.md | npm run cli -- --tool summarize --option structured --lang zh
```

如果全局安装或本地 link：

```bash
npm link
ai-tools --tool code-explain --file ./snippet.js --lang bilingual
```

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

## Provider 配置

见 [docs/PROVIDERS.zh-CN.md](./docs/PROVIDERS.zh-CN.md)。

OpenAI 兼容接口示例：

```bash
AI_PROVIDER=openai-compatible
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_key
AI_MODEL=gpt-4o-mini
```

Ollama 本地模型示例：

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

## 部署

见 [docs/DEPLOYMENT.zh-CN.md](./docs/DEPLOYMENT.zh-CN.md)。

Docker 快速启动：

```bash
cp .env.example .env
docker compose up --build
```

## 项目结构

```text
ai-tools-kit/
  bin/              CLI 入口
  docs/             Provider 配置说明
  public/           网页应用
  server/           静态服务与 API
  src/              工具定义、Provider 适配、运行逻辑
  tests/            冒烟测试
```

## 常用脚本

```bash
npm start       # 启动网页端和 API server
npm run cli     # 运行 CLI
npm test        # Mock 模式冒烟测试
npm run check   # 语法检查
```

## 开源协议

MIT
