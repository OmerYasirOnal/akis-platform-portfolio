/**
 * DocContract - Formal specification for documentation structure and requirements
 * 
 * Scribe v2 uses this contract to:
 * - Define expected documentation sections
 * - Specify file targets (README, docs/, CHANGELOG, ADR)
 * - Support multi-file documentation sets
 * - Ensure consistency across documentation updates
 */

/**
 * Supported documentation file types
 */
export type DocFileType = 
  | 'readme'          // README.md (project overview)
  | 'guide'           // User/developer guides in docs/
  | 'changelog'       // CHANGELOG.md (version history)
  | 'adr'             // Architecture Decision Records
  | 'api'             // API documentation
  | 'setup'           // Setup/installation guides
  | 'contributing'    // CONTRIBUTING.md
  | 'other';          // Other documentation files

/**
 * Required sections for different doc types
 */
export interface DocSection {
  name: string;
  required: boolean;
  description: string;
  /** Expected content structure/hints for AI */
  hints?: string[];
}

/**
 * Documentation contract for a specific file type
 */
export interface DocTypeContract {
  fileType: DocFileType;
  /** Typical file patterns (e.g., "README.md" or "docs slash star star slash star.md") */
  patterns: string[];
  /** Sections expected in this doc type */
  sections: DocSection[];
  /** Minimum content quality requirements */
  qualityRules: {
    minLength?: number;
    requireCodeExamples?: boolean;
    requireLinks?: boolean;
    tone?: 'technical' | 'friendly' | 'formal';
  };
}

/**
 * Standard README contract
 */
export const README_CONTRACT: DocTypeContract = {
  fileType: 'readme',
  patterns: ['README.md'],
  sections: [
    {
      name: 'Title and Description',
      required: true,
      description: 'Project name and one-line summary',
      hints: ['Clear, concise', 'Should explain "what" in one sentence'],
    },
    {
      name: 'Features',
      required: false,
      description: 'Key features and capabilities',
      hints: ['Bullet list format', 'Highlight unique selling points'],
    },
    {
      name: 'Installation',
      required: true,
      description: 'How to install/setup the project',
      hints: ['Step-by-step', 'Include prerequisites', 'Code snippets'],
    },
    {
      name: 'Usage',
      required: true,
      description: 'Basic usage examples',
      hints: ['Code examples', 'Common use cases', 'Quick start'],
    },
    {
      name: 'Configuration',
      required: false,
      description: 'Configuration options and environment variables',
      hints: ['Table format for env vars', 'Default values', 'Required vs optional'],
    },
    {
      name: 'Contributing',
      required: false,
      description: 'How to contribute to the project',
      hints: ['Link to CONTRIBUTING.md if exists', 'Brief guidelines'],
    },
    {
      name: 'License',
      required: false,
      description: 'License information',
      hints: ['License type', 'Link to LICENSE file'],
    },
  ],
  qualityRules: {
    minLength: 500,
    requireCodeExamples: true,
    tone: 'friendly',
  },
};

/**
 * Guide contract (for docs/ directory files)
 */
export const GUIDE_CONTRACT: DocTypeContract = {
  fileType: 'guide',
  patterns: ['docs/**/*.md', 'docs/*.md'],
  sections: [
    {
      name: 'Overview',
      required: true,
      description: 'What this guide covers',
      hints: ['Context setting', '2-3 sentences'],
    },
    {
      name: 'Prerequisites',
      required: false,
      description: 'What the reader should know/have before starting',
    },
    {
      name: 'Main Content',
      required: true,
      description: 'The core guide content',
      hints: ['Logical flow', 'Step-by-step where applicable', 'Code examples'],
    },
    {
      name: 'Examples',
      required: false,
      description: 'Practical examples',
      hints: ['Real-world scenarios', 'Code snippets', 'Common patterns'],
    },
    {
      name: 'Troubleshooting',
      required: false,
      description: 'Common issues and solutions',
      hints: ['Problem-solution format', 'Error messages with fixes'],
    },
    {
      name: 'Next Steps',
      required: false,
      description: 'Links to related guides or further reading',
    },
  ],
  qualityRules: {
    minLength: 300,
    requireCodeExamples: true,
    tone: 'technical',
  },
};

/**
 * Setup/Installation guide contract
 */
