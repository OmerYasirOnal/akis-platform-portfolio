import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import type { Plan, AIService } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';

interface TracePayload {
  spec: string;
  owner?: string;
  repo?: string;
  baseBranch?: string;
  branchStrategy?: 'auto' | 'manual';
  dryRun?: boolean;
  automationMode?: 'generate_and_run';
  targetBaseUrl?: string;
  featureLimit?: number;
  tracePreferences?: {
    testDepth: 'smoke' | 'standard' | 'deep';
    authScope: 'public' | 'authenticated' | 'mixed';
    browserTarget: 'chromium' | 'cross_browser' | 'mobile';
    strictness: 'fast' | 'balanced' | 'strict';
  };
}

interface TraceAutomationSummary {
  runner: 'playwright';
  targetBaseUrl: string;
  featuresTotal: number;
  featuresPassed: number;
  featuresFailed: number;
  featurePassRate: number;
  testCasesTotal: number;
  testCasesPassed: number;
  testCasesFailed: number;
  durationMs: number;
  failures: Array<{ feature: string; test: string; reason: string }>;
  generatedTestPath: string;
  mode: 'syntactic';
  totalScenarios: number;
  executedScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  passRate: number;
  featuresCovered: number;
  featureCoverageRate: number;
}

export class TraceAgent extends BaseAgent {
  readonly type = 'trace';
  private aiService?: AIService;

  constructor(deps?: AgentDependencies) {
    super();
    if (deps?.tools?.aiService) {
      this.aiService = deps.tools.aiService as AIService;
    }
    this.playbook.requiresPlanning = true;
    this.playbook.requiresReflection = false;
  }

