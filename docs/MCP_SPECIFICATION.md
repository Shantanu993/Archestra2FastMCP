# MCP Tool Specifications

This document defines the MCP (Model Context Protocol) tool servers used in CodeAudit.

---

## Overview

CodeAudit uses **6 custom MCP tool servers** that provide specialized capabilities to AI agents:

1. **CodeAnalysis MCP** - Static analysis and vulnerability scanning
2. **SecurityDB MCP** - CVE database and security knowledge
3. **GitAPI MCP** - Repository analysis and version control
4. **MetricsAnalyzer MCP** - Code quality and performance metrics
5. **ComplianceEngine MCP** - Standards and regulatory compliance
6. **LLMInference MCP** - Claude API wrapper for AI tasks

---

## MCP Tool 1: CodeAnalysis

### Purpose
Performs static application security testing (SAST), code quality analysis, and secret detection.

### Server Configuration

```json
{
  "name": "code-analysis",
  "version": "1.0.0",
  "description": "Static code analysis and vulnerability detection",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8081",
  "capabilities": [
    "sast_scan",
    "detect_secrets",
    "complexity_analysis",
    "dependency_scan"
  ]
}
```

### Tools

#### 1. `sast_scan`

**Description**: Scans code files for security vulnerabilities.

**Input Schema**:
```typescript
{
  files: string[];           // Array of file paths
  language: string;          // "javascript" | "python" | "go" | "java"
  rules?: string[];          // Optional: specific rules to check
  severity_threshold?: string; // "critical" | "high" | "medium" | "low"
}
```

**Output Schema**:
```typescript
{
  findings: Array<{
    id: string;              // Unique finding ID
    type: string;            // "SQL Injection", "XSS", etc.
    severity: string;        // "critical" | "high" | "medium" | "low"
    cwe: string;             // CWE identifier (e.g., "CWE-89")
    file: string;            // File path
    line: number;            // Line number
    column?: number;         // Column number
    code_snippet: string;    // Vulnerable code
    description: string;     // Human-readable description
    confidence: number;      // 0-100 (confidence score)
  }>;
  scan_duration_ms: number;
  files_scanned: number;
}
```

**Example** Usage**:
```typescript
const result = await mcp.invoke('code-analysis', 'sast_scan', {
  files: ['auth/login.js', 'auth/token.js'],
  language: 'javascript',
  rules: ['sql-injection', 'xss', 'command-injection']
});

// Result:
{
  findings: [
    {
      id: "SAST-001",
      type: "SQL Injection",
      severity: "critical",
      cwe: "CWE-89",
      file: "auth/login.js",
      line: 42,
      code_snippet: "const query = `SELECT * FROM users WHERE id = ${userId}`;",
      description: "User input directly concatenated into SQL query",
      confidence: 95
    }
  ],
  scan_duration_ms: 2300,
  files_scanned: 2
}
```

#### 2. `detect_secrets`

**Description**: Scans for hardcoded secrets, API keys, and credentials.

**Input Schema**:
```typescript
{
  files: string[];
  patterns?: string[];      // Custom regex patterns
}
```

**Output Schema**:
```typescript
{
  secrets: Array<{
    type: string;           // "AWS Key", "Stripe Key", "Generic Secret"
    file: string;
    line: number;
    redacted_value: string; // First/last 4 chars only
    entropy_score: number;  // 0-100 (randomness)
  }>;
}
```

#### 3. `complexity_analysis`

**Description**: Calculates code complexity metrics.

**Input Schema**:
```typescript
{
  files: string[];
  language: string;
}
```

**Output Schema**:
```typescript
{
  metrics: Array<{
    file: string;
    functions: Array<{
      name: string;
      cyclomatic_complexity: number;
      cognitive_complexity: number;
      lines_of_code: number;
      parameters: number;
      max_nesting_depth: number;
    }>;
    file_complexity: number;
  }>;
}
```

---

## MCP Tool 2: SecurityDB

### Purpose
Provides access to CVE databases, security advisories, and compliance rules.

### Server Configuration

```json
{
  "name": "security-db",
  "version": "1.0.0",
  "description": "Security database and CVE lookups",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8082"
}
```

### Tools

#### 1. `check_dependencies`

**Description**: Checks package dependencies for known vulnerabilities.

**Input Schema**:
```typescript
{
  manifest_file: string;    // "package.json", "requirements.txt", "go.mod"
  packages?: Array<{        // Or explicit package list
    name: string;
    version: string;
  }>;
}
```

