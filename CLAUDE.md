# CLAUDE.md — NoteSnap 项目 AI 助手指引

## 项目简介

NoteSnap 是一款 PWA 笔记电子化工具。用户拍下纸质笔记，通过 OCR 识别为电子版，支持富文本编辑后本地存储。

## 关键标准文件

| 文件 | 内容 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 项目需求、功能清单、优先级 |
| [docs/tech-stack.md](docs/tech-stack.md) | 技术栈、架构、数据库设计、文件结构 |
| [docs/design-spec.md](docs/design-spec.md) | 色彩、排版、布局、组件风格、交互规范 |
| [docs/development-workflow.md](docs/development-workflow.md) | 开发环境、提交流程、验证清单 |
| [devlog/](devlog/) | 每日开发日志（按日期命名） |

## 工作原则

1. **每次只做一件事**：小步快跑，稳定推进。完成一个功能 → 验证 → 再进入下一个
2. **先修 Bug，再加功能**：数据丢失、识别错误等影响使用的 Bug 优先于新功能
3. **本地优先**：所有功能默认不依赖服务器。如需联网，需和用户确认
4. **更新日志**：每次开发结束后，在 `devlog/YYYY-MM-DD.md` 中记录完成事项和待办
5. **更新文档**：需求变更、技术选型变化时，同步更新 `docs/` 下对应文件
6. **编译验证**：每次修改后执行 `npm run build` 确认无错误

## 常用命令

```bash
npm run dev      # 启动开发服务器 → http://localhost:5173/
npm run build    # 生产编译 + PWA Service Worker 生成
npm run preview  # 预览生产版本
```
