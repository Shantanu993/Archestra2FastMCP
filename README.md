# CodeAudit: Intelligent Code Intelligence & Safety Copilot

**Hackathon Project**: MCP WeMakeDevs - Generative UI + Agentic AI

## 🎯 Overview

CodeAudit is a multi-agent Copilot that audits code for security vulnerabilities, quality issues, and compliance violations using Archestra's MCP-based orchestration platform. It generates dynamic, interactive dashboards that help development teams prioritize and fix issues intelligently.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React + Generative UI)   │
│  - Dynamic Dashboard Components     │
│  - Real-time Progress Updates       │
│  - Interactive Remediation Cards    │
└────────────┬────────────────────────┘
             │ WebSocket/REST
┌────────────▼────────────────────────┐
│  Archestra Orchestration Layer      │
│  ┌────────────────────────────────┐ │
│  │  Agent Runtime & Coordinator   │ │
│  │  - MCP Registry                │ │
│  │  - Security Guardrails         │ │
│  │  - Execution Tracing           │ │
│  └────────────────────────────────┘ │
│                                     │
│  Multi-Agent System:                │
│  • Planner Agent                    │
│  • Security Analyzer Agent          │
│  • Quality Agent                    │
│  • Validator Agent                  │
│  • Prioritizer Agent                │
│  • Explainer Agent                  │
│  • UI Composer Agent                │
└────────────┬────────────────────────┘
             │ MCP Protocol
┌────────────▼────────────────────────┐
│  MCP Tool Servers                   │
│  • CodeAnalysis (SAST)              │
│  • SecurityDB (CVE)                 │
│  • GitAPI                           │
│  • MetricsAnalyzer                  │
│  • ComplianceEngine                 │
│  • LLMInference (Claude)            │
└─────────────────────────────────────┘
```

## 📁 Project Structure

```
CodeAudit/
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # Detailed architecture
│   ├── WIREFRAMES.md              # UI wireframes & flow
│   ├── AGENT_PROMPTS.md           # Agent prompt templates
│   └── MCP_SPECIFICATION.md       # MCP tool specs
│
├── backend/                       # Orchestration Layer
│   ├── orchestrator/              # Archestra runtime
│   │   ├── runtime.ts             # Main orchestrator
│   │   ├── registry.ts            # MCP tool registry
│   │   ├── security.ts            # Guardrails & policies
│   │   └── tracing.ts             # Observability
│   │
│   ├── agents/                    # AI Agents
│   │   ├── planner.ts             # Planner Agent
│   │   ├── security.ts            # Security Analyzer
│   │   ├── quality.ts             # Quality Agent
│   │   ├── validator.ts           # Validator Agent
│   │   ├── prioritizer.ts         # Prioritizer Agent
│   │   ├── explainer.ts           # Explainer Agent
│   │   └── ui-composer.ts         # UI Composer
│   │
│   ├── mcp-tools/                 # MCP Tool Servers
│   │   ├── code-analysis/         # SAST server
│   │   ├── security-db/           # CVE database
│   │   ├── git-api/               # Git integration
│   │   ├── metrics/               # Code metrics
│   │   ├── compliance/            # Compliance rules
│   │   └── llm-inference/         # Claude API wrapper
│   │
│   └── api/                       # REST/WebSocket API
│       ├── routes.ts              # API routes
│       └── websocket.ts           # Real-time updates
│
├── frontend/                      # Generative UI
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── generative/        # Dynamic UI components
│   │   │   ├── audit-progress/    # Progress indicators
│   │   │   └── remediation/       # Fix suggestions
│   │   │
│   │   ├── services/              # API clients
│   │   ├── hooks/                 # React hooks
│   │   └── types/                 # TypeScript types
│   │
│   └── public/
│
├── scripts/                       # Deployment & testing
│   ├── setup.sh                   # Local setup
│   ├── seed-data.sh               # Test data
│   └── demo.sh                    # Demo runner
│
└── examples/                      # Sample audits
    ├── vulnerable-nodejs/         # Demo repo 1
    └── compliance-test/           # Demo repo 2
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker (for MCP tools)
- Claude API key
- Archestra MCP SDK

### Installation

```bash
# Clone and install
git clone <repo-url> CodeAudit
cd CodeAudit
npm install

# Set up environment
cp .env.example .env
# Add your Claude API key to .env

# Start MCP tool servers
docker-compose up -d

# Start backend orchestrator
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

### Run Demo Audit

```bash
npm run demo
# Opens http://localhost:3000 with pre-loaded vulnerable repo
```

## 🎮 Usage

1. **Upload Code**: Drag & drop a repo or connect GitHub
2. **Watch Agents Work**: Real-time progress as agents analyze
3. **Review Findings**: Interactive dashboard with prioritized issues
4. **Apply Fixes**: One-click remediation or delegate to team
5. **Track Compliance**: See compliance scorecard updates

## 🏆 Hackathon Demo Flow (3-5 minutes)

1. **Introduction** (30s): Problem statement + architecture overview
2. **Code Upload** (30s): Upload `examples/vulnerable-nodejs`
3. **Live Audit** (2 min): Watch dashboard populate in real-time
4. **Interaction** (1 min): Click findings, apply fix, show code diff
5. **Observability** (30s): Show agent execution trace
6. **Impact** (30s): Before/after compliance scores

## 🔧 Key Technologies

- **Frontend**: React 18, TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Orchestration**: Archestra MCP SDK
- **AI**: Anthropic Claude 3.5 Sonnet
- **MCP Tools**: Custom servers (TypeScript)
- **Real-time**: Socket.io
- **Deployment**: Docker, Kubernetes-ready

## 📊 Success Metrics

- **Agent Coordination**: 7 agents running in parallel
- **Tool Invocations**: 15-20 MCP tool calls per audit
- **UI Generation**: 100% dynamic component rendering
- **Performance**: <5 minute audits for 500-file repos
- **Accuracy**: <5% false positive rate

## 🎯 Hackathon Judging Criteria

✅ **Innovation**: Multi-agent orchestration + generative UI  
✅ **MCP Usage**: 6 custom MCP servers, centralized registry  
✅ **Archestra Features**: Security, tracing, scalability  
✅ **Real-world Value**: Solves actual developer pain points  
✅ **Demo Impact**: Visual, interactive, compelling

## 📝 License

MIT License - Built for MCP WeMakeDevs Hackathon 2026
