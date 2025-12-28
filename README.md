# 情绪陪伴数字人 (Emotion Companion)

> 基于魔珐星云3D数字人技术的全天候情绪陪伴应用

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 项目简介

情绪陪伴数字人是一个基于魔珐星云3D数字人技术的情感陪伴应用。它能够识别用户情绪状态，提供温暖陪伴和深度情感共鸣，帮助用户记录和追踪情绪变化。

### 核心功能

- **3D数字人交互** - 使用魔珐星云SDK驱动的生动3D数字人
- **智能情绪识别** - 基于AI对话分析用户当前情绪状态
- **情感陪伴对话** - 根据情绪提供个性化的温暖回应
- **情绪数据统计** - 可视化展示情绪历史记录和统计数据
- **密钥管理** - 支持自定义API密钥或使用内置演示密钥

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Zustand (状态管理)
- TailwindCSS (样式)
- Axios (HTTP客户端)

### 后端
- Node.js + Express + TypeScript
- 魔搭社区 AI (DeepSeek-V3.2)
- 魔珐星云具身驱动SDK

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件（可选，应用内置演示密钥）：

```bash
# 魔搭AI配置
MODELSCOPE_API_KEY=your_modelscope_api_key
MODELSCOPE_MODEL=deepseek-ai/DeepSeek-V3.2

# 魔珐星云配置
XINGYUN_APP_ID=your_xingyun_app_id
XINGYUN_APP_SECRET=your_xingyun_app_secret
```

### 运行开发服务器

```bash
# 启动前端开发服务器 (端口 5173)
npm run dev

# 启动后端API服务器 (端口 3001)
npm run server
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
emotion-companion/
├── src/
│   ├── client/              # 前端代码
│   │   ├── components/      # React组件
│   │   │   ├── Avatar/      # 数字人相关组件
│   │   │   ├── Chat/        # 聊天相关组件
│   │   │   └── Common/      # 通用组件
│   │   ├── store/           # Zustand状态管理
│   │   ├── services/        # 前端API服务
│   │   └── App.tsx          # 主应用组件
│   └── server/              # 后端代码
│       ├── routes/          # Express路由
│       ├── services/        # 后端服务
│       └── app.ts           # Express应用入口
├── public/                  # 静态资源
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 功能说明

### 1. 密钥管理

首次访问时会弹出密钥配置对话框：
- **使用演示密钥** - 勾选即可使用内置的演示API密钥
- **自定义密钥** - 输入自己的魔搭和魔珐星云密钥
- 密钥保存在浏览器 localStorage 中，可随时修改

### 2. 数字人控制

- 点击「连接数字人」按钮连接魔珐星云服务
- 连接成功后数字人会自动打招呼
- 可通过「断开连接」按钮停止服务（停止消耗积分）

### 3. 情绪对话

- 支持文字输入与数字人进行情感对话
- AI会自动识别用户情绪并给予共情回应
- 对话记录会自动保存到情绪历史中

### 4. 情绪统计

点击右侧统计按钮（📈）查看：
- 总对话次数
- 今日对话次数
- 最常见情绪类型
- 各类情绪平均强度
- 整体情绪强度

## API接口

### POST /api/chat/stream

流式对话接口

**请求体:**
```json
{
  "message": "用户消息",
  "conversationHistory": [...],
  "apiKey": "魔搭API密钥（可选）"
}
```

### POST /api/chat/speak

数字人语音合成接口

**请求体:**
```json
{
  "text": "要合成的文本",
  "action": "动作名称（可选）"
}
```

## 配置说明

### 魔搭AI

- **对话模型**: `deepseek-ai/DeepSeek-V3.2`
- **API地址**: `https://api-inference.modelscope.cn/v1`
- 获取密钥: https://modelscope.cn/

### 魔珐星云

- **SDK版本**: `0.1.0-alpha.45`
- **CDN地址**: `https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js`
- 获取密钥: https://www.morfei.com/

## 开发文档

详细的开发文档请查看 [CLAUDE.md](./CLAUDE.md)

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue。
