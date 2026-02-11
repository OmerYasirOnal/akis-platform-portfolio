import { z } from 'zod';
import { SkillContractViolationError } from '../errors.js';
export const ScribeSkillNameSchema = z.enum(['DocPackFromRepo', 'ReleaseNotesFromPRs', 'ChecklistFromRunbook']);
export type ScribeSkillName = z.infer<typeof ScribeSkillNameSchema>;
const FACET_MAX_ATTEMPTS = 2;

const repositorySchema = z.object({ owner: z.string().min(1), repo: z.string().min(1), branch: z.string().min(1).default('main') });
const docPackFileSchema = z.object({ path: z.string().min(1), summary: z.string().min(1), constraints: z.array(z.string().min(1)).default([]) });
export const DocPackFromRepoInputSchema = z.object({ repository: repositorySchema, objective: z.string().min(1).optional(), files: z.array(docPackFileSchema).min(1).max(50) });
export const DocPackFromRepoOutputSchema = z.object({
  skill: z.literal('DocPackFromRepo'), version: z.literal('1.0'),
  sections: z.object({ title: z.string().min(1), summary: z.string().min(1), files: z.array(docPackFileSchema), constraints: z.array(z.string()), citations: z.array(z.string()) }),
  markdown: z.string().min(1),
});

const releasePrSchema = z.object({ number: z.number().int().positive(), title: z.string().min(1), summary: z.string().min(1).optional(), labels: z.array(z.string().min(1)).default([]), mergedAt: z.string().min(1) });
export const ReleaseNotesFromPRsInputSchema = z.object({ releaseVersion: z.string().min(1), pullRequests: z.array(releasePrSchema).min(1).max(200), breakingChanges: z.array(z.string().min(1)).default([]) });
const releaseNoteChangeSchema = z.object({ number: z.number().int().positive(), title: z.string().min(1), type: z.enum(['feature', 'fix', 'maintenance', 'breaking']) });
export const ReleaseNotesFromPRsOutputSchema = z.object({
  skill: z.literal('ReleaseNotesFromPRs'), version: z.literal('1.0'),
  sections: z.object({ releaseVersion: z.string().min(1), highlights: z.array(z.string()), changes: z.array(releaseNoteChangeSchema), breakingChanges: z.array(z.string()), citations: z.array(z.string()) }),
  markdown: z.string().min(1),
});

const runbookStepSchema = z.object({ title: z.string().min(1), action: z.string().min(1), verification: z.string().min(1), mandatory: z.boolean().default(true) });
export const ChecklistFromRunbookInputSchema = z.object({ runbookTitle: z.string().min(1), steps: z.array(runbookStepSchema).min(1).max(100) });
const checklistItemSchema = runbookStepSchema.extend({ id: z.string().regex(/^CHK-\d{2}$/) });
export const ChecklistFromRunbookOutputSchema = z.object({
  skill: z.literal('ChecklistFromRunbook'), version: z.literal('1.0'),
  sections: z.object({ runbookTitle: z.string().min(1), checklist: z.array(checklistItemSchema).min(1), mandatoryCount: z.number().int().nonnegative() }),
  markdown: z.string().min(1),
});

type SkillContract = { inputSchema: z.ZodTypeAny; outputSchema: z.ZodTypeAny; constraints: readonly string[]; failureModes: readonly string[] };
export const SCRIBE_SKILL_CONTRACTS: Record<ScribeSkillName, SkillContract> = {
  DocPackFromRepo: {
    inputSchema: DocPackFromRepoInputSchema,
    outputSchema: DocPackFromRepoOutputSchema,
    constraints: ['output order is stable', 'citations are file paths only', 'no missing sections'],
    failureModes: ['NO_FILES', 'INVALID_REPOSITORY', 'CONSTRAINT_VIOLATION'],
  },
  ReleaseNotesFromPRs: {
    inputSchema: ReleaseNotesFromPRsInputSchema,
    outputSchema: ReleaseNotesFromPRsOutputSchema,
    constraints: ['changes sorted by PR number', 'stable section order', 'explicit change type'],
    failureModes: ['NO_PULL_REQUESTS', 'INVALID_RELEASE_VERSION', 'MISSING_MERGE_METADATA'],
  },
  ChecklistFromRunbook: {
    inputSchema: ChecklistFromRunbookInputSchema,
    outputSchema: ChecklistFromRunbookOutputSchema,
    constraints: ['checklist ids are sequential', 'mandatory fields required', 'stable markdown headings'],
    failureModes: ['NO_STEPS', 'INVALID_STEP_SHAPE', 'MISSING_VERIFICATION'],
  },
};