export const SETUP_CONTRACT: DocTypeContract = {
  fileType: 'setup',
  patterns: ['docs/setup.md', 'docs/installation.md', 'INSTALL.md', 'docs/DEV_SETUP.md'],
  sections: [
    {
      name: 'Prerequisites',
      required: true,
      description: 'System requirements and dependencies',
      hints: ['OS versions', 'Required software', 'Version numbers'],
    },
    {
      name: 'Installation Steps',
      required: true,
      description: 'Step-by-step installation process',
      hints: ['Numbered steps', 'Commands with explanations', 'Verification steps'],
    },
    {
      name: 'Configuration',
      required: true,
      description: 'Initial configuration required',
      hints: ['Environment variables', 'Config files', 'Secrets management'],
    },
    {
      name: 'Verification',
      required: false,
      description: 'How to verify successful installation',
      hints: ['Test commands', 'Expected outputs', 'Health checks'],
    },
    {
      name: 'Troubleshooting',
      required: false,
      description: 'Common installation issues',
      hints: ['Platform-specific issues', 'Error messages with solutions'],
    },
  ],
  qualityRules: {
    minLength: 400,
    requireCodeExamples: true,
    tone: 'technical',
  },
};

/**
 * Contract registry - maps patterns to contracts
 */
export const DOC_CONTRACTS: Record<DocFileType, DocTypeContract> = {
  readme: README_CONTRACT,
  guide: GUIDE_CONTRACT,
  setup: SETUP_CONTRACT,
  changelog: {
    fileType: 'changelog',
    patterns: ['CHANGELOG.md'],
    sections: [
      { name: 'Version Header', required: true, description: 'Version number and date' },
      { name: 'Added', required: false, description: 'New features' },
      { name: 'Changed', required: false, description: 'Changes to existing functionality' },
      { name: 'Deprecated', required: false, description: 'Soon-to-be removed features' },
      { name: 'Removed', required: false, description: 'Removed features' },
      { name: 'Fixed', required: false, description: 'Bug fixes' },
      { name: 'Security', required: false, description: 'Security improvements' },
    ],
    qualityRules: {
      minLength: 100,
      tone: 'formal',
    },
  },
  adr: {
    fileType: 'adr',
    patterns: ['docs/adr/*.md', 'docs/decisions/*.md'],
    sections: [
      { name: 'Title', required: true, description: 'Decision title' },
      { name: 'Status', required: true, description: 'Proposed, Accepted, Deprecated, Superseded' },
      { name: 'Context', required: true, description: 'Background and problem statement' },
      { name: 'Decision', required: true, description: 'The decision made' },
      { name: 'Consequences', required: true, description: 'Impact of this decision' },
    ],
    qualityRules: {
      minLength: 400,
      tone: 'formal',
    },
  },
  api: {
    fileType: 'api',
    patterns: ['docs/api/*.md', 'docs/API.md'],
    sections: [
      { name: 'Endpoint', required: true, description: 'API endpoint path and method' },
      { name: 'Description', required: true, description: 'What this endpoint does' },
      { name: 'Request', required: true, description: 'Request format and parameters' },
      { name: 'Response', required: true, description: 'Response format and examples' },
      { name: 'Authentication', required: false, description: 'Auth requirements' },
      { name: 'Examples', required: false, description: 'curl examples' },
    ],
    qualityRules: {
      minLength: 300,
      requireCodeExamples: true,
      tone: 'technical',
    },
  },
  contributing: {
    fileType: 'contributing',
    patterns: ['CONTRIBUTING.md', 'docs/CONTRIBUTING.md'],
    sections: [
      { name: 'Welcome', required: true, description: 'Welcoming message for contributors' },
      { name: 'Code of Conduct', required: false, description: 'Link or inline code of conduct' },
      { name: 'How to Contribute', required: true, description: 'Contribution workflow' },
      { name: 'Development Setup', required: true, description: 'How to set up dev environment' },
      { name: 'Coding Standards', required: false, description: 'Style guides and conventions' },
      { name: 'Pull Request Process', required: true, description: 'How to submit PRs' },
    ],
    qualityRules: {
      minLength: 500,
      tone: 'friendly',
    },
  },
  other: {
    fileType: 'other',
    patterns: ['**/*.md'],
    sections: [
      { name: 'Content', required: true, description: 'Main documentation content' },
    ],
    qualityRules: {
      minLength: 200,
      tone: 'technical',
    },
  },
};

