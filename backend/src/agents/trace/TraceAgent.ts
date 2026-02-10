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
    return planner.plan({
      agent: 'trace',
      goal: `Generate a comprehensive test plan and coverage matrix from the following specification:\n\n${payload.spec}`,
      context: { specLength: payload.spec?.length || 0 },
    });
  }

  async execute(context: unknown): Promise<unknown> {
    const payload = context as TracePayload;
    if (!payload?.spec) {
      throw new Error('TraceAgent requires payload with "spec" field');
    }

    const spec = typeof payload.spec === 'string' ? payload.spec : String(payload.spec);
    const scenarios = this.parseScenarios(spec);
    const files = this.generateTestFiles(scenarios);
    const coverageMatrix = this.generateCoverageMatrix(scenarios);
    const testPlanMd = this.renderTestPlanMarkdown(scenarios, coverageMatrix);

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
      },
    };
  }

  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    const payload = context as TracePayload;
    if (!payload?.spec) {
      throw new Error('TraceAgent requires payload with "spec" field');
    }

    const spec = typeof payload.spec === 'string' ? payload.spec : String(payload.spec);

    let testPlanMd: string;
    let coverageMatrix: Record<string, string[]>;
    let files: Array<{ path: string; cases: Array<{ name: string; steps: string[] }> }>;

    if (this.aiService) {
      const aiResult = await this.aiService.generateWorkArtifact({
        task: `Generate a comprehensive test plan with test cases and coverage matrix from this specification. Return structured markdown with sections: ## Test Plan, ## Test Cases (with scenario names and steps), ## Coverage Matrix (feature vs test mapping). Specification:\n\n${spec}`,
        context: { plan: plan?.steps.map(s => s.title) },
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
      },
    };
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

  private renderTestPlanMarkdown(scenarios: Array<{ name: string; steps: string[] }>, coverageMatrix: Record<string, string[]>): string {
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
}
