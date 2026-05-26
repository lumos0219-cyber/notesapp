# 设计规范

## 色彩系统

| 用途 | 色值 | Tailwind |
|------|------|----------|
| 主背景 | `#F5F7FA` | 全局 body |
| 卡片/导航白底 | `#FFFFFF` | `bg-white` |
| 主蓝色（按钮/链接） | `#1976D2` | `bg-blue-500` |
| 浅蓝背景 | `#E3F2FD` | `bg-blue-50` |
| 浅蓝边框 | `#BBDEFB` | `border-blue-100` |
| 文字主色 | `#1F2937` | `text-gray-800` |
| 文字副色 | `#6B7280` | `text-gray-500` |
| 高亮色 | `#FEF08A` | `bg-yellow-200` |

## 排版

- 字体：系统默认无衬线（`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`）
- 标题：`text-2xl font-bold` (24px)
- 正文：`text-base` (16px)
- 辅助文字：`text-sm text-gray-400` (14px)

## 布局规则

- 移动端优先设计
- 内容最大宽度 `max-w-2xl` (672px)，居中
- 页面内边距 `px-4` (16px)
- 卡片间距 `space-y-3` (12px)
- 卡片圆角 `rounded-xl` (12px)
- 按钮圆角 `rounded-lg` (8px)

## 组件风格

- 卡片：白色背景、浅灰边框、微阴影 (`shadow-sm`)
- 按钮：蓝底白字、hover 加深
- 输入框：白色背景、聚焦蓝色边框
- 导航栏：白色背景、底部细蓝边、粘性定位

## 交互反馈

- 按钮 hover：颜色加深 100
- 卡片 hover：阴影增强 + 边框变蓝
- 保存成功：绿色文字 + 脉冲动画，2 秒自动消失
- OCR 进度：蓝色进度条 + 百分比数字 + 弹跳图标
