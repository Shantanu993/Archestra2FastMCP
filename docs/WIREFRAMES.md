# CodeAudit: UI Wireframes & Flow

This document describes the user interface design, component specifications, and user interaction flows for CodeAudit's generative UI platform.

---

## UI Philosophy

**Generative UI Principles:**
1. **Progressive Disclosure**: UI components appear as agents complete tasks
2. **Contextual Actions**: Buttons and options generated based on findings
3. **Real-time Updates**: Dashboard evolves as analysis progresses
4. **Intelligent Defaults**: Most important information surfaces first
5. **Actionable Insights**: Every finding has a clear next step

---

## Wireframe 1: Initial Upload Screen

```
┌────────────────────────────────────────────────────────────────┐
│  CodeAudit                                    [Settings] [Help] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                  🔍 Intelligent Code Audit                     │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐   │
│   │                                                       │   │
│   │         📁  Drag & drop your repository              │   │
│   │             or click to browse                       │   │
│   │                                                       │   │
│   │         Supported: .zip, .tar.gz, Git URL            │   │
│   │                                                       │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│                        OR                                      │
│                                                                │
│   ┌────────────────────────────────────────────┐              │
│   │  🔗 Connect GitHub/GitLab                  │              │
│   └────────────────────────────────────────────┘              │
│                                                                │
│   Recent Audits:                                              │
│   • nodejs-api (2 days ago) - 12 critical issues              │
│   • payment-service (1 week ago) - Compliant ✅               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 2: Analysis in Progress (Streaming UI)

```
┌────────────────────────────────────────────────────────────────────────┐
│  CodeAudit    nodejs-api                      [Pause] [Cancel] [Logs] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  📊 Analyzing nodejs-api (150 files, 12.3 MB)                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Progress: ████████████████░░░░░░░░░░░░░░░░  58%                │ │
│  │  Estimated time remaining: 1m 45s                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Agent Activity:                                                       │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ ✅ Planner Agent          Completed in 0.8s                │       │
│  │    → Identified 3 high-risk modules                        │       │
│  │                                                             │       │
│  │ 🔄 Security Agent         Running... (12s elapsed)         │       │
│  │    → Scanning auth/ (42 files)                             │       │
│  │    → Found 5 vulnerabilities so far                        │       │
│  │      • SQL Injection (auth/login.js)                       │       │
│  │      • Hardcoded Secret (config.js)                        │       │
│  │                                                             │       │
│  │ 🔄 Quality Agent          Running... (8s elapsed)          │       │
│  │    → Analyzing code complexity                             │       │
│  │    → Coverage check in progress                            │       │
│  │                                                             │       │
│  │ ⏳ Validator Agent        Waiting for dependencies...      │       │
│  │                                                             │       │
│  │ ⏳ Prioritizer Agent      Queued                           │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                        │
│  Live Preview: (updates as findings arrive)                           │
│  ┌────────┬────────┬────────┬────────┐                               │
│  │  🔴 5  │  🟠 8  │  🟡 12 │  🔵 3  │                               │
│  │Critical│  High  │ Medium │  Low   │                               │
│  └────────┴────────┴────────┴────────┘                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Real-time agent status updates
- Streaming findings as they're discovered
- Live severity counters
- Transparent progress tracking

---

