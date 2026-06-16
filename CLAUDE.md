# Prelegal Project

## Overview

这是一个SaaS产品，允许用户基于模板目录中的模板起草法律协议。
用户可以通过AI聊天功能确定所需的文档类型以及如何填写相关字段。
可用的文档列表详见项目根目录下的catalog.json文件，内容如下：

@catalog.json

当前状态（V1 技术基础 + AI 聊天 + 多文档类型）：项目已具备完整技术骨架——Next.js 前端、FastAPI 后端、临时 SQLite 数据库，并通过单一 Docker 容器交付。AI 聊天起草已接入（Cerebras，见「AI design」），且为唯一的字段填写方式——手动表单已移除。AI 会先判定用户需要的文档类型（`catalog.json` 全部类型均已支持）；对不支持的类型会说明并推荐最接近的可生成类型、征得同意后切换。界面已按本文「Color Scheme」全面改版为冷色 SaaS 风格（无衬线）。登录为前端假登录（无真实身份验证，点击即进入平台）。详见文末「已实现」一节。

## Development process

当被要求构建一个功能时：
1. 使用你的 Atlassian 工具从 Jira 中阅读功能说明
2. 开发该功能——请勿跳过“功能开发”7步流程中的任何一步
3. 使用单元测试和集成测试对该功能进行全面测试，并修复任何问题
4. 使用你的 GitHub 工具提交拉取请求

## AI design

在编写调用大型语言模型（LLM）的代码时，请利用您的 Cerebras 技能，通过 LiteLLM 直接以 Cerebras 作为推理提供商进行调用，并选择 `cerebras/gpt-oss-120b` 模型。您应使用结构化输出，以便能够解读结果并填充法律文件中的字段。

项目根目录下的 .env 文件中包含一个 CEREBRAS_API_KEY，用于直连 Cerebras Cloud（不经过 OpenRouter）。

## Technical design

整个项目应打包到一个 Docker 容器中。  
后端应位于 backend/ 目录下，采用 FastAPI 构建的 uv 项目。  
前端应位于 frontend/ 目录下。  
数据库应使用 SQLite，并在每次启动 Docker 容器时从头创建，其中需包含一个支持注册和登录功能的 users 表。  
如果可行，请考虑静态构建前端并通过 FastAPI 提供服务。  
scripts/ 目录下应包含以下脚本：  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
后端运行在 http://localhost:8000

## Color Scheme
- 强调色（黄色）: `#ecad0a`
- 主蓝色: `#209dd7`
- 次要色（紫色）: `#753991` （提交按钮）
- 深海军蓝: `#032147` （标题）
- 灰色文本: `#888888`

## 已实现（V1 技术基础 + AI 聊天 + 多文档类型）

- **前端**：`frontend/`，Next.js（App Router，静态导出到 `frontend/out`）。多文档类型起草器（**唯一入口为 AI 聊天 `ChatPanel`，手动表单已移除**）+ PDF 下载；前端假登录页 `/login` 与登录门禁（`app/page.tsx`）。界面按「Color Scheme」全面改版为冷色 SaaS 风格：海军蓝标题、蓝色主操作、紫色提交按钮、黄色强调。应用界面字体改为无衬线 **Archivo**，文档预览区保留 **Newsreader** 衬线以显正式；字体经 `@fontsource` 自托管，构建无需访问 Google Fonts。
- **多文档类型（PL-6）**：文档注册表的单一事实来源为 `frontend/lib/documents.json`（前端 import、后端运行时读取，Docker 中 COPY 进镜像并由 `PRELEGAL_DOCUMENTS_PATH` 指定）。互惠保密协议（NDA）走原有专属管线（`NdaPreview`/`NdaPdfDocument`/`standard-terms`）；其余类型走通用引擎——按各文档的 `keyTerms` 由 AI 对话收集，并用 `GenericPreview`/`GenericPdfDocument` 通用渲染封面页（引用 Common Paper 标准条款，不内嵌全文）。
- **AI 聊天**：后端 `POST /api/chat`（`backend/app/chat.py`），经 LiteLLM 直连 Cerebras（`cerebras/gpt-oss-120b`，结构化输出）。三种模式按 `docType` 路由：**选择**（判定文档类型 / 不支持则推荐切换）、**NDA**（专属 `ExtractedFields`）、**通用**（按 `documents.py` 动态生成的字段模型提取）。前端 `components/ChatPanel.tsx` + `lib/chat.ts` + `lib/documents.ts`。需在根目录 `.env` 设置 `CEREBRAS_API_KEY`，否则聊天禁用。
- **后端**：`backend/`，FastAPI（uv 项目），运行于 http://localhost:8000 。提供 `GET /api/health` 与 `POST /api/chat`，并托管静态前端（前端与 API 同源单一来源）。
- **数据库**：SQLite，每次启动从头重建，包含 `users` 表。**与设计的差异**：当前登录为纯前端假登录（无真实认证），`users` 表仅作为后续真实注册/登录的脚手架，暂无任何接口读写它。
- **打包**：根目录多阶段 `Dockerfile`（Node 构建前端 → 经 uv 的 FastAPI 运行时）。`npm` registry 默认指向官方 `registry.npmjs.org`（开箱即用）；中国大陆等官方源缓慢/受阻的网络可用 `--build-arg NPM_REGISTRY=https://registry.npmmirror.com`（或 `$env:NPM_REGISTRY`）切换到镜像。
- **脚本**：`scripts/{start,stop}-{mac,linux,windows}` 用于构建/运行/停止容器。
- **测试**：后端 `uv run pytest`（健康检查、数据库重建、静态托管、文档注册表 `test_documents.py`、聊天三模式 `test_chat.py`）；前端 `npm test`（auth、LoginForm、`ChatPanel`、文档注册表 `documents.test.ts`、NDA 预览/PDF 等）。

> 备注：本次还修复了根 `.gitignore` —— 通用的 Python `lib/` 规则曾误伤前端源码目录 `frontend/lib/`，导致 PL-3 的源文件从未被提交；已锚定为 `/lib/` 并补提交。

## 后续（尚未实现）

- 基于 `users` 表的真实注册/登录与会话认证（替换当前的前端假登录）。
- 通用文档目前只渲染封面页并引用 Common Paper 标准条款；后续可考虑在预览/PDF 内嵌各文档标准条款全文，并为高频文档提供更精细的专属字段/版式。
