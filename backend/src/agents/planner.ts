/**
 * Planner Agent
 * 
 * Analyzes repository structure and creates execution plan.
 */

import { BaseAgent, AgentContext, AgentResult } from './base';

export class PlannerAgent extends BaseAgent {
  protected async run(context: AgentContext): Promise<AgentResult> {
    const { repoPath } = context.input;

    // Step 1: Scan repository structure
    console.log(`[${this.id}] Scanning repository: ${repoPath}`);
    
    const repoStructure = await this.invokeTool(
      'git-api',
      'scan_repository',
      { repo_path: repoPath },
      context.sessionId
    );

    // Step 2: Identify priority modules
    const priorityModules = this.identifyHighRiskModules(repoStructure);

    // Step 3: Estimate audit duration
    const estimatedDuration = this.estimateAuditTime(repoStructure);

    // Step 4: Recommend agents to run
    const recommendedAgents = this.recommendAgents(repoStructure);

    const plan = {
      estimated_duration_minutes: estimatedDuration,
      priority_modules: priorityModules,
      file_summary: {
        total_files: repoStructure.structure.total_files,
        by_language: repoStructure.structure.languages,
      },
      recommended_agents: recommendedAgents,
      files_to_scan: this.selectFilesToScan(repoStructure, priorityModules),
    };

    console.log(`[${this.id}] Plan created: ${estimatedDuration} min, ${priorityModules.length} priority modules`);

    return plan;
  }

  private identifyHighRiskModules(repoStructure: any): any[] {
    const highRiskKeywords = ['auth', 'login', 'password', 'payment', 'stripe', 'sql', 'api'];
    const modules: any[] = [];

    for (const file of repoStructure.files) {
      const path = file.path.toLowerCase();
      
      // Check for high-risk keywords
      for (const keyword of highRiskKeywords) {
        if (path.includes(keyword)) {
          const modulePath = path.split('/').slice(0, -1).join('/') + '/';
          
          // Avoid duplicates
          if (!modules.find(m => m.path === modulePath)) {
            modules.push({
              path: modulePath,
              reason: `Contains ${keyword}-related code`,
              risk: 'critical',
            });
          }
          break;
        }
      }
    }

    return modules.slice(0, 5); // Top 5 priority modules
  }

  private estimateAuditTime(repoStructure: any): number {
    const fileCount = repoStructure.structure.total_files;
    
    // Rough estimate: 1 second per file
    const baseTime = fileCount / 60; // Convert to minutes
    
    // Adjust based on language complexity
    let multiplier = 1.0;
    const languages = Object.keys(repoStructure.structure.languages);
    
    if (languages.includes('go') || languages.includes('rust')) {
      multiplier = 1.5;
    } else if (languages.includes('javascript') || languages.includes('python')) {
      multiplier = 0.8;
    }

    return Math.ceil(baseTime * multiplier);
  }

  private recommendAgents(repoStructure: any): string[] {
    const agents = ['security', 'quality'];
    
    // Add compliance if we detect certain patterns
    if (repoStructure.dependencies?.manifest_files?.includes('package.json')) {
      agents.push('compliance');
    }

    return agents;
  }

  private selectFilesToScan(repoStructure: any, priorityModules: any[]): string[] {
    const files: string[] = [];

    // Priority module files first
    for (const module of priorityModules) {
      const moduleFiles = repoStructure.files
        .filter((f: any) => f.path.startsWith(module.path))
        .map((f: any) => f.path);
      files.push(...moduleFiles);
    }

    // Then all other files
    const otherFiles = repoStructure.files
      .filter((f: any) => !files.includes(f.path))
      .map((f: any) => f.path);
    
    files.push(...otherFiles);

    return files;
  }
}
