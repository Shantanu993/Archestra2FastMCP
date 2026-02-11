/**
 * Security Analyzer Agent
 * 
 * Identifies security vulnerabilities and compliance issues.
 */

import { BaseAgent, AgentContext, AgentResult } from './base';

export class SecurityAnalyzerAgent extends BaseAgent {
  protected async run(context: AgentContext): Promise<AgentResult> {
    const { files_to_scan, file_summary } = context.input;

    console.log(`[${this.id}] Analyzing ${files_to_scan.length} files for security issues`);

    // Step 1: SAST scan
    const sastResults = await this.runSASTScan(files_to_scan, context.sessionId);

    // Step 2: Secret detection
    const secrets = await this.detectSecrets(files_to_scan, context.sessionId);

    // Step 3: Dependency vulnerability check
    const dependencyVulns = await this.checkDependencies(context.sessionId);

    // Combine all findings
    const findings = [
      ...sastResults.findings,
      ...this.convertSecretsToFindings(secrets.secrets),
      ...this.convertDependencyVulnsToFindings(dependencyVulns.vulnerabilities),
    ];

    // Categorize by severity
    const summary = this.categorizeBySeverity(findings);

    console.log(`[${this.id}] Found ${findings.length} security issues (${summary.critical} critical)`);

    return {
      findings,
      summary,
      secrets_found: secrets.secrets.length,
      vulnerable_dependencies: dependencyVulns.vulnerable_count,
    };
  }

  private async runSASTScan(files: string[], sessionId: string): Promise<any> {
    // Detect primary language
    const languages = this.detectLanguages(files);
    const primaryLanguage = languages[0] || 'javascript';

    return await this.invokeTool(
      'code-analysis',
      'sast_scan',
      {
        files: files.slice(0, 100), // Limit for demo
        language: primaryLanguage,
        rules: ['sql-injection', 'xss', 'command-injection', 'path-traversal'],
      },
      sessionId
    );
  }

  private async detectSecrets(files: string[], sessionId: string): Promise<any> {
    return await this.invokeTool(
      'code-analysis',
      'detect_secrets',
      { files: files.slice(0, 100) },
      sessionId
    );
  }

  private async checkDependencies(sessionId: string): Promise<any> {
    // For demo, check package.json
    return await this.invokeTool(
      'security-db',
      'check_dependencies',
      { manifest_file: 'package.json' },
      sessionId
    );
  }

  private detectLanguages(files: string[]): string[] {
    const extensions: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
    };

    const langCounts: Record<string, number> = {};

    files.forEach(file => {
      const ext = file.substring(file.lastIndexOf('.'));
      const lang = extensions[ext];
      if (lang) {
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      }
    });

    return Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);
  }

  private convertSecretsToFindings(secrets: any[]): any[] {
    return secrets.map(secret => ({
      id: `SECRET-${Math.random().toString(36).substr(2, 9)}`,
      type: 'Hardcoded Secret',
      severity: 'critical',
      cwe: 'CWE-798',
      file: secret.file,
      line: secret.line,
      description: `${secret.type} found in source code`,
      secret_type: secret.type,
    }));
  }

  private convertDependencyVulnsToFindings(vulns: any[]): any[] {
    return vulns.map(vuln => ({
      id: vuln.cve_id,
      type: 'Vulnerable Dependency',
      severity: vuln.severity,
      cwe: 'CWE-1035',
      description: `${vuln.package}@${vuln.version}: ${vuln.description}`,
      package: vuln.package,
      cvss_score: vuln.cvss_score,
      fix: vuln.fixed_in,
    }));
  }

  private categorizeBySeverity(findings: any[]): Record<string, number> {
    return {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };
  }
}