**Output Schema**:
```typescript
{
  vulnerabilities: Array<{
    package: string;
    version: string;
    cve_id: string;         // "CVE-2021-41089"
    cvss_score: number;     // 0-10
    severity: string;       // "critical" | "high" | "medium" | "low"
    description: string;
    published_date: string;
    fixed_in: string;       // Version that fixes the issue
    exploit_available: boolean;
    references: string[];   // URLs to advisories
  }>;
  total_dependencies: number;
  vulnerable_count: number;
}
```

**Example**:
```typescript
const result = await mcp.invoke('security-db', 'check_dependencies', {
  manifest_file: 'package.json'
});

// Result:
{
  vulnerabilities: [
    {
      package: "jsonwebtoken",
      version: "0.8.2",
      cve_id: "CVE-2021-41089",
      cvss_score: 9.1,
      severity: "critical",
      description: "Remote code execution via algorithm confusion",
      fixed_in: "9.0.0",
      exploit_available: true,
      references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-41089"]
    }
  ],
  total_dependencies: 145,
  vulnerable_count: 1
}
```

#### 2. `get_cwe_info`

**Description**: Retrieves detailed information about a CWE.

**Input Schema**:
```typescript
{
  cwe_id: string;  // "CWE-89"
}
```

**Output Schema**:
```typescript
{
  id: string;
  name: string;
  description: string;
  extended_description: string;
  likelihood: string;
  impact: string[];
  mitigations: string[];
  examples: Array<{
    language: string;
    vulnerable_code: string;
    fixed_code: string;
  }>;
}
```

---

## MCP Tool 3: GitAPI

### Purpose
Analyzes repository structure, git history, and code ownership.

### Server Configuration

```json
{
  "name": "git-api",
  "version": "1.0.0",
  "description": "Git repository analysis",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8083"
}
```

### Tools

#### 1. `scan_repository`

**Description**: Scans repository structure and identifies files.

**Input Schema**:
```typescript
{
  repo_path: string;
}
```

**Output Schema**:
```typescript
{
  structure: {
    total_files: number;
    total_lines: number;
    size_mb: number;
    languages: Record<string, {
      file_count: number;
      line_count: number;
      percentage: number;
    }>;
  };
  files: Array<{
    path: string;
    language: string;
    size_bytes: number;
    lines: number;
  }>;
  dependencies: {
    manifest_files: string[];
    lock_files: string[];
  };
}
```

#### 2. `get_recent_changes`

**Description**: Gets recently modified files.

**Input Schema**:
```typescript
{
  repo_path: string;
  days: number;        // Look back N days
  author?: string;     // Filter by author
}
```

**Output Schema**:
```typescript
{
  changed_files: Array<{
    path: string;
    change_count: number;
    last_modified: string;  // ISO timestamp
    authors: string[];
    additions: number;
    deletions: number;
  }>;
}
```

#### 3. `get_file_blame`

**Description**: Gets line-by-line authorship info.

**Input Schema**:
```typescript
{
  repo_path: string;
  file_path: string;
}
```

**Output Schema**:
```typescript
{
  lines: Array<{
    line_number: number;
    content: string;
    author: string;
    commit_hash: string;
    date: string;
  }>;
}
```

---

## MCP Tool 4: MetricsAnalyzer

### Purpose
Calculates code quality metrics, test coverage, and performance analysis.

### Server Configuration

```json
{
  "name": "metrics-analyzer",
  "version": "1.0.0",
  "description": "Code quality and performance metrics",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8084"
}
```

### Tools

#### 1. `get_coverage`

**Description**: Analyzes test coverage.

**Input Schema**:
```typescript
{
  repo_path: string;
  coverage_file?: string;  // Optional: path to coverage report
}
```

**Output Schema**:
```typescript
{
  overall_coverage: number;  // 0-100
  by_module: Record<string, {
    coverage: number;
    lines_covered: number;
    lines_total: number;
  }>;
  uncovered_files: Array<{
    path: string;
    coverage: number;
    critical: boolean;  // Is this a high-risk file?
  }>;
}
```

#### 2. `detect_performance_issues`

**Description**: Identifies performance anti-patterns.

**Input Schema**:
```typescript
{
  files: string[];
  language: string;
}
```

**Output Schema**:
```typescript
{
  issues: Array<{
    type: string;  // "N+1 Query", "Inefficient Loop", "Memory Leak"
    file: string;
    line: number;
    description: string;
    impact: string;  // "High", "Medium", "Low"
    recommendation: string;
  }>;
}
```

#### 3. `estimate_effort`

**Description**: Estimates effort to fix a code issue.

**Input Schema**:
```typescript
{
  finding: {
    type: string;
    file: string;
    severity: string;
  };
}
```