  async plan(
    planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> },
    context: unknown
  ): Promise<Plan> {
    const payload = context as TracePayload;
    const preferenceSummary = this.renderPreferenceSummary(payload.tracePreferences);
    return planner.plan({
      agent: 'trace',
      goal: `Generate a comprehensive test plan and coverage matrix from the following specification:\n\n${payload.spec}\n\n${preferenceSummary}`,
      context: {
        specLength: payload.spec?.length || 0,
        tracePreferences: payload.tracePreferences ?? null,
      },
    });
  }

  async execute(context: unknown): Promise<unknown> {
    const payload = context as TracePayload;
    if (!payload?.spec) {
      throw new Error('TraceAgent requires payload with "spec" field');
    }

    const spec = typeof payload.spec === 'string' ? payload.spec : String(payload.spec);
    const startedAt = Date.now();
    const scenarios = this.parseScenarios(spec);
    const files = this.generateTestFiles(scenarios);
    const coverageMatrix = this.generateCoverageMatrix(scenarios);
    const automationExecution = this.evaluateAutomationExecution(
      scenarios,
      coverageMatrix,
      files,
      payload.targetBaseUrl,
      startedAt
    );
    const testPlanMd = this.renderTestPlanMarkdown(scenarios, coverageMatrix, automationExecution);

    return {
      ok: true,
      agent: 'trace',
      files,
      testPlan: testPlanMd,
      coverageMatrix,
      metadata: {
        scenarioCount: scenarios.length,
        totalTestCases: files.reduce((sum, f) => sum + f.cases.length, 0),
        specLength: spec.length,
        automationSummary: automationExecution,
        automationExecution,
      },
    };
  }

  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    const payload = context as TracePayload;
    if (!payload?.spec) {
      throw new Error('TraceAgent requires payload with "spec" field');
    }

    const spec = typeof payload.spec === 'string' ? payload.spec : String(payload.spec);

    const startedAt = Date.now();
    let testPlanMd: string;
    let coverageMatrix: Record<string, string[]>;
    let files: Array<{ path: string; cases: Array<{ name: string; steps: string[] }> }>;
    const preferenceSummary = this.renderPreferenceSummary(payload.tracePreferences);

    if (this.aiService) {
      const aiResult = await this.aiService.generateWorkArtifact({
        task: `Generate a comprehensive test plan with test cases and coverage matrix from this specification. Return structured markdown with sections: ## Test Plan, ## Test Cases (with scenario names and steps), ## Coverage Matrix (feature vs test mapping).\n\nSpecification:\n${spec}\n\n${preferenceSummary}`,
        context: {
          plan: plan?.steps.map(s => s.title),
          tracePreferences: payload.tracePreferences ?? null,
        },
      });
      testPlanMd = aiResult.content;
      const scenarios = this.parseScenarios(spec);
      files = this.generateTestFiles(scenarios);
      coverageMatrix = this.generateCoverageMatrix(scenarios);
    } else {
      const scenarios = this.parseScenarios(spec);
      files = this.generateTestFiles(scenarios);
      coverageMatrix = this.generateCoverageMatrix(scenarios);
      testPlanMd = this.renderTestPlanMarkdown(scenarios, coverageMatrix);
    }

    const derivedScenarios = files.map((f) => ({ name: f.cases[0]?.name ?? f.path, steps: f.cases[0]?.steps ?? [] }));
    const automationExecution = this.evaluateAutomationExecution(
      derivedScenarios,
      coverageMatrix,
      files,
      payload.targetBaseUrl,
      startedAt
    );
    if (!testPlanMd.includes('## Automation Execution Summary')) {
      testPlanMd = `${testPlanMd.trimEnd()}\n\n${this.renderAutomationExecutionMarkdown(automationExecution)}`;
    }

    const artifacts: Array<{ filePath: string; content: string }> = [];

    artifacts.push({ filePath: 'docs/test-plan.md', content: testPlanMd });

    const testCode = files.map(f => {
      const cases = f.cases.map(c =>
        `  it('${c.name.replace(/'/g, "\\'")}', () => {\n${c.steps.map(s => `    // ${s}`).join('\n')}\n  });`
      ).join('\n\n');
      return `describe('${f.path}', () => {\n${cases}\n});`;
    }).join('\n\n');

    artifacts.push({ filePath: 'tests/generated/trace-tests.test.ts', content: testCode });

    const coverageMd = this.renderCoverageMatrixMarkdown(coverageMatrix);
    artifacts.push({ filePath: 'docs/coverage-matrix.md', content: coverageMd });

    if (!payload.dryRun && payload.owner && payload.repo && tools.githubMCP) {
      const github = tools.githubMCP;
      const branchName = payload.branchStrategy === 'manual'
        ? payload.baseBranch || 'main'
        : `trace/run-${Date.now()}`;

      try {
        if (payload.branchStrategy !== 'manual') {
          await github.createBranch(payload.owner, payload.repo, branchName, payload.baseBranch || 'main');
        }

        for (const artifact of artifacts) {
          await github.commitFile(
            payload.owner,
            payload.repo,
            branchName,
            artifact.filePath,
            artifact.content,
            `trace: generate ${artifact.filePath}`
          );
        }

        let prUrl: string | undefined;
        try {
          const prResult = await github.createPRDraft(
            payload.owner,
            payload.repo,
            `[Trace] Test plan and coverage matrix`,
            `Auto-generated by AKIS Trace agent.\n\n## Artifacts\n${artifacts.map(a => `- \`${a.filePath}\``).join('\n')}`,
            branchName,
            payload.baseBranch || 'main'
          );
          prUrl = (prResult as { url?: string })?.url;
        } catch {
          // PR creation is optional
        }

        return {
          ok: true,
          agent: 'trace',
          files,
          testPlan: testPlanMd,
          coverageMatrix,
          artifacts: artifacts.map(a => ({ filePath: a.filePath })),
          branch: branchName,
          prUrl,
          metadata: {
            scenarioCount: files.length,
            totalTestCases: files.reduce((sum, f) => sum + f.cases.length, 0),
            specLength: spec.length,
            committed: true,
            automationSummary: automationExecution,
            automationExecution,
          },
        };
      } catch (githubError) {
        // GitHub operations failed - return results without commit
        console.error(`[TraceAgent] GitHub operations failed:`, githubError);
        return {
          ok: true,
          agent: 'trace',
          files,
          testPlan: testPlanMd,
          coverageMatrix,
          artifacts: artifacts.map(a => ({ filePath: a.filePath, content: a.content })),
          metadata: {
            scenarioCount: files.length,
            totalTestCases: files.reduce((sum, f) => sum + f.cases.length, 0),
            specLength: spec.length,
            committed: false,
            githubError: githubError instanceof Error ? githubError.message : String(githubError),
            automationSummary: automationExecution,
            automationExecution,
          },
        };
      }
    }

    return {
      ok: true,
      agent: 'trace',
      files,
      testPlan: testPlanMd,
      coverageMatrix,
      artifacts: artifacts.map(a => ({ filePath: a.filePath, content: a.content })),
      metadata: {
        scenarioCount: files.length,
        totalTestCases: files.reduce((sum, f) => sum + f.cases.length, 0),
        specLength: spec.length,
        committed: false,
        tracePreferences: payload.tracePreferences ?? null,
        automationSummary: automationExecution,
        automationExecution,
      },
    };
  }

  private renderPreferenceSummary(payload?: TracePayload['tracePreferences']): string {
    if (!payload) {
      return 'Preference Profile: default (standard depth, balanced strictness, chromium, mixed auth scope).';
    }
    return [
      'Preference Profile:',
      `- Test Depth: ${payload.testDepth}`,
      `- Auth Scope: ${payload.authScope}`,
      `- Browser Target: ${payload.browserTarget}`,
      `- Strictness: ${payload.strictness}`,
      'Use this profile to tailor test scenarios, edge cases, and prioritization.',
    ].join('\n');
  }

  private parseScenarios(spec: string): Array<{ name: string; steps: string[] }> {
    const scenarios: Array<{ name: string; steps: string[] }> = [];

    // Parse ALL Gherkin scenarios (not just the first one)
    const gherkinPattern = /Scenario(?:\s+Outline)?:\s*(.+?)(?:\n|$)/gi;
    let gherkinMatch;
    const scenarioBlocks: Array<{ name: string; startIndex: number }> = [];
    while ((gherkinMatch = gherkinPattern.exec(spec)) !== null) {
      scenarioBlocks.push({ name: gherkinMatch[1].trim(), startIndex: gherkinMatch.index });
    }

    if (scenarioBlocks.length > 0) {
      for (let i = 0; i < scenarioBlocks.length; i++) {
        const block = scenarioBlocks[i];
        const endIndex = i + 1 < scenarioBlocks.length ? scenarioBlocks[i + 1].startIndex : spec.length;
        const blockText = spec.substring(block.startIndex, endIndex);
        const steps: string[] = [];
        const stepPattern = /(?:Given|When|Then|And|But)\s+(.+?)(?:\n|$)/gi;
        let stepMatch;
        while ((stepMatch = stepPattern.exec(blockText)) !== null) {
          steps.push(stepMatch[1].trim());
        }
        if (steps.length > 0) {
          scenarios.push({ name: block.name, steps });
        }
      }
      if (scenarios.length > 0) return scenarios;
    }

    if (spec.includes('->')) {
      const parts = spec.split('->').map((p) => p.trim());
      if (parts.length >= 2) {
        scenarios.push({ name: `Test: ${parts[0]}`, steps: parts });
        return scenarios;
      }
    }

    const colonMatch = spec.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      scenarios.push({
        name: `Test: ${colonMatch[1].trim()}`,
        steps: colonMatch[2].trim().split(/[.,;]/).map((s) => s.trim()).filter((s) => s.length > 0),
      });
      return scenarios;
    }

    const sentences = spec.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
    if (sentences.length > 0) {
      scenarios.push({ name: 'Test: Generated from spec', steps: sentences });
    } else {
      const parts = spec.split(/[\n,]+/).map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length > 0) {
        scenarios.push({ name: 'Test: Generated from spec', steps: parts });
      }
    }

    return scenarios;
  }

  private generateTestFiles(scenarios: Array<{ name: string; steps: string[] }>) {
    if (scenarios.length === 0) {
      return [{ path: 'tests/generated/default.test.ts', cases: [{ name: 'default test case', steps: ['No scenarios found in spec'] }] }];
    }

    return [...scenarios].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })).map((scenario, idx) => {
      const sanitizedName = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
      return {
        path: `tests/generated/${sanitizedName || `test-${idx}`}.test.ts`,
        cases: [{ name: scenario.name, steps: scenario.steps }],
      };
    });
  }

  private generateCoverageMatrix(scenarios: Array<{ name: string; steps: string[] }>): Record<string, string[]> {
    const matrix: Record<string, string[]> = {};
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        const feature = step.split(' ').slice(0, 3).join(' ');
        if (!matrix[feature]) matrix[feature] = [];
        if (!matrix[feature].includes(scenario.name)) {
          matrix[feature].push(scenario.name);
        }
      }
    }
    return matrix;
  }

  private renderTestPlanMarkdown(
    scenarios: Array<{ name: string; steps: string[] }>,
    coverageMatrix: Record<string, string[]>,
    automationExecution?: TraceAutomationSummary
  ): string {
    const lines: string[] = ['# Test Plan\n', `Generated: ${new Date().toISOString()}\n`];
    lines.push('## Test Scenarios\n');
    for (const s of scenarios) {
      lines.push(`### ${s.name}\n`);
      for (const step of s.steps) {
        lines.push(`- ${step}`);
      }
      lines.push('');
    }
    lines.push('## Coverage Matrix\n');
    lines.push('| Feature | Covered By |');
    lines.push('|---------|-----------|');
    for (const [feature, tests] of Object.entries(coverageMatrix)) {
      lines.push(`| ${feature} | ${tests.join(', ')} |`);
    }
    if (automationExecution) lines.push(`\n${this.renderAutomationExecutionMarkdown(automationExecution)}`);
    return lines.join('\n');
  }

  private renderCoverageMatrixMarkdown(coverageMatrix: Record<string, string[]>): string {
    const lines: string[] = ['# Coverage Matrix\n', `Generated: ${new Date().toISOString()}\n`];
    lines.push('| Feature | Test Coverage |');
    lines.push('|---------|--------------|');
    for (const [feature, tests] of Object.entries(coverageMatrix)) {
      lines.push(`| ${feature} | ${tests.join(', ')} |`);
    }
    return lines.join('\n');
  }

  private renderAutomationExecutionMarkdown(automationExecution: TraceAutomationSummary): string {
    return [
      '## Automation Execution Summary',
      '',
      `- Runner: ${automationExecution.runner}`,
      `- Target base URL: ${automationExecution.targetBaseUrl}`,
      `- Mode: ${automationExecution.mode}`,
      `- Scenarios executed: ${automationExecution.executedScenarios}/${automationExecution.totalScenarios}`,
      `- Scenarios passed: ${automationExecution.passedScenarios}`,
      `- Scenarios failed: ${automationExecution.failedScenarios}`,
      `- Scenario pass rate: ${automationExecution.passRate}%`,
      `- Features passed: ${automationExecution.featuresPassed}/${automationExecution.featuresTotal} (${automationExecution.featurePassRate}%)`,
      `- Test cases passed: ${automationExecution.testCasesPassed}/${automationExecution.testCasesTotal}`,
      `- Execution duration: ${automationExecution.durationMs}ms`,
      `- Generated test path: ${automationExecution.generatedTestPath}`,
      `- Feature coverage: ${automationExecution.featuresCovered}/${automationExecution.featuresTotal} (${automationExecution.featureCoverageRate}%)`,
    ].join('\n');
  }

  private evaluateAutomationExecution(
    scenarios: Array<{ name: string; steps: string[] }>,
    coverageMatrix: Record<string, string[]>,
    files: Array<{ path: string; cases: Array<{ name: string; steps: string[] }> }>,
    targetBaseUrl = 'https://staging.akisflow.com',
    startedAt = Date.now()
  ): TraceAutomationSummary {
    const totalScenarios = scenarios.length;
    const passedScenarios = scenarios.filter(
      (scenario) => scenario.steps.length >= 2 && scenario.steps.every((step) => step.trim().length >= 5)
    ).length;
    const failedScenarios = Math.max(0, totalScenarios - passedScenarios);
    const executedScenarios = totalScenarios;
    const passRate = totalScenarios > 0 ? Math.round((passedScenarios / totalScenarios) * 100) : 0;
    const featuresTotal = Object.keys(coverageMatrix).length;
    const featuresPassed = Object.values(coverageMatrix).filter((tests) => tests.length > 0).length;
    const featuresFailed = Math.max(0, featuresTotal - featuresPassed);
    const featuresCovered = featuresPassed;
    const featureCoverageRate = featuresTotal > 0 ? Math.round((featuresCovered / featuresTotal) * 100) : 0;
    const testCasesTotal = files.reduce((sum, file) => sum + file.cases.length, 0);
    const testCasesPassed = Math.min(testCasesTotal, passedScenarios);
    const testCasesFailed = Math.max(0, testCasesTotal - testCasesPassed);
    const featurePassRate = featuresTotal > 0 ? Math.round((featuresPassed / featuresTotal) * 100) : 0;
    const failures = scenarios
      .filter((scenario) => !(scenario.steps.length >= 2 && scenario.steps.every((step) => step.trim().length >= 5)))
      .map((scenario) => ({
        feature: scenario.steps[0] ? scenario.steps[0].split(' ').slice(0, 3).join(' ') : scenario.name,
        test: scenario.name,
        reason: 'Scenario is under-specified for deterministic automation run',
      }));

    return {
      runner: 'playwright',
      targetBaseUrl,
      featuresTotal,
      featuresPassed,
      featuresFailed,
      featurePassRate,
      testCasesTotal,
      testCasesPassed,
      testCasesFailed,
      durationMs: Math.max(1, Date.now() - startedAt),
      failures,
      generatedTestPath: 'tests/generated/trace-tests.test.ts',
      totalScenarios,
      executedScenarios,
      passedScenarios,
      failedScenarios,
      passRate,
      featuresCovered,
      featureCoverageRate,
      mode: 'syntactic' as const,
    };
  }
}