/**
 * Determine doc file type from path
 */
export function detectDocFileType(path: string): DocFileType {
  const lower = path.toLowerCase();
  
  if (lower.includes('readme')) return 'readme';
  if (lower.includes('changelog')) return 'changelog';
  if (lower.includes('adr') || lower.includes('decisions')) return 'adr';
  if (lower.includes('api')) return 'api';
  if (lower.includes('contributing')) return 'contributing';
  if (lower.includes('setup') || lower.includes('install')) return 'setup';
  if (lower.startsWith('docs/')) return 'guide';
  
  return 'other';
}

/**
 * Get appropriate contract for a file path
 */
export function getContractForPath(path: string): DocTypeContract {
  const fileType = detectDocFileType(path);
  return DOC_CONTRACTS[fileType];
}

/**
 * Multi-file documentation task specification
 */
export interface DocSet {
  /** Primary file (required) */
  primaryFile: {
    path: string;
    contract: DocTypeContract;
    priority: number;
  };
  /** Additional related files (optional) */
  relatedFiles: Array<{
    path: string;
    contract: DocTypeContract;
    priority: number;
  }>;
}

/**
 * Repository context for grounded documentation
 */
export interface RepoContext {
  /** Key files read from repository */
  keyFiles?: {
    path: string;
    preview: string;
  }[];
  /** Package manager info */
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'unknown';
  /** Tech stack indicators */
  techStack?: string[];
  /** License type */
  license?: string;
}

/**
 * Quality Review Rubric for documentation
 */
export const QUALITY_RUBRIC = {
  completeness: 'All required sections present with meaningful content',
  accuracy: 'Information matches actual repository files (no hallucination)',
  actionability: 'Setup/usage instructions are copy-paste ready commands',
  consistency: 'Consistent formatting, terminology, and style throughout',
  grounding: 'Every claim is backed by evidence from repository files',
};

/**
 * Build a contract-compliant, repo-grounded content prompt for AI
 * 
 * Key improvements for v2:
 * - Requires citing repository files before writing
 * - Explicit no-hallucination directive
 * - Quality review rubric included
 * - Produces PR-ready markdown diffs
 */
// ============================================================================
// Doc Pack Generator Configuration
// ============================================================================

/** Documentation pack level */
export type DocPack = 'readme' | 'standard' | 'full';

/** Documentation depth level */
export type DocDepth = 'lite' | 'standard' | 'deep';

/** All possible output target identifiers */
export type DocTarget =
  | 'README'
  | 'ARCHITECTURE'
  | 'API'
  | 'DEVELOPMENT'
  | 'DEPLOYMENT'
  | 'CONTRIBUTING'
  | 'FAQ'
  | 'CHANGELOG';

/** Default targets per doc pack level */
export const DOC_PACK_TARGETS: Record<DocPack, DocTarget[]> = {
  readme: ['README'],
  standard: ['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT'],
  full: ['README', 'ARCHITECTURE', 'API', 'DEVELOPMENT', 'DEPLOYMENT', 'CONTRIBUTING', 'FAQ', 'CHANGELOG'],
};

/** Max output tokens per depth level */
export const DOC_DEPTH_LIMITS: Record<DocDepth, number> = {
  lite: 4_000,
  standard: 16_000,
  deep: 64_000,
};

/** Hard ceiling - never exceed regardless of user input */
const MAX_OUTPUT_TOKENS_CAP = 64_000;

/** Input for doc pack resolution */
export interface DocPackInput {
  docPack?: DocPack;
  docDepth?: DocDepth;
  outputTargets?: string[];
  maxOutputTokens?: number;
  passes?: number;
}

/** Resolved (normalized) doc pack configuration */
export interface ResolvedDocPackConfig {
  docPack: DocPack;
  docDepth: DocDepth;
  outputTargets: DocTarget[];
  maxOutputTokens: number;
  passes: 1 | 2;
}

/**
 * Resolve doc pack configuration with defaults and constraints.
 * Applies the rules from the spec:
 * - Default: docPack=standard, docDepth=standard, passes=1
 * - If docPack=full OR docDepth=deep → passes=2, all targets
 * - maxOutputTokens capped at MAX_OUTPUT_TOKENS_CAP
 */
