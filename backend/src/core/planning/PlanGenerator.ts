/**
 * PlanGenerator - Contract-first plan generation module
 * PR-1: SCRIBE PR Factory v1 - Plan artifact generation
 * 
 * Generates structured plan documents following the playbook template:
 * - Objective & Context
 * - Scope & Constraints
 * - Proposed Solution Plan
 * - Validation Strategy
 * - Rollback/Mitigation Plan
 * - Documentation & Comments
 * - AI Usage Disclosure
 * - Evidence Checklist
 */

import type { AIService } from '../../services/ai/AIService.js';

/**
 * Plan section structure
 */
export interface PlanSection {
  title: string;
  content: string;
  required: boolean;
}

/**
 * Structured plan data (JSON format)
 */
export interface PlanJson {
  version: '1.0';
  generatedAt: string;
  agentType: string;
  jobId: string;
  requiresApproval: boolean;
  dryRun: boolean;
  sections: {
    objective: string;
    scope: string;
    constraints: string[];
    plan: PlanStep[];
    validationStrategy: string[];
    rollbackPlan: string;
    docsToUpdate: string[];
    aiDisclosure: string;
    evidenceChecklist: EvidenceItem[];
  };
  metadata?: Record<string, unknown>;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  estimatedRisk: 'low' | 'medium' | 'high';
}

export interface EvidenceItem {
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  link?: string;
  notes?: string;
}

/**
 * Context for plan generation
 */
export interface PlanContext {
  jobId: string;
  agentType: string;
  taskDescription: string;
  targetPath?: string;
  repositoryOwner?: string;
  repositoryName?: string;
  baseBranch?: string;
  featureBranch?: string;
  dryRun: boolean;
  requiresApproval: boolean;
  filesDiscovered?: string[];
  existingContent?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Generated plan output
 */
export interface GeneratedPlan {
  markdown: string;
  json: PlanJson;
  requiresApproval: boolean;
}

/**
 * Plan validation result
 */
export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required sections for a valid plan
 */
const REQUIRED_SECTIONS = [
  'Objective & Context',
  'Scope & Constraints',
  'Proposed Solution Plan',
  'Validation Strategy',
  'Rollback / Mitigation Plan',
  'AI Usage Disclosure',
  'Evidence Checklist',
];

/**
 * Risk assessment thresholds
 */
const RISK_THRESHOLDS = {
  lowRiskMaxFiles: 3,
  mediumRiskMaxFiles: 10,
  // Above mediumRiskMaxFiles = high risk
};

/**
 * PlanGenerator class - generates contract-first plan documents
 */
export class PlanGenerator {
  private aiService?: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService;
  }

  /**
   * Generate a plan document from context
   */
  async generatePlan(context: PlanContext): Promise<GeneratedPlan> {
    const timestamp = new Date().toISOString();
    
    // Assess risk level based on context
    const riskLevel = this.assessRisk(context);
    
    // Determine if approval is required based on risk and context
    const requiresApproval = context.requiresApproval || riskLevel === 'high' || !context.dryRun;
    
    // Generate plan steps
    const planSteps = this.generatePlanSteps(context);
    
    // Build structured JSON plan
    const planJson: PlanJson = {
      version: '1.0',
      generatedAt: timestamp,
      agentType: context.agentType,
      jobId: context.jobId,
      requiresApproval,
      dryRun: context.dryRun,
      sections: {
        objective: this.generateObjective(context),
        scope: this.generateScope(context),
        constraints: this.generateConstraints(context),
        plan: planSteps,
        validationStrategy: this.generateValidationStrategy(context),
        rollbackPlan: this.generateRollbackPlan(context),
        docsToUpdate: context.filesDiscovered || [],
        aiDisclosure: this.generateAIDisclosure(context),
        evidenceChecklist: this.generateEvidenceChecklist(),
      },
      metadata: {
        riskLevel,
        filesCount: context.filesDiscovered?.length || 0,
        targetPath: context.targetPath,
      },
    };
    
    // Generate Markdown representation
    const markdown = this.generateMarkdown(planJson, context);
    
    return {
      markdown,
      json: planJson,
      requiresApproval,
    };
  }

