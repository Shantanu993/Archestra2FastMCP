/**
 * Base Agent Class
 * 
 * Abstract class that all agents extend.
 */

import { MCPRegistry } from '../orchestrator/registry';
import { ExecutionTracer } from '../orchestrator/tracing';

export interface AgentContext {
  sessionId: string;
  input: any;
}

export interface AgentResult {
  [key: string]: any;
}

export abstract class BaseAgent {
  public readonly id: string;
  public readonly name: string;
  protected registry: MCPRegistry;
  protected tracer: ExecutionTracer;

  constructor(
    id: string,
    name: string,
    registry: MCPRegistry,
    tracer: ExecutionTracer
  ) {
    this.id = id;
    this.name = name;
    this.registry = registry;
    this.tracer = tracer;
  }

  /**
   * Execute agent logic
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    const spanId = this.tracer.startSpan({
      component: 'agent',
      componentId: this.id,
      action: 'execute',
      parentSpanId: context.sessionId,
      input: context.input,
    });

    try {
      console.log(`[${this.id}] Starting execution`);
      
      const result = await this.run(context);
      
      this.tracer.endSpan(spanId, { output: result });
      
      console.log(`[${this.id}] Execution completed`);
      
      return result;
    } catch (error: any) {
      this.tracer.endSpan(spanId, { error: error.message });
      console.error(`[${this.id}] Execution failed:`, error.message);
      throw error;
    }
  }

  /**
   * Agent-specific logic (implemented by subclasses)
   */
  protected abstract run(context: AgentContext): Promise<AgentResult>;

  /**
   * Helper: Invoke MCP tool
   */
  protected async invokeTool(
    toolId: string,
    method: string,
    params: any,
    sessionId: string
  ): Promise<any> {
    const result = await this.registry.invokeTool({
      toolId,
      method,
      params,
      securityContext: {
        agentId: this.id,
        sessionId,
      },
    });

    if (!result.success) {
      throw new Error(`Tool invocation failed: ${result.error?.message}`);
    }

    return result.data;
  }
}