**Output Schema**:
```typescript
{
  estimated_hours: number;
  difficulty: "easy" | "medium" | "hard";
  factors: string[];  // Reasons for estimate
}
```

---

## MCP Tool 5: ComplianceEngine

### Purpose
Maps findings to compliance frameworks and validates adherence.

### Server Configuration

```json
{
  "name": "compliance-engine",
  "version": "1.0.0",
  "description": "Compliance and regulatory standards",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8085"
}
```

### Tools

#### 1. `validate_compliance`

**Description**: Checks code against a compliance framework.

**Input Schema**:
```typescript
{
  findings: Array<Finding>;  // From Security/Quality agents
  framework: "PCI-DSS" | "SOC2" | "HIPAA" | "GDPR" | "ISO27001";
  business_context?: {
    handles_payments: boolean;
    handles_pii: boolean;
    industry: string;
  };
}
```

**Output Schema**:
```typescript
{
  framework: string;
  overall_score: number;  // 0-100
  status: "compliant" | "partial" | "non-compliant";
  requirements: Array<{
    id: string;
    title: string;
    status: "pass" | "fail" | "partial";
    score: number;
    related_findings: string[];  // Finding IDs
    blockers: string[];  // Critical issues blocking compliance
  }>;
  recommendations: string[];
}
```

**Example**:
```typescript
const result = await mcp.invoke('compliance-engine', 'validate_compliance', {
  findings: securityFindings,
  framework: 'PCI-DSS',
  business_context: {
    handles_payments: true,
    handles_pii: true,
    industry: 'e-commerce'
  }
});

// Result:
{
  framework: "PCI-DSS",
  overall_score: 72,
  status: "partial",
  requirements: [
    {
      id: "3.2",
      title: "Do not store sensitive authentication data after authorization",
      status: "fail",
      score: 0,
      related_findings: ["SEC-007"],
      blockers: ["Hardcoded API keys in config.js"]
    },
    {
      id: "6.5",
      title: "Address common coding vulnerabilities in software development",
      status: "partial",
      score: 45,
      related_findings: ["SEC-001", "SEC-002", "SEC-003"]
    }
  ],
  recommendations: [
    "Fix hardcoded credentials to achieve compliance with Requirement 3.2",
    "Remediate SQL injection vulnerabilities for Requirement 6.5"
  ]
}
```

#### 2. `generate_report`

**Description**: Generates compliance audit report.

**Input Schema**:
```typescript
{
  compliance_result: ComplianceResult;
  format: "pdf" | "html" | "json";
}
```

**Output Schema**:
```typescript
{
  report_url: string;  // Download link
  summary: string;
  generated_at: string;
}
```

---

## MCP Tool 6: LLMInference

### Purpose
Wraps Claude API for AI-powered tasks (explanations, impact assessment, code generation).

### Server Configuration

```json
{
  "name": "llm-inference",
  "version": "1.0.0",
  "description": "Claude API wrapper for AI tasks",
  "protocol": "mcp/1.0",
  "transport": "http",
  "endpoint": "http://localhost:8086"
}
```

### Tools

#### 1. `generate_explanation`

**Description**: Generates human-readable explanation of a finding.

**Input Schema**:
```typescript
{
  finding: Finding;
  code_context: string;
  audience: "junior" | "mid" | "senior";
}
```

**Output Schema**:
```typescript
{
  explanation: {
    what: string;         // What is the issue
    why: string;          // Why it matters
    how_to_exploit: string; // Attack scenario
    business_impact: string;
  };
  estimated_tokens: number;
}
```

#### 2. `generate_fix`

**Description**: Generates code fix suggestion.

**Input Schema**:
```typescript
{
  finding: Finding;
  code_snippet: string;
  language: string;
}
```

**Output Schema**:
```typescript
{
  fixed_code: string;
  diff: string;          // Unified diff format
  explanation: string;   // Why this fix works
  alternative_fixes?: string[];
}
```

#### 3. `assess_impact`

**Description**: Assesses business impact of a finding.

**Input Schema**:
```typescript
{
  finding: Finding;
  business_context: {
    industry: string;
    user_base: string;
    revenue_model: string;
  };
}
```

**Output Schema**:
```typescript
{
  business_risk: number;  // 1-10
  financial_impact: string;
  reputational_impact: string;
  regulatory_impact: string;
  justification: string;
}
```

---

## MCP Registry Integration

### Registering Tools

