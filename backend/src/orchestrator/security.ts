/**
 * Security Guardrails
 * 
 * Enforces security policies, access control, and input/output sanitization.
 */

export interface AccessControlMatrix {
  [agentId: string]: string[]; // agentId -> allowed toolIds
}

export class SecurityGuardrails {
  private accessControl: AccessControlMatrix;

  constructor() {
    // Define access control matrix
    this.accessControl = {
      'planner-agent': ['git-api', 'metrics-analyzer'],
      'security-agent': ['code-analysis', 'security-db', 'git-api'],
      'quality-agent': ['code-analysis', 'git-api', 'metrics-analyzer'],
      'validator-agent': ['security-db', 'llm-inference'],
      'prioritizer-agent': ['metrics-analyzer', 'compliance-engine', 'llm-inference'],
      'explainer-agent': ['security-db', 'llm-inference'],
      'ui-composer-agent': ['llm-inference'],
    };
  }

  /**
   * Validate agent access to a tool
   */
  validateAgentAccess(agentId: string, toolId: string): boolean {
    const allowedTools = this.accessControl[agentId];
    if (!allowedTools) {
      console.warn(`[Security] Unknown agent: ${agentId}`);
      return false;
    }

    const allowed = allowedTools.includes(toolId);
    if (!allowed) {
      console.warn(`[Security] Agent ${agentId} denied access to ${toolId}`);
    }

    return allowed;
  }

  /**
   * Sanitize tool input to prevent injection attacks
   */
  sanitizeToolInput(params: any): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    const sanitized = { ...params };

    // Path traversal prevention
    if (sanitized.repo_path || sanitized.file_path) {
      const path = sanitized.repo_path || sanitized.file_path;
      if (path.includes('..') || path.includes('~')) {
        throw new Error('Path traversal detected');
      }
    }

    // File path validation (must be within upload directory)
    if (sanitized.files && Array.isArray(sanitized.files)) {
      sanitized.files = sanitized.files.map((file: string) => {
        if (file.includes('..')) {
          throw new Error('Path traversal detected in file list');
        }
        return file;
      });
    }

    // Remove potentially dangerous characters from string inputs
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Remove null bytes, control characters
        sanitized[key] = sanitized[key].replace(/[\x00-\x1F\x7F]/g, '');
      }
    });

    return sanitized;
  }

  /**
   * Filter sensitive data from tool outputs
   */
  filterSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const filtered = JSON.parse(JSON.stringify(data));

    // Recursively filter sensitive patterns
    this.filterObjectRecursive(filtered);

    return filtered;
  }

  private filterObjectRecursive(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Redact API keys, tokens, passwords
        if (this.isSensitiveKey(key)) {
          obj[key] = this.redactSecret(obj[key]);
        }

        // Redact patterns in values
        obj[key] = this.redactPatternsInString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.filterObjectRecursive(obj[key]);
      }
    }
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'secret', 'api_key', 'apikey', 'token',
      'api-key', 'auth', 'credential', 'private_key'
    ];
    return sensitiveKeys.some(sk => key.toLowerCase().includes(sk));
  }

  private redactSecret(value: string): string {
    if (value.length <= 8) {
      return '***';
    }
    // Show first 4 and last 4 characters
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  private redactPatternsInString(str: string): string {
    // AWS keys
    str = str.replace(/AKIA[0-9A-Z]{16}/g, 'AKIA...REDACTED');
    
    // Generic secrets (high entropy strings)
    str = str.replace(/[A-Za-z0-9+/=]{32,}/g, (match) => {
      if (this.hasHighEntropy(match)) {
        return `${match.substring(0, 4)}...REDACTED`;
      }
      return match;
    });

    return str;
  }

  private hasHighEntropy(str: string): boolean {
    const charCounts = new Map<string, number>();
    for (const char of str) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const count of charCounts.values()) {
      const p = count / str.length;
      entropy -= p * Math.log2(p);
    }

    // High entropy threshold (roughly > 4 bits per char)
    return entropy > 4;
  }

  /**
   * Validate session belongs to user
   */
  validateSession(sessionId: string, userId?: string): boolean {
    // TODO: Implement session validation against database
    // For now, just check format
    return sessionId.length > 0;
  }
}
