/**
 * Execution Tracer
 * 
 * Records all agent and tool invocations for observability and debugging.
 */

export interface TraceEntry {
  traceId: string;           // Audit session ID
  spanId: string;            // Unique step ID
  parentSpanId?: string;     // Parent step (for nesting)
  timestamp: number;
  duration?: number;
  
  // What happened
  component: 'agent' | 'orchestrator' | 'mcp-tool';
  componentId: string;       // e.g., "security-agent"
  action: string;            // e.g., "invoke_sast_scan"
  
  // Context
  input: any;                // Sanitized request data
  output?: any;              // Sanitized response
  error?: string;
  
  // Metadata
  tags: Record<string, string>;
}

export interface StartSpanParams {
  component: 'agent' | 'orchestrator' | 'mcp-tool';
  componentId: string;
  action: string;
  parentSpanId?: string;
  input?: any;
  tags?: Record<string, string>;
}

export class ExecutionTracer {
  private traces: Map<string, TraceEntry[]> = new Map();
  private activeSpans: Map<string, TraceEntry> = new Map();

  /**
   * Start a new trace session
   */
  startTrace(traceId: string): void {
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, []);
      console.log(`[Tracer] Started trace: ${traceId}`);
    }
  }

  /**
   * Start a new span
   */
  startSpan(params: StartSpanParams): string {
    const spanId = this.generateSpanId();
    const traceId = params.parentSpanId || spanId;

    const entry: TraceEntry = {
      traceId,
      spanId,
      parentSpanId: params.parentSpanId,
      timestamp: Date.now(),
      component: params.component,
      componentId: params.componentId,
      action: params.action,
      input: this.sanitizeForLogging(params.input),
      tags: params.tags || {},
    };

    this.activeSpans.set(spanId, entry);

    // Ensure trace exists
    if (!this.traces.has(traceId)) {
      this.startTrace(traceId);
    }

    return spanId;
  }

  /**
   * End a span
   */
  endSpan(spanId: string, result: { output?: any; error?: string; duration?: number }): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`[Tracer] Span ${spanId} not found`);
      return;
    }

    // Complete span
    span.duration = result.duration || (Date.now() - span.timestamp);
    span.output = result.output ? this.sanitizeForLogging(result.output) : undefined;
    span.error = result.error;

    // Add to trace
    const trace = this.traces.get(span.traceId);
    if (trace) {
      trace.push({ ...span });
    }

    this.activeSpans.delete(spanId);

    console.log(
      `[Tracer] ${span.component}/${span.componentId}/${span.action} completed in ${span.duration}ms`
    );
  }

  /**
   * Get trace for a session
   */
  getTrace(traceId: string): TraceEntry[] {
    return this.traces.get(traceId) || [];
  }

  /**
   * Get trace timeline (formatted for UI)
   */
  getTraceTimeline(traceId: string): TraceTimeline {
    const entries = this.getTrace(traceId);
    if (entries.length === 0) {
      return { traceId, duration: 0, spans: [] };
    }

    const startTime = Math.min(...entries.map(e => e.timestamp));
    const endTime = Math.max(...entries.map(e => e.timestamp + (e.duration || 0)));

    return {
      traceId,
      duration: endTime - startTime,
      spans: entries.map(e => ({
        spanId: e.spanId,
        parentSpanId: e.parentSpanId,
        relativeStartTime: e.timestamp - startTime,
        duration: e.duration || 0,
        component: e.component,
        componentId: e.componentId,
        action: e.action,
        status: e.error ? 'error' : 'success',
        error: e.error,
      })),
    };
  }

  /**
   * Export trace as JSON
   */
  exportTrace(traceId: string): string {
    const entries = this.getTrace(traceId);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Clear old traces (keep last 24 hours)
   */
  cleanupOldTraces(): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const [traceId, entries] of this.traces.entries()) {
      const latestTimestamp = Math.max(...entries.map(e => e.timestamp));
      if (latestTimestamp < oneDayAgo) {
        this.traces.delete(traceId);
        console.log(`[Tracer] Cleaned up old trace: ${traceId}`);
      }
    }
  }

  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private sanitizeForLogging(data: any): any {
    if (data === undefined || data === null) {
      return data;
    }

    // Limit size to prevent huge logs
    const str = JSON.stringify(data);
    if (str.length > 1000) {
      return `[Large object: ${str.length} bytes]`;
    }

    return data;
  }
}

export interface TraceTimeline {
  traceId: string;
  duration: number;
  spans: Array<{
    spanId: string;
    parentSpanId?: string;
    relativeStartTime: number;
    duration: number;
    component: string;
    componentId: string;
    action: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}