## Wireframe 3: Main Dashboard (Complete Audit)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CodeAudit    nodejs-api    Audited: 2min ago    [Re-scan] [Export] [Settings] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Overview                                                                       │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┬──────────────┐    │
│  │ 🔴 Critical │ 🟠 High     │ 🟡 Medium   │ ✅ Passed    │ 📊 Score     │    │
│  │     2       │     8       │    15       │    125       │   72%        │    │
│  │   ▼ -1      │   ▲ +2      │   ═ 0       │              │   PCI-DSS    │    │
│  └─────────────┴─────────────┴─────────────┴──────────────┴──────────────┘    │
│                                                                                 │
│  🚨 Fix These First    [Filter: All ▼] [Sort: Priority ▼]                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  1. SQL Injection in Login Endpoint                           🔴 CRITICAL │ │
│  │     📄 auth/login.js:42                                                    │ │
│  │     ⏱️ 30 min  |  💥 Data breach risk  |  CWE-89  |  CVSS 9.8            │ │
│  │                                                                            │ │
│  │     User input concatenated into SQL query without sanitization.          │ │
│  │     Attacker can bypass auth or steal data.                               │ │
│  │                                                                            │ │
│  │     [🔍 View Code]  [✨ Apply Fix]  [👤 Assign]  [📚 Learn More]         │ │
│  │     ───────────────────────────────────────────────────────────────────   │ │
│  │     💡 Similar issue found in 2 other files. Fix all?  [Yes] [No]         │ │
│  │                                                                            │ │
│  │     [▼ Show Details]                                                       │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  2. Hardcoded Stripe API Key                                  🔴 CRITICAL │ │
│  │     📄 config/stripe.js:8                                                  │ │
│  │     ⏱️ 5 min  |  💰 Financial exposure  |  CWE-798                        │ │
│  │                                                                            │ │
│  │     Stripe secret key committed to repository. Anyone with repo access    │ │
│  │     can charge customers or access payment data.                          │ │
│  │                                                                            │ │
│  │     [🔍 View Code]  [✨ Move to .env]  [🔄 Rotate Key]  [👤 Assign]      │ │
│  │                                                                            │ │
│  │     ⚠️ Key is public in Git history. MUST rotate immediately.             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  3. Missing Rate Limiting on Login                                🟠 HIGH │ │
│  │     📄 auth/login.js:15                                                    │ │
│  │     ⏱️ 45 min  |  🔓 Brute force risk  |  CWE-307                         │ │
│  │                                                                            │ │
│  │     No rate limiting on authentication endpoint. Attacker can attempt     │ │
│  │     unlimited password guesses.                                           │ │
│  │                                                                            │ │
│  │     [🔍 View Code]  [✨ Add Rate Limiter]  [👤 Assign]                    │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  [Load 5 more high priority issues...]                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Generative Elements:**
- **Action buttons adapt** to finding type:
  - SQL Injection → "Apply Fix" generates parameterized query
  - Hardcoded secret → "Move to .env" + "Rotate Key"
  - Rate limiting → "Add Rate Limiter" suggests express-rate-limit
- **Contextual warnings** appear based on severity/context
- **Smart recommendations** link related findings

---