export function resolveDocPackConfig(input: DocPackInput = {}): ResolvedDocPackConfig {
  const docPack: DocPack = input.docPack ?? 'standard';
  const docDepth: DocDepth = input.docDepth ?? 'standard';

  const needsMultiPass = docPack === 'full' || docDepth === 'deep';
  const passes: 1 | 2 = needsMultiPass ? 2 : ((input.passes === 2 ? 2 : 1) as 1 | 2);

  // Resolve targets: user override > pack defaults; full/deep expands to all
  let outputTargets: DocTarget[];
  if (input.outputTargets && input.outputTargets.length > 0 && !needsMultiPass) {
    outputTargets = input.outputTargets.filter(
      (t): t is DocTarget => DOC_PACK_TARGETS.full.includes(t as DocTarget)
    );
    if (outputTargets.length === 0) outputTargets = DOC_PACK_TARGETS[docPack];
  } else if (needsMultiPass) {
    // full/deep always includes all targets (user can still narrow via outputTargets)
    outputTargets = input.outputTargets && input.outputTargets.length > 0
      ? input.outputTargets.filter((t): t is DocTarget => DOC_PACK_TARGETS.full.includes(t as DocTarget))
      : DOC_PACK_TARGETS.full;
    if (outputTargets.length === 0) outputTargets = DOC_PACK_TARGETS.full;
  } else {
    outputTargets = DOC_PACK_TARGETS[docPack];
  }

  const depthLimit = DOC_DEPTH_LIMITS[docDepth];
  const maxOutputTokens = Math.min(
    input.maxOutputTokens ?? depthLimit,
    MAX_OUTPUT_TOKENS_CAP
  );

  return { docPack, docDepth, outputTargets, maxOutputTokens, passes };
}

/** Map DocTarget to file path */
export function targetToPath(target: DocTarget): string {
  switch (target) {
    case 'README': return 'README.md';
    case 'ARCHITECTURE': return 'docs/ARCHITECTURE.md';
    case 'API': return 'docs/API.md';
    case 'DEVELOPMENT': return 'docs/DEVELOPMENT.md';
    case 'DEPLOYMENT': return 'docs/DEPLOYMENT.md';
    case 'CONTRIBUTING': return 'docs/CONTRIBUTING.md';
    case 'FAQ': return 'docs/FAQ.md';
    case 'CHANGELOG': return 'docs/CHANGELOG.md';
  }
}

// ============================================================================
// Architecture contract (new)
// ============================================================================

export const ARCHITECTURE_CONTRACT: DocTypeContract = {
  fileType: 'guide',
  patterns: ['docs/ARCHITECTURE.md'],
  sections: [
    { name: 'Overview', required: true, description: 'High-level system design and component diagram' },
    { name: 'Components', required: true, description: 'Major components/services with responsibilities' },
    { name: 'Data Flow', required: true, description: 'How data moves through the system' },
    { name: 'Technology Stack', required: false, description: 'Languages, frameworks, infrastructure' },
    { name: 'Diagrams', required: false, description: 'Mermaid or other diagrams', hints: ['Use mermaid fenced blocks'] },
  ],
  qualityRules: { minLength: 800, requireCodeExamples: false, tone: 'technical' },
};

// ============================================================================
// Deployment contract (new)
// ============================================================================

export const DEPLOYMENT_CONTRACT: DocTypeContract = {
  fileType: 'guide',
  patterns: ['docs/DEPLOYMENT.md'],
  sections: [
    { name: 'Prerequisites', required: true, description: 'Infrastructure requirements' },
    { name: 'Environment Variables', required: true, description: 'Required env vars with descriptions' },
    { name: 'Build & Deploy', required: true, description: 'Step-by-step deployment process' },
    { name: 'Monitoring', required: false, description: 'Health checks, logging, alerting' },
    { name: 'Rollback', required: false, description: 'How to rollback a bad deploy' },
  ],
  qualityRules: { minLength: 500, requireCodeExamples: true, tone: 'technical' },
};

// ============================================================================
// Development contract (new)
// ============================================================================

