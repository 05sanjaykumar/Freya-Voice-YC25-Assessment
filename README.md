# Freya Voice AI Agent Console

Production-grade voice AI agent console built for Freya (YC S25). Real-time voice conversation system with LiveKit streaming.

## Features

- Voice-to-Voice AI: Groq Whisper STT → llama-3.1-8b → Cartesia TTS
- Real-time Streaming: LiveKit-powered bidirectional audio
- Prompt Management: CRUD operations with versioning
- Session Analytics: Metrics and conversation history
- Production Ready: Dockerized deployment

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- LiveKit Client SDK

### Backend
- Python 3.11
- LiveKit Agents
- Groq (LLM + STT)
- Cartesia (TTS)
- Silero VAD

### Infrastructure
- Docker Compose
- Multi-stage builds
- Health checks

## Quick Start

### Prerequisites

- Docker & Docker Compose
- LiveKit server URL + credentials
- Groq API key
- Cartesia API key

### Setup

1. Clone and configure
```
git clone <your-repo>
cd <project-folder>
cp .env.example .env
```

2. Add your API keys to .env
```
LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
GROQ_API_KEY=your_groq_key
CARTESIA_API_KEY=your_cartesia_key
```

3. Build and run
```
docker compose up --build
```

4. Access the app
```
http://localhost:3000
```

## Project Structure

```

agent/
├── main.py              # Entry point, LiveKit worker
├── requirements.txt     # Python dependencies
└── agent/
    ├── config.py        # Environment config (LLM model, etc)
    ├── voice_agent.py   # Main agent class, LiveKit setup
    └── conversation.py  # Conversation handler (STT → LLM → TTS)

web/
├── app/
│   ├── page.tsx         # Landing/login page
│   ├── api/
│   │   ├── auth/        # Login, logout, check endpoints
│   │   ├── livekit/token/  # LiveKit token generation
│   │   └── prompts/     # Prompt CRUD API
│   └── console/
│       ├── page.tsx     # Main dashboard
│       ├── Components/
│       │   ├── ChatPanel.tsx      # TEXT CHAT (needs work)
│       │   ├── MetricsPanel.tsx   # Metrics display
│       │   ├── PromptModal.tsx    # Create/edit prompts
│       │   └── PromptSidebar.tsx  # Prompt list
│       └── hooks/
│           ├── useLiveKit.ts      # LiveKit connection logic
│           └── usePrompts.ts      # Prompt management
└── lib/
    ├── store.ts         # State management
    └── utils.ts         # Utilities

```

## Architecture

```
User Browser
    ↓
Next.js Frontend (Port 3000)
    ↓
LiveKit Cloud
    ↓
Python Agent
    ↓
Groq API (LLM/STT) + Cartesia (TTS)
```

## Key Features Implemented

### Voice AI Pipeline
- STT: Groq Whisper for speech-to-text
- LLM: Groq llama-3.1-8b-instant for responses
- TTS: Cartesia Sonic English voice
- VAD: Silero for voice activity detection

### Prompt System
- Create/Read/Update/Delete prompts
- Version history tracking
- In-memory storage (PostgreSQL ready)

### Session Management
- Real-time session tracking
- Conversation history
- Performance metrics
- Analytics dashboard

## Development

### Local Development (without Docker)

Backend:
```
cd agent
pip install -r requirements.txt
python main.py
```

Frontend:
```
cd web
npm install
npm run dev
```

### Docker Commands

```
# Start services
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Fresh start (remove volumes)
docker compose down -v
```

## Design Decisions

### Why Voice-First?
Focused on core value proposition (voice AI) over text chat to maximize impact in limited timeframe.

### Why In-Memory Storage?
Rapid prototyping. Production would use PostgreSQL with Prisma ORM.

### Why LiveKit?
Industry standard for real-time voice/video. Powers ChatGPT Advanced Voice Mode.

### Why Multi-Stage Docker?
Smaller images, faster builds, better security with non-root users.

## Production Improvements

Future enhancements for production deployment:

- PostgreSQL for persistence
- Redis for session caching
- Rate limiting and authentication
- Comprehensive test suite
- Session recording and playback
- Multi-tenant support
- Monitoring and logging (OpenTelemetry)
- Load balancing and scaling
- CI/CD pipeline

## Assessment Context

Built as Founding Engineer Assessment for Freya (YC S25)

- Timeframe: 3 days
- Scope: 80% complete (voice working, text chat deprioritized)
- Focus: Production-grade voice AI implementation
- Prioritization: Voice-to-voice pipeline over text chat features

## Technical Highlights

- Real-time bidirectional audio streaming
- Low-latency voice conversation
- Prompt versioning system
- Session analytics and metrics
- Dockerized for portability
- Multi-stage builds for optimization
- Non-root container users for security

## Links

- LiveKit: https://livekit.io
- Groq: https://groq.com
- Cartesia: https://cartesia.ai
- Freya (YC S25): https://www.ycombinator.com/companies/freya

---

Built by Sanjay Kumar | [GitHub](https://github.com/05sanjaykumar/) | [LinkedIn](https://www.linkedin.com/in/sanjay-kumar-6382a1372/) | [Portfolio](https://www.sanjaybuilds.com/)