## Wireframe 4: Expanded Finding Details (Modal)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SQL Injection in Login Endpoint                               [✕ Close] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔴 CRITICAL  |  CWE-89  |  CVSS Score: 9.8  |  Priority: 1            │
│                                                                         │
│  ┌─ What's Wrong? ─────────────────────────────────────────────────┐  │
│  │  Your code at line 42 builds a SQL query by combining strings.  │  │
│  │  This lets attackers inject malicious SQL commands.             │  │
│  │                                                                  │  │
│  │  Example attack:                                                │  │
│  │    Username: admin' OR '1'='1                                   │  │
│  │    → Bypasses authentication, logs in as admin                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Vulnerable Code ────────────────────────────────────────────────┐  │
│  │  📄 auth/login.js (lines 40-45)                                  │  │
│  │                                                                   │  │
│  │  40 │ async function login(username, password) {                │  │
│  │  41 │   // ❌ VULNERABLE: User input in template string         │  │
│  │❗42 │   const query = `SELECT * FROM users                       │  │
│  │     │                  WHERE username = '${username}'            │  │
│  │     │                  AND password = '${password}'`;            │  │
│  │  43 │   const user = await db.query(query);                     │  │
│  │  44 │   return user;                                             │  │
│  │  45 │ }                                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ How to Fix ─────────────────────────────────────────────────────┐  │
│  │  ✅ Use parameterized queries (recommended)                      │  │
│  │                                                                   │  │
│  │  40 │ async function login(username, password) {                │  │
│  │  41 │   // ✅ SAFE: Parameterized query                         │  │
│  │  42 │   const query = 'SELECT * FROM users                      │  │
│  │     │                  WHERE username = ? AND password = ?';    │  │
│  │  43 │   const user = await db.query(query, [username, password]);│ │
│  │  44 │   return user;                                             │  │
│  │  45 │ }                                                          │  │
│  │                                                                   │  │
│  │  Why this works:                                                 │  │
│  │  The ? placeholders treat user input as DATA, not SQL CODE.     │  │
│  │  Database driver automatically escapes special characters.      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Impact ─────────────────────────────────────────────────────────┐  │
│  │  💥 Attackers can:                                               │  │
│  │     • Bypass authentication (access any account)                │  │
│  │     • Steal all user data (passwords, emails, PII)              │  │
│  │     • Delete or modify database records                         │  │
│  │     • Execute admin commands                                    │  │
│  │                                                                   │  │
│  │  📊 Business Risk:                                               │  │
│  │     • GDPR violation (€20M fine)                                │  │
│  │     • PCI-DSS non-compliance (lose payment processing)          │  │
│  │     • Reputational damage                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Additional Steps ───────────────────────────────────────────────┐  │
│  │  1. Add input validation using express-validator                │  │
│  │  2. Implement prepared statements for all queries               │  │
│  │  3. Use an ORM (Sequelize, TypeORM) to prevent SQL injection    │  │
│  │  4. Add Web Application Firewall (WAF) for defense-in-depth     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  📚 Learn More:                                                        │
│     • OWASP SQL Injection Guide                                       │
│     • MySQL Prepared Statements Docs                                  │
│     • Tutorial: Securing Node.js APIs                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [✨ Apply Fix Automatically]  [📋 Copy Fixed Code]  [👤 Assign] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Generative Content:**
- Explanation generated by Explainer Agent
- Code diff dynamically created
- Impact assessment tailored to business context
- Remediation steps specific to language/framework

---

## Wireframe 5: Security Heatmap (Sidebar)

```
┌──────────────────────────────────────┐
│  🗺️ Vulnerability Hotspots          │
├──────────────────────────────────────┤
│                                      │
│  Click a module to filter issues    │
│                                      │
│  auth/                               │
│  ┌────────────────────────────────┐ │
│  │ 🔴🔴 🟠🟠🟠 🟡🟡🟡🟡🟡        │ │
│  │ 2 critical, 3 high, 5 medium   │ │
│  └────────────────────────────────┘ │
│  [Click to view auth/ issues]       │
│                                      │
│  api/payments/                       │
│  ┌────────────────────────────────┐ │
│  │ 🟠 🟡🟡                         │ │
│  │ 1 high, 2 medium               │ │
│  └────────────────────────────────┘ │
│                                      │
│  api/users/                          │
│  ┌────────────────────────────────┐ │
│  │ 🟡🟡🟡🟡 🔵🔵                   │ │
│  │ 4 medium, 2 low                │ │
│  └────────────────────────────────┘ │
│                                      │
│  db/                                 │
│  ┌────────────────────────────────┐ │
│  │ 🟡 🔵                           │ │
│  │ 1 medium, 1 low                │ │
│  └────────────────────────────────┘ │
│                                      │
│  ✅ lib/, utils/, config/           │
│     No critical issues               │
│                                      │
└──────────────────────────────────────┘
```

---

## Wireframe 6: Compliance Scorecard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Compliance Dashboard                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PCI-DSS Compliance                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Overall: 72%  ████████████████░░░░░░░              │    │
│  │  ▲ +5% since last audit                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Requirements:                                              │
│  ✅ 1.1  Install and maintain firewall         100%        │
│  ✅ 2.1  Change default passwords              100%        │
│  ❌ 3.2  Do not store sensitive auth data       0%  ←FIX  │
│  ⚠️ 6.5  Address common vulnerabilities         45%        │
│  ✅ 8.1  Assign unique ID to each user         100%        │
│  ❌ 10.1 Implement audit trails                 30%        │
│                                                             │
│  🚨 Blocking Issues (must fix to pass):                    │
│  • Hardcoded Stripe key (Req 3.2)                          │
│  • Missing access logs (Req 10.1)                          │
│                                                             │
│  [Generate Compliance Report PDF]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Wireframe 7: Remediation Plan View

