# HoloEarth AI (CN) 🌍✨

**HoloEarth AI** 是一个基于 React 和 Three.js 构建的未来派全息地球探索界面。它结合了沉浸式的 3D 可视化技术与 Google Gemini AI 的强大生成能力，为用户提供了一个探索地球地理、生态和人文知识的智能窗口。

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 功能特性

*   **🌐 沉浸式 3D 地球**: 使用 Three.js 渲染的高精度全息地球模型，支持自由旋转、缩放和交互。
*   **🤖 AI 智能行星分析**: 集成 **Google Gemini 2.5 Flash** 模型。点击地球上任意位置（陆地或海洋），AI 将实时分析该坐标，提供关于国家、城市、地貌、洋流或生态系统的科普事实。
*   **🖱️ 交互式控制**:
    *   **拖拽**: 旋转地球视角。
    *   **悬停**: 实时显示经纬度坐标。
    *   **点击**: 触发 AI 分析并显示详细情报。
*   **🎨 科幻全息 UI**: 精心设计的未来风格用户界面，营造身临其境的科幻体验。
*   **✋ 手势控制 (实验性)**: 集成 MediaPipe 手部追踪技术，探索非接触式交互的可能性。

## 🛠️ 技术栈

*   **核心框架**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **3D 渲染**: [Three.js](https://threejs.org/)
*   **人工智能**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini)
*   **计算机视觉**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe)
*   **图标库**: [Lucide React](https://lucide.dev/)

## 🏁 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/holoearth-ai-cn.git
cd holoearth-ai-cn
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

本项目需要 Google Gemini API 密钥才能正常工作。

1.  在项目根目录下创建一个名为 `.env.local` 的文件。
2.  添加你的 API 密钥：

```properties
GEMINI_API_KEY=你的_Google_Gemini_API_密钥
```

> 💡 **提示**: 你可以从 [Google AI Studio](https://aistudio.google.com/) 免费获取 API 密钥。

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问终端显示的地址（通常是 `http://localhost:5173`）。

## 📖 使用指南

1.  **启动系统**: 点击欢迎屏幕上的 "INITIALIZE CORE"（初始化核心）按钮进入主界面。
2.  **探索**:
    *   按住鼠标左键并拖动来旋转地球。
    *   移动鼠标查看光标指向的经纬度。
3.  **获取情报**:
    *   点击地球上的任意一点。
    *   右侧面板将显示 "ANALYZING..."（分析中）。
    *   稍等片刻，AI 将生成关于该位置的详细报告，包括地理归属、地貌特征或有趣的科普事实。

## 📂 目录结构

```
holoearth-ai-(cn)/
├── components/        # React 组件
│   ├── HoloEarth.tsx  # 3D 地球核心组件 (Three.js 实现)
│   └── HoloUI.tsx     # 全息风格 UI 组件
├── services/          # 服务层
│   └── geminiService.ts # Google Gemini API 调用逻辑
├── utils/             # 工具函数
│   └── mediaPipeHelper.ts # MediaPipe 手势识别辅助函数
├── App.tsx            # 主应用入口
└── ...
```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进这个项目！

## 📄 许可证

MIT License