```typescript
// backend/orchestrator/registry.ts
const registry = new MCPRegistry();

// Register CodeAnalysis MCP
registry.register({
  id: 'code-analysis',
  name: 'Code Analysis Server',
  endpoint: 'http://localhost:8081',
  capabilities: ['sast_scan', 'detect_secrets', 'complexity_analysis'],
  healthCheck: 'http://localhost:8081/health',
  authentication: {
    type: 'api-key',
    header: 'X-API-Key'
  },
  rateLimits: {
    requestsPerMinute: 10,
    maxConcurrentRequests: 3
  }
});

// Register all other tools similarly...
```

### Tool Discovery

```typescript
// Agent queries registry
const analysisTools = registry.findByCapability('code_analysis');
// Returns: ['code-analysis']

const securityTools = registry.findByCapability('vulnerability_detection');
// Returns: ['code-analysis', 'security-db']
```

### Tool Invocation via Registry

```typescript
// Agent invokes tool through orchestrator
const result = await orchestrator.invokeTool({
  toolId: 'code-analysis',
  method: 'sast_scan',
  params: { files: [...], language: 'javascript' },
  securityContext: {
    agentId: 'security-agent',
    sessionId: 'abc123',
    userId: 'user-456'
  }
});

// Orchestrator:
// 1. Validates security context (can this agent call this tool?)
// 2. Checks rate limits
// 3. Logs to tracer
// 4. Invokes MCP tool
// 5. Returns result
```

---

## Security & Rate Limiting

### Access Control Matrix

| Agent | CodeAnalysis | SecurityDB | GitAPI | Metrics | Compliance | LLM |
|-------|--------------|------------|--------|---------|------------|-----|
| Planner | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Security | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quality | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Validator | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Prioritizer | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Explainer | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| UI Composer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Rate Limits

```typescript
const rateLimits = {
  'code-analysis': {
    requestsPerMinute: 10,
    maxConcurrentRequests: 3
  },
  'security-db': {
    requestsPerMinute: 20,  // Database lookups are fast
    maxConcurrentRequests: 5
  },
  'llm-inference': {
    requestsPerMinute: 30,  // Claude API limit
    maxConcurrentRequests: 10,
    tokensPerMinute: 100000
  }
};
```

---

## Error Handling

### Standard Error Response

```typescript
{
  error: {
    code: string;     // "RATE_LIMIT_EXCEEDED", "TOOL_UNAVAILABLE"
    message: string;
    details?: any;
    retryable: boolean;
    retry_after_seconds?: number;
  }
}
```

### Example Error Scenarios

```typescript
// Rate limit exceeded
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Tool 'code-analysis' rate limit of 10 req/min exceeded",
    retryable: true,
    retry_after_seconds: 30
  }
}

// Tool unavailable
{
  error: {
    code: "TOOL_UNAVAILABLE",
    message: "MCP server 'security-db' is not responding",
    retryable: true,
    retry_after_seconds: 60
  }
}

// Unauthorized access
{
  error: {
    code: "UNAUTHORIZED",
    message: "Agent 'ui-composer' is not authorized to call 'code-analysis'",
    retryable: false
  }
}
```

---

## Mock Implementations (For Hackathon)

### Quick Mock SAST Scanner

```typescript
// mcp-tools/code-analysis/mock-sast.ts
export function mockSastScan(files: string[]): Finding[] {
  const findings: Finding[] = [];
  
  files.forEach(file => {
    if (file.includes('login') || file.includes('auth')) {
      findings.push({
        id: `SAST-${Math.random()}`,
        type: 'SQL Injection',
        severity: 'critical',
        file,
        line: 42,
        description: 'User input concatenated into SQL query'
      });
    }
  });
  
  return findings;
}
```

### Mock CVE Database

```typescript
// mcp-tools/security-db/mock-cve.ts
const knownVulnerabilities = {
  'jsonwebtoken@0.8.2': {
    cve_id: 'CVE-2021-41089',
    cvss_score: 9.1,
    fixed_in: '9.0.0'
  },
  'lodash@4.17.15': {
    cve_id: 'CVE-2020-8203',
    cvss_score: 7.4,
    fixed_in: '4.17.19'
  }
};
```

---

## Production Integration (Post-Hackathon)

### Real SAST Engines
- **Semgrep** (open-source): `npm install @semgrep/cli`
- **ESLint Security Plugin**: `eslint-plugin-security`
- **Bandit** (Python): `pip install bandit`

### Real CVE Databases
- **OSV.dev API**: `https://osv.dev/v1/query`
- **Snyk API**: Requires API key
- **GitHub Advisory Database**: GraphQL API

### Real Metrics Tools
- **Istanbul/NYC** (JS coverage): `nyc report --reporter=json`
- **SonarQube**: REST API for metrics
- **CodeClimate**: API integration

---

**Next:** See [backend implementation](../backend/) for orchestrator code samples and [frontend implementation](../frontend/) for generative UI components.