export const DEVELOPMENT_CONTRACT: DocTypeContract = {
  fileType: 'setup',
  patterns: ['docs/DEVELOPMENT.md'],
  sections: [
    { name: 'Prerequisites', required: true, description: 'Required tools and versions' },
    { name: 'Local Setup', required: true, description: 'Steps to get running locally' },
    { name: 'Commands', required: true, description: 'Dev, build, test, lint commands' },
    { name: 'Environment Variables', required: true, description: 'Required env vars' },
    { name: 'Troubleshooting', required: false, description: 'Common issues and fixes' },
  ],
  qualityRules: { minLength: 500, requireCodeExamples: true, tone: 'technical' },
};

// ============================================================================
// FAQ contract (new)
// ============================================================================

export const FAQ_CONTRACT: DocTypeContract = {
  fileType: 'guide',
  patterns: ['docs/FAQ.md'],
  sections: [
    { name: 'General', required: true, description: 'Common questions about the project' },
    { name: 'Setup Issues', required: false, description: 'Installation and setup problems' },
    { name: 'Usage', required: false, description: 'How-to questions' },
  ],
  qualityRules: { minLength: 300, tone: 'friendly' },
};

export function buildContractPrompt(
  contract: DocTypeContract,
  existingContent: string,
  taskDescription: string,
  repoContext?: RepoContext
): string {
  const requiredSections = contract.sections
    .filter(s => s.required)
    .map(s => `- **${s.name}** (REQUIRED): ${s.description}${s.hints ? ` [Hints: ${s.hints.join(', ')}]` : ''}`)
    .join('\n');
  
  const optionalSections = contract.sections
    .filter(s => !s.required)
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n');

  // Build repo context section if available
  let repoContextSection = '';
  if (repoContext?.keyFiles?.length) {
    repoContextSection = `
**Repository Evidence** (use ONLY this information):
${repoContext.keyFiles.map(f => `
[${f.path}]:
\`\`\`
${f.preview}
\`\`\``).join('\n')}

${repoContext.techStack?.length ? `Tech Stack Detected: ${repoContext.techStack.join(', ')}` : ''}
${repoContext.packageManager ? `Package Manager: ${repoContext.packageManager}` : ''}
${repoContext.license ? `License: ${repoContext.license}` : ''}
`;
  }

  return `You are a technical documentation specialist creating production-grade ${contract.fileType} documentation.

**CRITICAL RULES (MUST FOLLOW)**:
1. ONLY use information from the repository evidence provided below
2. DO NOT hallucinate features, commands, or configurations that are not in the evidence
3. If information is missing, note it as "TODO: Add [topic]" rather than making it up
4. Every command, endpoint, or technical detail MUST come from the repository files
5. Output ONLY valid Markdown - no explanations, no meta-commentary

**Task**: ${taskDescription}

**Documentation Contract (${contract.fileType})**:

Required sections (MUST include all):
${requiredSections}

Optional sections (include if evidence supports):
${optionalSections}

**Quality Review Rubric** (your output will be scored on):
- Completeness: ${QUALITY_RUBRIC.completeness}
- Accuracy: ${QUALITY_RUBRIC.accuracy}
- Actionability: ${QUALITY_RUBRIC.actionability}
- Consistency: ${QUALITY_RUBRIC.consistency}
- Grounding: ${QUALITY_RUBRIC.grounding}

**Quality Requirements**:
- Tone: ${contract.qualityRules.tone}
- Minimum length: ${contract.qualityRules.minLength || 200} characters
${contract.qualityRules.requireCodeExamples ? '- MUST include working code examples from repository' : ''}
${contract.qualityRules.requireLinks ? '- Include relevant internal links to other docs' : ''}
${repoContextSection}
**Existing Content** (preserve structure if updating):
\`\`\`
${existingContent || '(none - creating new file)'}
\`\`\`

**Instructions for High-Quality Output**:
1. READ the repository evidence carefully - cite it in your documentation
2. For README: Include project overview, features (from actual code), tech stack, setup commands (from package.json)
3. For setup guides: Extract exact commands from package.json scripts
4. For API docs: Use actual endpoint paths and response shapes
5. Include ONLY verifiable information - when unsure, add TODO placeholders
6. Format with proper Markdown: headers, code blocks, lists, tables where appropriate
7. Make setup instructions copy-paste ready (use exact commands from evidence)

**Output the complete updated Markdown document**:`;
}

