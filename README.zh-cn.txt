# Freya 语音 AI 智能体控制台

为 Freya (YC S25) 构建的生产级语音 AI 智能体控制台。基于 LiveKit 流媒体的实时语音对话系统。

# 视频演示

https://github.com/user-attachments/assets/d0bf03f3-77b7-4659-9f30-07dadb23a785


## 功能特性

- 语音到语音 AI：Groq Whisper STT → llama-3.1-8b → Cartesia TTS
- 实时流传输：由 LiveKit 驱动的双向音频
- 提示词管理：支持版本控制的 CRUD 操作
- 会话分析：指标统计与对话历史
- 生产就绪：Docker 化部署

## 技术栈

### 前端
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- LiveKit Client SDK

### 后端
- Python 3.11
- LiveKit Agents
- Groq (LLM + STT)
- Cartesia (TTS)
- Silero VAD

### 基础设施
- Docker Compose
- 多阶段构建 (Multi-stage builds)
- 健康检查 (Health checks)

## 快速开始

### 前提条件

- Docker & Docker Compose
- LiveKit 服务器 URL + 凭据
- Groq API 密钥
- Cartesia API 密钥

### 设置步骤

1. 克隆并配置
```
git clone <your-repo>
cd <project-folder>
cp .env.example .env
```

2. 在 .env 中添加您的 API 密钥
```
LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
GROQ_API_KEY=your_groq_key
CARTESIA_API_KEY=your_cartesia_key
```

3. 构建并运行
```
docker compose up --build
```

4. 访问应用
```
http://localhost:3000
```

## 项目结构

```
 agent/
├── main.py              # 入口文件，LiveKit worker
├── requirements.txt     # Python 依赖
└── agent/
    ├── config.py        # 环境配置 (LLM 模型等)
    ├── voice_agent.py   # 主智能体类，LiveKit 设置
    └── conversation.py  # 对话处理器 (STT → LLM → TTS)

web/
├── app/
│   ├── page.tsx         # 落地页/登录页
│   ├── api/
│   │   ├── auth/        # 登录、登出、检查接口
│   │   ├── livekit/token/  # LiveKit token 生成
│   │   └── prompts/     # 提示词 CRUD API
│   └── console/
│       ├── page.tsx     # 主控制面板
│       ├── Components/
│       │   ├── ChatPanel.tsx      # 文本聊天 (待完善)
│       │   ├── MetricsPanel.tsx   # 指标显示
│       │   ├── PromptModal.tsx    # 创建/编辑提示词
│       │   └── PromptSidebar.tsx  # 提示词列表
│       └── hooks/
│           ├── useLiveKit.ts      # LiveKit 连接逻辑
│           └── usePrompts.ts      # 提示词管理
└── lib/
    ├── store.ts         # 状态管理
    └── utils.ts         # 工具函数
```

## 架构

```
用户浏览器
    ↓
Next.js 前端 (端口 3000)
    ↓
LiveKit Cloud
    ↓
Python Agent
    ↓
Groq API (LLM/STT) + Cartesia (TTS)
```

## 已实现的核心功能

### 语音 AI 流水线
- STT：使用 Groq Whisper 实现语音转文本
- LLM：使用 Groq llama-3.1-8b-instant 生成回复
- TTS：使用 Cartesia Sonic 英语语音
- VAD：使用 Silero 实现语音活动检测

### 提示词系统
- 提示词的创建/读取/更新/删除
- 版本历史追踪
- 内存存储 (已预留 PostgreSQL 接口)

### 会话管理
- 实时会话追踪
- 对话历史记录
- 性能指标
- 分析仪表盘

## 开发指南

### 本地开发 (不使用 Docker)

后端：
```
cd agent
pip install -r requirements.txt
python main.py dev
```

前端：
```
cd web
npm install
npm run dev
```

### Docker 命令

```
# 启动服务
docker compose up --build

# 在后台运行
docker compose up --build -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 彻底重启 (移除卷)
docker compose down -v
```

## 设计决策

### 为什么采用“语音优先”？
相比文本聊天，重点关注核心价值主张（语音 AI），以便在有限的时间内最大化影响力。

### 为什么使用内存存储？
为了快速原型开发。生产环境将使用 PostgreSQL 配合 Prisma ORM。

### 为什么选择 LiveKit？
实时语音/视频行业的标准，也是 ChatGPT 高级语音模式的底层驱动。

### 为什么使用多阶段 Docker 构建？
为了减小镜像体积、加快构建速度，并通过使用非 root 用户提高安全性。

## 生产环境优化方向

未来生产部署的增强方案：

- 使用 PostgreSQL 实现持久化
- 使用 Redis 进行会话缓存
- 实现速率限制和身份验证
- 完善的测试套件
- 会话录制与回放
- 多租户支持
- 监控与日志 (OpenTelemetry)
- 负载均衡与扩容
- CI/CD 流水线

## 评估背景

本项目作为 Freya (YC S25) 的 Forward Deploying Engineer 评估任务构建。

- 时间范围：3 天 (10/10/25 - 13/10/25)
- 完成进度：80% (语音功能可用，文本聊天优先级较低)
- 重点：生产级语音 AI 的实现
- 优先级：语音到语音流水线优先于文本聊天功能

## 技术亮点

- 实时双向音频流传输
- 低延迟语音对话
- 提示词版本管理系统
- 会话分析与指标统计
- Docker 化部署，保证可移植性
- 优化后的多阶段构建
- 使用非 root 容器用户确保安全性

## 相关链接

- LiveKit: https://livekit.io
- Groq: https://groq.com
- Cartesia: https://cartesia.ai
- Freya (YC S25): https://www.ycombinator.com/companies/freya

## 许可证

本项目采用 **作品集展示许可证 (Portfolio Display License)**。

**概要：**
- ✅ 您可以查看和学习此代码
- ✅ 您可以在关于就业的讨论中引用它
- ❌ 您不得将其用于商业用途
- ❌ 您不得重新分发或出售本项目

详情请参阅 [LICENSE](./LICENSE) 文件。

商业许可咨询请联系：contact@sanjaybuilds.com

---

构建者：Sanjay Kumar | [GitHub](https://github.com/05sanjaykumar/) | [LinkedIn](https://www.linkedin.com/in/sanjay-kumar-6382a1372/) | [Portfolio](https://www.sanjaybuilds.com/)