const sortUnique = (items: string[]): string[] => [...new Set(items)].sort((a, b) => a.localeCompare(b));
const toType = (labels: string[]): 'feature' | 'fix' | 'maintenance' | 'breaking' => {
  const normalized = labels.map((v) => v.toLowerCase());
  if (normalized.some((v) => v.includes('breaking'))) return 'breaking';
  if (normalized.some((v) => v.includes('fix') || v.includes('bug'))) return 'fix';
  if (normalized.some((v) => v.includes('feature') || v.includes('feat'))) return 'feature';
  return 'maintenance';
};

export type ScribeSkillOutput =
  | z.infer<typeof DocPackFromRepoOutputSchema>
  | z.infer<typeof ReleaseNotesFromPRsOutputSchema>
  | z.infer<typeof ChecklistFromRunbookOutputSchema>;

export function parseWithFacetRetry<T>(skill: ScribeSkillName, schema: z.ZodType<T, z.ZodTypeDef, unknown>, producer: (attempt: number) => unknown): T {
  let lastIssue = 'Unknown contract violation';
  for (let attempt = 1; attempt <= FACET_MAX_ATTEMPTS; attempt += 1) {
    const parsed = schema.safeParse(producer(attempt));
    if (parsed.success) return parsed.data;
    lastIssue = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'output'}: ${issue.message}`).join('; ');
  }
  throw new SkillContractViolationError(skill, lastIssue, FACET_MAX_ATTEMPTS, true);
}

export function runScribeSkill(skill: ScribeSkillName, input: unknown): ScribeSkillOutput {
  if (skill === 'DocPackFromRepo') {
    const parsed = DocPackFromRepoInputSchema.parse(input);
    const files = [...parsed.files].sort((a, b) => a.path.localeCompare(b.path)).map((file) => ({
      path: file.path,
      summary: file.summary,
      constraints: file.constraints ?? [],
    }));
    const constraints = sortUnique(files.flatMap((file) => file.constraints));
    return parseWithFacetRetry<z.infer<typeof DocPackFromRepoOutputSchema>>(skill, DocPackFromRepoOutputSchema, () => ({
      skill, version: '1.0' as const,
      sections: {
        title: `DocPack for ${parsed.repository.owner}/${parsed.repository.repo}@${parsed.repository.branch}`,
        summary: parsed.objective ?? `Generated from ${files.length} repository files.`,
        files,
        constraints,
        citations: files.map((file) => file.path),
      },
      markdown: [`# DocPack: ${parsed.repository.owner}/${parsed.repository.repo}`, '', '## Summary', parsed.objective ?? `Generated from ${files.length} repository files.`, '', '## Files', ...files.map((file) => `- ${file.path}: ${file.summary}`)].join('\n'),
    }));
  }

  if (skill === 'ReleaseNotesFromPRs') {
    const parsed = ReleaseNotesFromPRsInputSchema.parse(input);
    const changes = [...parsed.pullRequests].sort((a, b) => a.number - b.number).map((pr) => ({ number: pr.number, title: pr.title, type: toType(pr.labels) }));
    const highlights = changes.filter((item) => item.type === 'feature' || item.type === 'breaking').map((item) => `#${item.number} ${item.title}`);
    return parseWithFacetRetry<z.infer<typeof ReleaseNotesFromPRsOutputSchema>>(skill, ReleaseNotesFromPRsOutputSchema, () => ({
      skill, version: '1.0' as const,
      sections: {
        releaseVersion: parsed.releaseVersion,
        highlights,
        changes,
        breakingChanges: sortUnique(parsed.breakingChanges),
        citations: changes.map((item) => `PR#${item.number}`),
      },
      markdown: [`# Release ${parsed.releaseVersion}`, '', '## Highlights', ...(highlights.length > 0 ? highlights.map((item) => `- ${item}`) : ['- None']), '', '## Changes', ...changes.map((item) => `- [${item.type}] #${item.number} ${item.title}`)].join('\n'),
    }));
  }

  const parsed = ChecklistFromRunbookInputSchema.parse(input);
  const checklist = parsed.steps.map((step, index) => ({
    id: `CHK-${String(index + 1).padStart(2, '0')}`,
    title: step.title,
    action: step.action,
    verification: step.verification,
    mandatory: step.mandatory ?? true,
  }));
  return parseWithFacetRetry<z.infer<typeof ChecklistFromRunbookOutputSchema>>('ChecklistFromRunbook', ChecklistFromRunbookOutputSchema, () => ({
    skill: 'ChecklistFromRunbook' as const,
    version: '1.0' as const,
    sections: { runbookTitle: parsed.runbookTitle, checklist, mandatoryCount: checklist.filter((item) => item.mandatory).length },
    markdown: [`# ${parsed.runbookTitle}`, '', '## Checklist', ...checklist.map((item) => `- [ ] ${item.id} ${item.title} | Action: ${item.action} | Verify: ${item.verification}`)].join('\n'),
  }));
}
