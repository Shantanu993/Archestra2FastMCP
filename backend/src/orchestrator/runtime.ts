/**
 * Orchestrator Runtime
 * 
 * Main coordinator for multi-agent audit execution.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { MCPRegistry } from './registry';
import { SecurityGuardrails } from './security';
import { ExecutionTracer } from './tracing';
import { BaseAgent } from '../agents/base';

export interface AuditRequest {
  repoPath: string;
  userId?: string;
  options?: {
    frameworks?: string[];  // Compliance frameworks to check
    priority?: 'speed' | 'thorough';
  };
}

export interface AuditSession {
  id: string;
  status: 'planning' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  results?: AuditResults;
  error?: string;
}

export interface AuditResults {
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalFindings: number;
  };
  findings: any[];
  complianceScore?: Record<string, number>;
  remediationPlan?: any;
  uiSpec?: any;
}

export class OrchestratorRuntime extends EventEmitter {
  private registry: MCPRegistry;
  private security: SecurityGuardrails;
  private tracer: ExecutionTracer;
  private agents: Map<string, BaseAgent> = new Map();
  private activeSessions: Map<string, AuditSession> = new Map();

  constructor() {
    super();
    this.security = new SecurityGuardrails();
    this.tracer = new ExecutionTracer();
    this.registry = new MCPRegistry(this.security, this.tracer);
  }

  /**
   * Register an agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    console.log(`[Orchestrator] Registered agent: ${agent.id}`);
  }

  /**
   * Get MCP registry (for initialization)
   */
  getRegistry(): MCPRegistry {
    return this.registry;
  }

  /**
   * Get tracer
   */
  getTracer(): ExecutionTracer {
    return this.tracer;
  }

  /**
   * Start a new audit
   */
  async startAudit(request: AuditRequest): Promise<string> {
    const sessionId = uuidv4();
    
    const session: AuditSession = {
      id: sessionId,
      status: 'planning',
      startedAt: Date.now(),
    };

    this.activeSessions.set(sessionId, session);
    this.tracer.startTrace(sessionId);

    console.log(`[Orchestrator] Starting audit session: ${sessionId}`);
    this.emit('audit:started', { sessionId, request });

    // Run audit in background
    this.runAudit(sessionId, request).catch(error => {
      console.error(`[Orchestrator] Audit ${sessionId} failed:`, error);
      session.status = 'failed';
      session.error = error.message;
      session.completedAt = Date.now();
      this.emit('audit:failed', { sessionId, error: error.message });
    });

    return sessionId;
  }

  /**
   * Run audit workflow
   */
  private async runAudit(sessionId: string, request: AuditRequest): Promise<void> {
    const session = this.activeSessions.get(sessionId)!;

    try {
      // Step 1: Planning
      session.status = 'planning';
      this.emit('audit:progress', { sessionId, stage: 'planning' });

      const plannerAgent = this.agents.get('planner-agent');
      if (!plannerAgent) {
        throw new Error('Planner agent not found');
      }

      const plan = await plannerAgent.execute({
        sessionId,
        input: { repoPath: request.repoPath },
      });

      this.emit('agent:completed', { 
        sessionId, 
        agentId: 'planner-agent', 
        result: plan 
      });

      // Step 2: Parallel analysis
      session.status = 'running';
      this.emit('audit:progress', { sessionId, stage: 'analysis' });

      const [securityResults, qualityResults, complianceResults] = await Promise.all([
        this.runAgent('security-agent', sessionId, plan),
        this.runAgent('quality-agent', sessionId, plan),
        this.runAgent('compliance-agent', sessionId, { 
          ...plan, 
          frameworks: request.options?.frameworks || ['PCI-DSS']
        }),
      ]);

      // Step 3: Validation
      this.emit('audit:progress', { sessionId, stage: 'validation' });
      
      const validationResults = await this.runAgent('validator-agent', sessionId, {
        securityFindings: securityResults.findings,
        qualityFindings: qualityResults.findings,
      });

      // Step 4: Prioritization
      this.emit('audit:progress', { sessionId, stage: 'prioritization' });
      
      const prioritizationResults = await this.runAgent('prioritizer-agent', sessionId, {
        findings: validationResults.validatedFindings,
        businessContext: request.options,
      });

      // Step 5: Explanation (for top findings)
      this.emit('audit:progress', { sessionId, stage: 'explanation' });
      
      const explainerResults = await this.runAgent('explainer-agent', sessionId, {
        findings: prioritizationResults.prioritizedFindings.slice(0, 10),
      });

      // Step 6: UI Generation
      this.emit('audit:progress', { sessionId, stage: 'ui-generation' });
      
      const uiComposerResults = await this.runAgent('ui-composer-agent', sessionId, {
        findings: prioritizationResults.prioritizedFindings,
        explanations: explainerResults.explanations,
        complianceScore: complianceResults.score,
        remediationPlan: prioritizationResults.remediationPlan,
      });

      // Step 7: Complete
      session.status = 'completed';
      session.completedAt = Date.now();
      session.results = {
        summary: this.calculateSummary(prioritizationResults.prioritizedFindings),
        findings: prioritizationResults.prioritizedFindings,
        complianceScore: complianceResults.score,
        remediationPlan: prioritizationResults.remediationPlan,
        uiSpec: uiComposerResults.uiSpec,
      };

      this.emit('audit:completed', { 
        sessionId, 
        results: session.results,
        duration: session.completedAt - session.startedAt 
      });

      console.log(`[Orchestrator] Audit ${sessionId} completed in ${session.completedAt - session.startedAt}ms`);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Run a single agent
   */
  private async runAgent(agentId: string, sessionId: string, input: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.emit('agent:started', { sessionId, agentId });

    try {
      const result = await agent.execute({ sessionId, input });
      
      this.emit('agent:completed', { sessionId, agentId, result });
      
      return result;
    } catch (error: any) {
      this.emit('agent:failed', { sessionId, agentId, error: error.message });
      throw error;
    }
  }

  /**
   * Get audit session status
   */
  getSession(sessionId: string): AuditSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get execution trace
   */
  getTrace(sessionId: string): any {
    return this.tracer.getTraceTimeline(sessionId);
  }

  /**
   * Calculate findings summary
   */
  private calculateSummary(findings: any[]): AuditResults['summary'] {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalFindings: findings.length,
    };

    findings.forEach(finding => {
      const severity = finding.severity || finding.original_severity;
      if (severity === 'critical') summary.critical++;
      else if (severity === 'high') summary.high++;
      else if (severity === 'medium') summary.medium++;
      else if (severity === 'low') summary.low++;
    });

    return summary;
  }
}
