# HoloEarth

HoloEarth是一个基于 React 和 Three.js 构建的未来派全息地球探索界面。它结合了沉浸式的 3D 可视化技术与 Google Gemini AI 的强大生成能力，为用户提供了一个探索地球地理、生态和人文知识的智能窗口。

## 功能特性

- 🌍 **3D 地球可视化**: 使用 Three.js 和 React Three Fiber 构建的交互式 3D 地球模型
- 🤖 **AI 智能问答**: 集成 Google Gemini AI，回答关于地球的各种问题
- 🎮 **交互控制**: 支持鼠标拖动旋转、滚轮缩放等交互操作
- ⭐ **太空背景**: 星空背景增强沉浸感

## 安装和运行

### 前置要求

- Node.js 16+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 获取 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建或登录您的 Google 账号
3. 生成 API Key

### 运行开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

构建输出位于 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 使用说明

1. 启动应用后，首先输入您的 Gemini API Key
2. 使用鼠标拖动旋转地球
3. 使用滚轮缩放视图
4. 在输入框中输入关于地球的问题，AI 将为您提供详细回答

## 技术栈

- **前端框架**: React 19
- **3D 渲染**: Three.js + React Three Fiber + Drei
- **构建工具**: Vite
- **AI 服务**: Google Gemini AI

## 许可证

ISC