```
┌──────────────────────────────────────────────────────────────────┐
│  📋 Remediation Plan                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔥 Critical Blockers (Fix Today)            Total: 1 hour      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ☐ SEC-001  SQL Injection (login)          30 min          │ │
│  │  ☐ SEC-007  Hardcoded Stripe key           5 min           │ │
│  │  ☐ SEC-009  Rotate exposed keys            25 min          │ │
│  │                                                             │ │
│  │  [✨ Fix All Critical Issues]                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ⚡ Quick Wins (Fix This Sprint)             Total: 3 hours    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ☐ QUAL-003  Add input validation          45 min          │ │
│  │  ☐ SEC-004   Enable HTTPS redirect         15 min          │ │
│  │  ☐ QUAL-008  Fix code complexity (3 files)  2 hr           │ │
│  │                                                             │ │
│  │  [Assign to Sprint]                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📚 Technical Debt (Backlog)                 Total: 20 hours   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  15 medium/low priority issues                             │ │
│  │  [View All] [Export to Jira]                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Preventive Measures:                                        │
│     • Set up pre-commit hooks for secret detection             │
│     • Add CI/CD security gates                                 │
│     • Schedule weekly automated audits                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 8: Execution Trace Viewer

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔍 Execution Trace    Session: abc123    Duration: 3m 42s          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Timeline View:   [▶ Play]  [⏸ Pause]  [Filter ▼]                 │
│                                                                     │
│  0.00s  ┌─ Orchestrator: start_audit                              │
│         │  Input: { repo: "nodejs-api", files: 150 }              │
│         │                                                          │
│  0.10s  ├─┬─ Planner Agent: analyze_scope                         │
│         │ │                                                        │
│  0.15s  │ └──┬─ MCP: git_api.scan_repository                      │
│         │    │  Duration: 150ms                                   │
│         │    │  Output: { files: [...], structure: {...} }        │
│         │                                                          │
│  0.30s  │ ✅ Planner complete                                     │
│         │    Output: { priority_modules: [...], est: 4min }       │
│         │                                                          │
│  0.35s  ├─┬─ Security Agent: sast_scan  (parallel)                │
│         │ │                                                        │
│  0.40s  │ └──┬─ MCP: code_analysis.sast_scan                      │
│         │    │  Files: ["auth/login.js", ...]                     │
│         │    │  Duration: 2.3s                                    │
│  2.70s  │    │  ✅ Found 6 vulnerabilities                       │
│         │                                                          │
│  2.80s  │    └─ MCP: security_db.check_cve                        │
│         │       Duration: 800ms                                   │
│  3.60s  │       ✅ Found 1 vulnerable dependency                 │
│         │                                                          │
│  0.35s  ├─┬─ Quality Agent: metrics_check  (parallel)             │
│  ...    │ │                                                        │
│                                                                     │
│  [Expand All]  [Collapse All]  [Export Trace]                     │
│                                                                     │
│  Stats:                                                            │
│  • Total duration: 3m 42s                                          │
│  • Agent invocations: 7                                            │
│  • MCP tool calls: 18                                              │
│  • Peak memory: 512 MB                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Interaction Flows

### Flow 1: Upload → Audit → Fix

```
1. User uploads nodejs-api.zip
   ↓
2. Planner Agent analyzes (10s)
   → UI shows: "Found 150 files, estimated 4 min"
   ↓
3. Progress dashboard appears
   → Real-time updates as agents run
   → Counters increment: "🔴 2 → 🔴 3 → 🔴 5"
   ↓
4. Audit completes (3m 45s)
   → Dashboard fully rendered with prioritized findings
   ↓
5. User clicks "SQL Injection" card
   → Modal opens with detailed explanation
   → Shows vulnerable code + fixed code
   ↓
6. User clicks [✨ Apply Fix]
   → Backend generates code patch
   → UI shows diff preview
   → User confirms
   ↓
7. Fix applied
   → Dashboard updates: "🔴 4 critical" (was 5)
   → Compliance score updates: "74%" (was 72%)
   → Toast: "Fix applied! Run tests to verify."
