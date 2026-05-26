# 开发执行步骤

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:5173/

# 编译生产版本
npm run build
# → dist/
```

## 开发流程

### 分支策略

- `main`：稳定分支，随时可交付
- 每个功能/修复从 `main` 开新分支

### 提交规范

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档变更
- `style:` 样式调整
- `refactor:` 重构

### 验证清单

在提交前确认：
- [ ] `npm run build` 编译通过
- [ ] 浏览器手动测试关键流程
- [ ] 无新增 TypeScript 类型错误
- [ ] 无控制台报错

## 架构原则

1. **本地优先**：所有数据默认存本地，不依赖服务器
2. **渐进增强**：基础功能离线可用，高级功能可选联网
3. **移动端优先**：UI 先适配手机（方便拍照），桌面端居中展示
4. **容错设计**：OCR 识别可能不准 → 允许用户修改 → 学习修正

## 关键文件路径

| 文件 | 说明 |
|------|------|
| `src/db.ts` | Dexie 数据库定义（修改表结构时需升级版本号） |
| `src/lib/ocr.ts` | Tesseract.js OCR 引擎封装 |
| `src/lib/corrections.ts` | 修正词库学习逻辑 |
| `src/types.ts` | 全项目类型定义 |
| `vite.config.ts` | Vite + PWA 配置 |
| `index.html` | HTML 入口（含 PWA meta 标签） |
