/**
 * CodeAudit Backend - Main Entry Point
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { OrchestratorRuntime } from './orchestrator/runtime';
import { PlannerAgent } from './agents/planner';
import { SecurityAnalyzerAgent } from './agents/security';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;

// Initialize orchestrator
const orchestrator = new OrchestratorRuntime();

// Register MCP tools
function registerMCPTools() {
  const registry = orchestrator.getRegistry();

  // CodeAnalysis MCP
  registry.register({
    id: 'code-analysis',
    name: 'Code Analysis Server',
    endpoint: process.env.CODE_ANALYSIS_URL || 'http://localhost:8081',
    capabilities: ['sast_scan', 'detect_secrets', 'complexity_analysis'],
    healthCheck: 'http://localhost:8081/health',
    authentication: {
      type: 'api-key',
      header: 'X-API-Key',
      token: process.env.CODE_ANALYSIS_API_KEY || 'demo-key',
    },
    rateLimits: {
      requestsPerMinute: 10,
      maxConcurrentRequests: 3,
    },
  });

  // SecurityDB MCP
  registry.register({
    id: 'security-db',
    name: 'Security Database',
    endpoint: process.env.SECURITY_DB_URL || 'http://localhost:8082',
    capabilities: ['check_dependencies', 'get_cwe_info'],
    healthCheck: 'http://localhost:8082/health',
    authentication: { type: 'none' },
    rateLimits: {
      requestsPerMinute: 20,
      maxConcurrentRequests: 5,
    },
  });

  // GitAPI MCP
  registry.register({
    id: 'git-api',
    name: 'Git Repository API',
    endpoint: process.env.GIT_API_URL || 'http://localhost:8083',
    capabilities: ['scan_repository', 'get_recent_changes', 'get_file_blame'],
    healthCheck: 'http://localhost:8083/health',
    authentication: { type: 'none' },
    rateLimits: {
      requestsPerMinute: 15,
      maxConcurrentRequests: 3,
    },
  });

  // Add other MCP tools...
  console.log('[Main] MCP tools registered');
}

// Register agents
function registerAgents() {
  const registry = orchestrator.getRegistry();
  const tracer = orchestrator.getTracer();

  orchestrator.registerAgent(
    new PlannerAgent('planner-agent', 'Planner Agent', registry, tracer)
  );

  orchestrator.registerAgent(
    new SecurityAnalyzerAgent('security-agent', 'Security Analyzer', registry, tracer)
  );

  // Add other agents...
  console.log('[Main] Agents registered');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/api/audits', async (req, res) => {
  try {
    const { repoPath, options } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'repoPath is required' });
    }

    const sessionId = await orchestrator.startAudit({
      repoPath,
      options,
    });

    res.json({ sessionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/audits/:id', (req, res) => {
  const session = orchestrator.getSession(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

app.get('/api/audits/:id/trace', (req, res) => {
  const trace = orchestrator.getTrace(req.params.id);
  res.json(trace);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('[WebSocket] Client connected:', socket.id);

  socket.on('subscribe:audit', (sessionId: string) => {
    socket.join(`audit:${sessionId}`);
    console.log(`[WebSocket] Client subscribed to audit:${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('[WebSocket] Client disconnected:', socket.id);
  });
});

// Forward orchestrator events to WebSocket clients
orchestrator.on('audit:started', (data) => {
  io.to(`audit:${data.sessionId}`).emit('audit:started', data);
});

orchestrator.on('audit:progress', (data) => {
  io.to(`audit:${data.sessionId}`).emit('audit:progress', data);
});

orchestrator.on('agent:started', (data) => {
  io.to(`audit:${data.sessionId}`).emit('agent:started', data);
});

orchestrator.on('agent:completed', (data) => {
  io.to(`audit:${data.sessionId}`).emit('agent:completed', data);
});

orchestrator.on('audit:completed', (data) => {
  io.to(`audit:${data.sessionId}`).emit('audit:completed', data);
});

orchestrator.on('audit:failed', (data) => {
  io.to(`audit:${data.sessionId}`).emit('audit:failed', data);
});

// Initialize and start
async function main() {
  console.log('🚀 CodeAudit Backend Starting...');

  registerMCPTools();
  registerAgents();

  // Health check MCP tools
  const registry = orchestrator.getRegistry();
  const healthChecks = await registry.healthCheckAll();
  console.log('[Main] MCP Tool Health:', healthChecks);

  httpServer.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 WebSocket server ready`);
    console.log(`🔍 API: POST /api/audits - Start new audit`);
    console.log(`📈 API: GET /api/audits/:id - Get audit status`);
    console.log(`🔍 API: GET /api/audits/:id/trace - Get execution trace`);
  });
}

main().catch(console.error);

export { orchestrator };