```

### Flow 2: Filter & Explore

```
1. Dashboard shows 25 total findings
   ↓
2. User clicks "auth/" in heatmap
   → Findings filtered to show only auth/ issues
   → URL updates: /audit/abc123?module=auth
   ↓
3. User selects filter: "Show only HIGH severity"
   → UI re-renders with 3 high-severity auth issues
   ↓
4. User clicks [Sort: Effort ▼]
   → Issues re-sort: lowest effort first
   ↓
5. User clicks "Fix All Quick Wins" button
   → Batch action modal appears
   → Shows 3 issues fixable in <1 hour
   → User confirms
   ↓
6. Fixes applied in sequence
   → Progress bar shows 1/3, 2/3, 3/3
   → Dashboard updates in real-time
```

### Flow 3: Compliance Report

```
1. User clicks "Compliance" tab
   ↓
2. UI Composer Agent generates compliance view
   → Shows PCI-DSS scorecard
   → Highlights blocking issues
   ↓
3. User clicks "Why 72%?"
   → Explanation modal:
     "You're failing Requirement 3.2 (store auth data).
      Fix hardcoded Stripe key to reach 85%."
   ↓
4. User clicks [Generate Report PDF]
   → Backend creates formatted report
   → Download starts: "PCI-DSS-Audit-2026-02-15.pdf"
```

---

## Component Specifications (For Frontend)

### 1. Issue Card Component

```typescript
interface IssueCardProps {
  finding: {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: string;
    line: number;
    impact: string;
    effort_hours: number;
    explanation: string;
    code_snippet: string;
    fixed_code?: string;
  };
  actions: Action[];
  onAction: (actionId: string) => void;
  expandable?: boolean;
}

// Usage
<IssueCard
  finding={securityFinding}
  actions={[
    { id: 'view_code', label: 'View Code', icon: 'eye' },
    { id: 'apply_fix', label: 'Apply Fix', icon: 'wand', primary: true },
    { id: 'assign', label: 'Assign', icon: 'user' }
  ]}
  onAction={handleAction}
  expandable={true}
/>
```

### 2. Progress Stream Component

```typescript
interface ProgressStreamProps {
  sessionId: string;
  onComplete: (results: AuditResults) => void;
}

// Connects to WebSocket
// Renders real-time agent updates
<ProgressStream
  sessionId="abc123"
  onComplete={(results) => renderDashboard(results)}
/>
```

### 3. Heatmap Component

```typescript
interface HeatmapProps {
  modules: Array<{
    name: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
  onModuleClick: (moduleName: string) => void;
}

<Heatmap
  modules={moduleFindings}
  onModuleClick={(name) => filterByModule(name)}
/>
```

---

## Responsive Design

### Desktop (1920x1080)
- 3-column layout: Heatmap (sidebar) | Findings (main) | Trace (sidebar)
- All details visible

### Tablet (768x1024)
- 2-column layout: Findings | Heatmap (collapsible)
- Trace accessible via tab

### Mobile (375x667)
- Single column
- Swipe between: Findings → Heatmap → Trace
- Simplified cards (fewer action buttons)

---

## Accessibility

- **Keyboard Navigation**: All actions accessible via Tab/Enter
- **Screen Readers**: Severity announced ("Critical security issue")
- **Color Blindness**: Icons supplement color (🔴 + "Critical" text)
- **High Contrast Mode**: Borders and text remain visible

---

## Animation & Transitions

### Streaming Findings
```css
.finding-card {
  animation: slideIn 0.3s ease-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Counter Updates
```typescript
// Animated counter: 5 → 6
<CountUp start={5} end={6} duration={0.5} />
```

### Progress Bar
```css
.progress-bar {
  transition: width 0.5s ease-out;
}
```

---

## Dark Mode Support

All components support dark mode via CSS variables:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --severity-critical: #dc2626;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #f5f5f5;
  --severity-critical: #f87171;
}
```

---

**Next:** See [MCP_SPECIFICATION.md](./MCP_SPECIFICATION.md) for MCP tool API details and [backend implementation samples](../backend/).
