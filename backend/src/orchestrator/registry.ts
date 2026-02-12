/**
 * MCP Tool Registry
 * 
 * Centralized registry for all MCP tool servers.
 * Handles tool discovery, validation, and invocation.
 */

import axios from 'axios';
import { SecurityGuardrails } from './security';
import { ExecutionTracer } from './tracing';

export interface MCPToolDefinition {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[];
  healthCheck: string;
  authentication?: {
    type: 'api-key' | 'oauth' | 'none';
    header?: string;
    token?: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    maxConcurrentRequests: number;
  };
}

export interface ToolInvocationRequest {
  toolId: string;
  method: string;
  params: any;
  securityContext: {
    agentId: string;
    sessionId: string;
    userId?: string;
  };
}

export interface ToolInvocationResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata: {
    duration_ms: number;
    tool_id: string;
    method: string;
  };
}

export class MCPRegistry {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private rateLimitTrackers: Map<string, RateLimitTracker> = new Map();
  private security: SecurityGuardrails;
  private tracer: ExecutionTracer;

  constructor(security: SecurityGuardrails, tracer: ExecutionTracer) {
    this.security = security;
    this.tracer = tracer;
  }

  /**
   * Register a new MCP tool server
   */
  register(tool: MCPToolDefinition): void {
    // Validate tool definition
    if (!tool.id || !tool.endpoint || !tool.capabilities) {
      throw new Error('Invalid tool definition');
    }

    this.tools.set(tool.id, tool);
    this.rateLimitTrackers.set(tool.id, new RateLimitTracker(tool.rateLimits));
    
    console.log(`[Registry] Registered MCP tool: ${tool.id} (${tool.capabilities.join(', ')})`);
  }

  /**
   * Find tools by capability
   */
  findByCapability(capability: string): MCPToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool =>
      tool.capabilities.includes(capability)
    );
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): MCPToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Invoke a tool method
   */
  async invokeTool(request: ToolInvocationRequest): Promise<ToolInvocationResult> {
    const startTime = Date.now();
    const { toolId, method, params, securityContext } = request;

    // Create trace span
    const spanId = this.tracer.startSpan({
      component: 'mcp-tool',
      componentId: toolId,
      action: method,
      parentSpanId: securityContext.sessionId,
      input: params,
    });

    try {
      // 1. Get tool definition
      const tool = this.getTool(toolId);
      if (!tool) {
        throw new Error(`Tool ${toolId} not found in registry`);
      }

      // 2. Security validation
      const authorized = this.security.validateAgentAccess(
        securityContext.agentId,
        toolId
      );
      if (!authorized) {
        throw new Error(`Agent ${securityContext.agentId} not authorized to access ${toolId}`);
      }

      // 3. Rate limiting
      const rateLimiter = this.rateLimitTrackers.get(toolId)!;
      if (!rateLimiter.allowRequest(securityContext.sessionId)) {
        throw new Error(`Rate limit exceeded for ${toolId}`);
      }

      // 4. Input sanitization
      const sanitizedParams = this.security.sanitizeToolInput(params);

      // 5. Invoke tool via HTTP
      const response = await this.callToolAPI(tool, method, sanitizedParams);

      // 6. Output filtering
      const filteredOutput = this.security.filterSensitiveData(response);

      const duration = Date.now() - startTime;

      // 7. Complete trace
      this.tracer.endSpan(spanId, {
        output: filteredOutput,
        duration,
      });

      return {
        success: true,
        data: filteredOutput,
        metadata: {
          duration_ms: duration,
          tool_id: toolId,
          method,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Log error in trace
      this.tracer.endSpan(spanId, {
        error: error.message,
        duration,
      });

      return {
        success: false,
        error: {
          code: error.code || 'TOOL_INVOCATION_ERROR',
          message: error.message,
          retryable: this.isRetryableError(error),
        },
        metadata: {
          duration_ms: duration,
          tool_id: toolId,
          method,
        },
      };
    }
  }

  /**
   * Call MCP tool via HTTP API
   */
  private async callToolAPI(tool: MCPToolDefinition, method: string, params: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication if required
    if (tool.authentication?.type === 'api-key') {
      headers[tool.authentication.header!] = tool.authentication.token!;
    }

    const response = await axios.post(
      `${tool.endpoint}/${method}`,
      params,
      {
        headers,
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'RATE_LIMIT_EXCEEDED'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Health check all tools
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [toolId, tool] of this.tools.entries()) {
      try {
        await axios.get(tool.healthCheck, { timeout: 5000 });
        results[toolId] = true;
      } catch {
        results[toolId] = false;
        console.warn(`[Registry] Health check failed for ${toolId}`);
      }
    }

    return results;
  }
}

/**
 * Rate limit tracker
 */
class RateLimitTracker {
  private requestCounts: Map<string, number[]> = new Map();
  private config: { requestsPerMinute: number; maxConcurrentRequests: number };

  constructor(config: { requestsPerMinute: number; maxConcurrentRequests: number }) {
    this.config = config;
  }

  allowRequest(key: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get recent requests for this key
    let timestamps = this.requestCounts.get(key) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(ts => ts > oneMinuteAgo);

    // Check rate limit
    if (timestamps.length >= this.config.requestsPerMinute) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requestCounts.set(key, timestamps);

    return true;
  }
}
