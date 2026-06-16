# prelegal

一个用于起草通用法律协议的平台。

## 项目状态

🚧 本项目正在开发中，预计将于一周内（约 2026-06-22 前）完成。

当前为 V1 技术基础版本：前端 + 后端 + 临时数据库已打通，并通过单一 Docker 容器交付。
登录为**前端假登录**（无真实身份验证，点击即进入平台），产品功能暂未更新。

## 架构

```
frontend/   Next.js（静态导出到 out/）— Mutual NDA 起草器 + 假登录页
backend/    FastAPI（uv 项目）— 提供 /api 接口并托管静态前端；启动时重建 SQLite
scripts/    各平台的启动/停止脚本
Dockerfile  多阶段构建：构建前端 → 由 FastAPI 一并托管
```

- 后端运行在 http://localhost:8000 ，同时提供前端页面与 `/api/*` 接口。
- SQLite 数据库在每次容器启动时从头重建，包含 `users` 表（为后续真实注册/登录预留）。

## 运行（Docker）

```bash
# macOS
scripts/start-mac.sh      # 启动
scripts/stop-mac.sh       # 停止

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows (PowerShell)
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

启动后访问 http://localhost:8000 。

## 本地开发

```bash
# 前端
cd frontend && npm install && npm run dev      # http://localhost:3000
npm test                                        # 前端测试

# 后端
cd backend && uv sync && uv run uvicorn app.main:app --reload   # http://localhost:8000
uv run pytest                                   # 后端测试
```