  /**
   * Validate a plan document
   */
  validatePlan(markdown: string): PlanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for required sections
    for (const section of REQUIRED_SECTIONS) {
      if (!markdown.includes(`## ${section}`)) {
        errors.push(`Missing required section: "${section}"`);
      }
    }
    
    // Check for empty sections
    const sectionPattern = /## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/g;
    let match;
    while ((match = sectionPattern.exec(markdown)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2].trim();
      
      if (sectionContent.length < 10) {
        warnings.push(`Section "${sectionTitle}" appears to be empty or too short`);
      }
    }
    
    // Check for placeholder text that wasn't replaced
    if (markdown.includes('{') && markdown.includes('}')) {
      const placeholderPattern = /\{[a-zA-Z_]+\}/g;
      const placeholders = markdown.match(placeholderPattern);
      if (placeholders && placeholders.length > 0) {
        warnings.push(`Found unreplaced placeholders: ${placeholders.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Assess risk level based on context
   */
  private assessRisk(context: PlanContext): 'low' | 'medium' | 'high' {
    const filesCount = context.filesDiscovered?.length || 0;
    
    // High risk if not dry run
    if (!context.dryRun) {
      return 'high';
    }
    
    // Assess by file count
    if (filesCount <= RISK_THRESHOLDS.lowRiskMaxFiles) {
      return 'low';
    } else if (filesCount <= RISK_THRESHOLDS.mediumRiskMaxFiles) {
      return 'medium';
    }
    
    return 'high';
  }

  /**
   * Generate plan steps based on context
   */
  private generatePlanSteps(context: PlanContext): PlanStep[] {
    const steps: PlanStep[] = [];
    
    // Step 1: Context gathering
    steps.push({
      id: 'gather-context',
      title: 'Context Gathering',
      description: `Analyze ${context.targetPath || 'repository'} to understand current state and dependencies.`,
      estimatedRisk: 'low',
    });
    
    // Step 2: Content generation
    steps.push({
      id: 'generate-content',
      title: 'Content Generation',
      description: `Generate or update documentation based on task: "${context.taskDescription || 'update documentation'}"`,
      estimatedRisk: 'low',
    });
    
    // Step 3: Validation
    steps.push({
      id: 'validate',
      title: 'Validation',
      description: 'Run contract compliance checks and quality validation.',
      estimatedRisk: 'low',
    });
    
    // Step 4: Commit/PR (if not dry-run)
    if (!context.dryRun) {
      steps.push({
        id: 'create-branch',
        title: 'Branch Creation',
        description: `Create feature branch from ${context.baseBranch || 'main'}`,
        estimatedRisk: 'medium',
      });
      
      steps.push({
        id: 'commit-changes',
        title: 'Commit Changes',
        description: 'Commit generated documentation to the feature branch.',
        estimatedRisk: 'medium',
      });
      
      steps.push({
        id: 'create-pr',
        title: 'Create Pull Request',
        description: 'Open a draft pull request for review.',
        estimatedRisk: 'medium',
      });
    } else {
      steps.push({
        id: 'preview',
        title: 'Preview Generation',
        description: 'Generate preview of changes without writing to repository.',
        estimatedRisk: 'low',
      });
    }
    
    return steps;
  }

  /**
   * Generate objective section
   */
  private generateObjective(context: PlanContext): string {
    const repo = context.repositoryOwner && context.repositoryName 
      ? `${context.repositoryOwner}/${context.repositoryName}` 
      : 'repository';
    const target = context.targetPath || 'documentation';
    const task = context.taskDescription || 'update documentation';
    
    return `Update ${target} in ${repo}. Task: ${task}. Mode: ${context.dryRun ? 'dry-run (preview only)' : 'execute'}.`;
  }

  /**
   * Generate scope section
   */
  private generateScope(context: PlanContext): string {
    const files = context.filesDiscovered || [];
    
    if (files.length === 0) {
      return `Target path: ${context.targetPath || 'repository root'}. No specific files identified yet.`;
    }
    
    const fileList = files.slice(0, 10).join(', ');
    const moreCount = files.length > 10 ? ` and ${files.length - 10} more` : '';
    
    return `Target files: ${fileList}${moreCount}. Total: ${files.length} file(s).`;
  }

  /**
   * Generate constraints list
   */
  private generateConstraints(context: PlanContext): string[] {
    const constraints: string[] = [
      'No secrets or tokens will be logged or stored',
      'Chain-of-thought reasoning will not be exposed in outputs',
      'All file modifications will follow repository conventions',
    ];
    
    if (context.dryRun) {
      constraints.push('Dry-run mode: No actual changes will be written to the repository');
    }
    
    if (context.requiresApproval) {
      constraints.push('Human approval required before execution');
    }
    
    return constraints;
  }

  /**
   * Generate validation strategy
   */
  private generateValidationStrategy(context: PlanContext): string[] {
    const strategies: string[] = [
      'Contract compliance: Verify all required documentation sections are present',
      'Quality check: Ensure minimum content length and proper formatting',
    ];
    
    if (!context.dryRun) {
      strategies.push('Build verification: Ensure changes do not break CI/CD');
      strategies.push('Lint check: Verify markdown formatting');
    }
    
    return strategies;
  }

  /**
   * Generate rollback plan
   */
  private generateRollbackPlan(context: PlanContext): string {
    if (context.dryRun) {
      return 'Dry-run mode: No changes are made, no rollback needed. Preview artifacts can be discarded.';
    }
    
    return `If issues are found: (1) Close the draft PR without merging. (2) Delete the feature branch: \`git branch -D ${context.featureBranch || 'feature-branch'}\`. (3) No data loss since changes are isolated to the PR branch.`;
  }

  /**
   * Generate AI disclosure statement
   */
  private generateAIDisclosure(context: PlanContext): string {
    return `This plan and subsequent changes are generated by ${context.agentType.toUpperCase()} Agent on AKIS Platform. Job ID: ${context.jobId}. All outputs are subject to human review before merge.`;
  }

  /**
   * Generate evidence checklist
   */
  private generateEvidenceChecklist(): EvidenceItem[] {
    return [
      { name: 'Plan generated', status: 'passed' },
      { name: 'Contract compliance', status: 'pending' },
      { name: 'Content quality', status: 'pending' },
      { name: 'Lint/format check', status: 'pending' },
      { name: 'Human approval', status: 'pending' },
    ];
  }

  /**
   * Generate Markdown representation of plan
   */
  private generateMarkdown(planJson: PlanJson, _context: PlanContext): string {
    const { sections } = planJson;
    const approvalStatus = planJson.requiresApproval 
      ? '⏳ **Approval Required**' 
      : '✅ Auto-approved (low risk)';
    
    return `# Agent Job Plan

**Generated**: ${planJson.generatedAt}  
**Agent**: ${planJson.agentType}  
**Job ID**: \`${planJson.jobId}\`  
**Mode**: ${planJson.dryRun ? 'Dry-run (Preview Only)' : 'Execute'}  
**Status**: ${approvalStatus}

---

## Objective & Context

${sections.objective}

---

## Scope & Constraints

### Scope
${sections.scope}

### Constraints
${sections.constraints.map(c => `- ${c}`).join('\n')}

---

## Proposed Solution Plan

| Step | Title | Description | Risk |
|------|-------|-------------|------|
${sections.plan.map((s, i) => `| ${i + 1} | ${s.title} | ${s.description} | ${s.estimatedRisk} |`).join('\n')}

---

## Validation Strategy

${sections.validationStrategy.map((v, i) => `${i + 1}. ${v}`).join('\n')}

---

## Rollback / Mitigation Plan

${sections.rollbackPlan}

---

## Documentation & Comments

${sections.docsToUpdate.length > 0 
  ? `Files to update:\n${sections.docsToUpdate.map(f => `- \`${f}\``).join('\n')}`
  : 'No specific documentation files identified yet.'}

---

## AI Usage Disclosure

${sections.aiDisclosure}

---

## Evidence Checklist

| Check | Status | Notes |
|-------|--------|-------|
${sections.evidenceChecklist.map(e => `| ${e.name} | ${e.status === 'passed' ? '✅' : e.status === 'failed' ? '❌' : '⏳'} ${e.status} | ${e.notes || '-'} |`).join('\n')}

---

*This plan follows the contract-first workflow defined in SCRIBE PR Factory v1.*
`;
  }
}

/**
 * Create a PlanGenerator instance
 */
export function createPlanGenerator(aiService?: AIService): PlanGenerator {
  return new PlanGenerator(aiService);
}

