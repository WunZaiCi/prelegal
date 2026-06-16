# Prelegal Project

## Overview

这是一个SaaS产品，允许用户基于模板目录中的模板起草法律协议。
用户可以通过AI聊天功能确定所需的文档类型以及如何填写相关字段。
可用的文档列表详见项目根目录下的catalog.json文件，内容如下：

@catalog.json

当前状态（V1 技术基础，PL-4 已完成）：项目已具备完整技术骨架——Next.js 前端、FastAPI 后端、临时 SQLite 数据库，并通过单一 Docker 容器交付。目前仍仅支持《互惠保密协议》文档；登录为前端假登录（无真实身份验证，点击即进入平台）；尚未包含 AI 聊天功能。详见文末「已实现」一节。

## Development process

当被要求构建一个功能时：
1. 使用你的 Atlassian 工具从 Jira 中阅读功能说明
2. 开发该功能——请勿跳过“功能开发”7步流程中的任何一步
3. 使用单元测试和集成测试对该功能进行全面测试，并修复任何问题
4. 使用你的 GitHub 工具提交拉取请求

## AI design

在编写调用大型语言模型（LLM）的代码时，请利用您的 Cerebras 技能，通过 LiteLLM 直接以 Cerebras 作为推理提供商进行调用，并选择 `cerebras/gpt-oss-120b` 模型。您应使用结构化输出，以便能够解读结果并填充法律文件中的字段。

项目根目录下的 .env 文件中包含一个 OPENROUTER_API_KEY。

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

## 已实现（V1 技术基础 — PL-4）

- **前端**：`frontend/`，Next.js（App Router，静态导出到 `frontend/out`）。《互惠保密协议》起草器 + PDF 下载；新增前端假登录页 `/login` 与登录门禁（`app/page.tsx`）。字体已改为通过 `@fontsource` 自托管，构建无需访问 Google Fonts。
- **后端**：`backend/`，FastAPI（uv 项目），运行于 http://localhost:8000 。提供 `GET /api/health`，并托管静态前端（前端与 API 同源单一来源）。
- **数据库**：SQLite，每次启动从头重建，包含 `users` 表。**与设计的差异**：当前登录为纯前端假登录（无真实认证），`users` 表仅作为后续真实注册/登录的脚手架，暂无任何接口读写它。
- **打包**：根目录多阶段 `Dockerfile`（Node 构建前端 → 经 uv 的 FastAPI 运行时）。`npm` registry 默认指向 `registry.npmmirror.com` 这一快速镜像，可用 `--build-arg NPM_REGISTRY=...` 覆盖。
- **脚本**：`scripts/{start,stop}-{mac,linux,windows}` 用于构建/运行/停止容器。
- **测试**：后端 `uv run pytest`（健康检查、数据库重建、静态托管）；前端 `npm test`（含 auth 与 LoginForm）。

> 备注：本次还修复了根 `.gitignore` —— 通用的 Python `lib/` 规则曾误伤前端源码目录 `frontend/lib/`，导致 PL-3 的源文件从未被提交；已锚定为 `/lib/` 并补提交。

## 后续（尚未实现）

- AI 聊天功能（参见「AI design」），用于确定文档类型并填充字段。
- 基于 `users` 表的真实注册/登录与会话认证（替换当前的前端假登录）。
- 《互惠保密协议》以外的其余 `catalog.json` 文档类型。
