# 技术栈说明

## 整体架构

```
用户浏览器 (PWA)
├── React 18 (UI 层)
├── TipTap / ProseMirror (富文本编辑)
├── Tesseract.js v5 (OCR 识别引擎)
├── Dexie.js / IndexedDB (本地数据库)
└── Service Worker (离线缓存)
```

无后端服务器，纯客户端应用。

## 技术选型

| 层 | 技术 | 版本 | 用途 |
|---|---|---|---|
| 框架 | React | 18.x | UI 组件化开发 |
| 类型 | TypeScript | 5.x | 类型安全 |
| 构建 | Vite | 8.x | 开发/构建工具 |
| 样式 | Tailwind CSS | 4.x | Utility-first CSS |
| 路由 | React Router | 6.x | 客户端路由 |
| OCR | Tesseract.js | 5.x | 中英文文字识别 |
| 编辑器 | TipTap (ProseMirror) | 2.x | 富文本编辑 |
| 存储 | Dexie.js | 4.x | IndexedDB 封装 |
| PWA | vite-plugin-pwa | 1.x | Service Worker + Manifest |

## 数据库设计

**数据库名称**：NotesAppDB
**引擎**：IndexedDB (via Dexie.js)

### notes 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (PK) | UUID |
| title | string | 笔记标题 |
| content | string | HTML 格式正文 |
| originalImages | string[] | base64 原始图片 |
| ocrRawText | string | OCR 原始识别文本 |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

### corrections 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number (auto PK) | 自增主键 |
| original | string | OCR 原始文本 |
| corrected | string | 用户修正后文本 |
| count | number | 修正次数 |

## 项目文件结构

```
notesapp/
├── public/            # 静态资源（图标等）
├── src/
│   ├── components/    # 可复用 UI 组件
│   ├── pages/         # 页面级组件
│   ├── lib/           # 工具库（OCR、修正逻辑）
│   ├── App.tsx        # 路由入口
│   ├── main.tsx       # 应用挂载
│   ├── db.ts          # 数据库初始化
│   ├── types.ts       # TypeScript 类型定义
│   └── index.css      # 全局样式 + Tailwind
├── docs/              # 项目文档
├── devlog/            # 开发日志
├── CLAUDE.md          # AI 助手指引
├── vite.config.ts     # Vite 配置
└── index.html         # HTML 入口
```
