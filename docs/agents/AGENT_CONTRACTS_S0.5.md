# Agent Contracts — S0.5

> ## Özet (TR)
> Bu belge Scribe, Trace ve Proto ajanlarının girdi/çıktı sözleşmelerini, hata kodlarını,
> golden path senaryolarını ve kalite metriklerini tanımlar. Her ajanın typed Contract + Playbook
> yapısı, deterministic prompt kuralları (temperature=0) ve standart hata zarfı burada belgelenmiştir.
> Teknik detaylar aşağıda İngilizce olarak sunulmaktadır.

> **Task ID:** S0.5.1-AGT-1 (updated by AGT-6)
> **Version:** 1.1.0
> **Date:** 2026-02-09
> **Source of truth:** Backend agent implementations in `backend/src/agents/`

This document specifies the input/output schemas and error taxonomy for the three AKIS agents: **Scribe**, **Trace**, and **Proto**. Each section includes the API-level payload schema, the agent-level result schema, and shared error codes.

---

## Table of Contents

1. [Shared Concepts](#1-shared-concepts)
2. [Scribe Agent](#2-scribe-agent)
3. [Trace Agent](#3-trace-agent)
4. [Proto Agent](#4-proto-agent)
5. [Error Taxonomy](#5-error-taxonomy)
6. [API Envelope](#6-api-envelope)
7. [Example Requests & Responses](#7-example-requests--responses)

---

## 1. Shared Concepts

### 1.1 Agent Lifecycle (FSM)

```
pending ──▶ running ──▶ completed
                   └──▶ failed
                   └──▶ awaiting_approval (Scribe only, when requiresApproval=true)
```

All agents follow the `IAgent` interface registered via `AgentFactory.register()`. The orchestrator injects tools (MCP adapters, AI service) — agents never instantiate clients directly.

### 1.2 Playbook Capabilities

| Capability | Scribe | Trace | Proto |
|---|---|---|---|
| `requiresPlanning` | yes | yes | yes |
| `requiresReflection` | no | no | yes |
| Approval workflow | yes (opt-in) | no | no |
| Dry-run mode | yes | yes | yes |
| GitHub integration | full (MCP) | optional | optional |
| AI service | required | optional | optional |
| Explainability (S1.1) | full | basic | basic |

### 1.3 Common Optional Fields

These fields appear in all three payload schemas:

| Field | Type | Default | Description |
|---|---|---|---|
| `owner` | `string` | — | GitHub repository owner |
| `repo` | `string` | — | GitHub repository name |
| `baseBranch` | `string` | `'main'` | Base branch for operations |
| `dryRun` | `boolean` | `false` | Simulate without writing to GitHub |

---

## 2. Scribe Agent

**Purpose:** Autonomous documentation specialist. Reads a codebase, generates or updates documentation files, and opens a PR.

**Source:** `backend/src/agents/scribe/ScribeAgent.ts`
**Agent ID string:** `'scribe-v2'`

### 2.1 Input Schema (ScribePayload)

```typescript
// POST /api/agents/jobs  { type: 'scribe', payload: ScribePayload }

interface ScribePayload {
  // Required (legacy mode)
  owner: string;
  repo: string;
  baseBranch: string;

  // Config-aware mode (S0.4.6)
  mode?: 'from_config' | 'test' | 'run';

  // Documentation scope
  docPack?: 'readme' | 'standard' | 'full';
  docDepth?: 'lite' | 'standard' | 'deep';
  outputTargets?: string[];

  // Branch & PR
  featureBranch?: string;
  targetPath?: string;
  branchPattern?: string;           // e.g. 'docs/scribe-{timestamp}'
  prTitleTemplate?: string;
  prBodyTemplate?: string | null;

  // Generation control
  maxOutputTokens?: number;         // Server-enforced cap
  passes?: number;                  // 1 or 2 generation passes
  analyzeLastNCommits?: number;     // Context window from N recent commits

  // Approval flow (PR-1)
  requiresApproval?: boolean;

  // Misc
  taskDescription?: string;
  jobId?: string;
  dryRun?: boolean;
}
```

**Validation:** Zod schema in `backend/src/api/agents.ts` — `ScribePayloadSchema` requires `owner`, `repo`, `baseBranch`.

### 2.2 Output Schema (ScribeResult)

```typescript
interface ScribeResult {
  ok: boolean;
  agent: 'scribe-v2';
  mode: 'contract-first-doc-specialist';
  filesUpdated: number;

  // Plan (from planning phase)
  plan?: {
    sections: Array<{ path: string; outline: string }>;
  };

  // DocPack configuration used
  docPackConfig?: {
    pack: string;
    depth: string;
    targets: string[];
  };

  // GitHub artifacts
  branch?: string;
  branchCreated?: boolean;
  commits?: Array<{
    path: string;
    commit: { sha?: string; message?: string };
  }>;
  pullRequest?: { url?: string };

  // Quality review
  critiques?: Array<{
    path: string;
    critique: {
      issues: string[];
      suggestions: string[];
      score?: number;
    };
  }>;

  // Dry-run preview
  dryRun?: boolean;
  preview?: {
    branch: string;
    files: Array<{
      path: string;
      contentLength: number;
      linesAdded: number;
    }>;
    commitMessage: string;
  };

  // Diagnostics
  diagnostics: {
    mode: 'dry-run' | 'execute';
    operations: Array<{
      file: string;
      bytes: number;
      linesChanged: number;
    }>;
    targets: string[];
  };

  // Edge cases
  fileMissing?: boolean;
}
```

### 2.3 Documentation Contracts

Scribe uses typed contracts (`DocContract.ts`) to enforce structural consistency:

| Contract | Required Sections |
|---|---|
| `README_CONTRACT` | Title, Features, Installation, Usage, Configuration, Contributing, License |
| `GUIDE_CONTRACT` | Overview, Prerequisites, Main Content, Examples, Troubleshooting, Next Steps |
| `CHANGELOG_CONTRACT` | Unreleased, Versions, Breaking Changes |
| `ADR_CONTRACT` | Status, Context, Decision, Consequences |
| `API_CONTRACT` | Overview, Authentication, Endpoints, Examples, Error Handling |

---

## 3. Trace Agent

**Purpose:** Test plan generator. Takes a specification (text, Gherkin, or structured format) and produces test scenarios, test files, and a coverage matrix.

**Source:** `backend/src/agents/trace/TraceAgent.ts`
**Agent ID string:** `'trace'`

### 3.1 Input Schema (TracePayload)

```typescript
// POST /api/agents/jobs  { type: 'trace', payload: TracePayload }

interface TracePayload {
  spec: string;                         // Specification text (required)
  owner?: string;                       // GitHub owner
  repo?: string;                        // Repository name
  baseBranch?: string;                  // Base branch
  branchStrategy?: 'auto' | 'manual';  // Branch creation strategy
  dryRun?: boolean;
}
```

**Validation:** Zod schema — `spec` is required (non-empty string).

### 3.2 Output Schema (TraceResult)

```typescript
interface TraceResult {
  ok: boolean;
  agent: 'trace';

  // Parsed test scenarios
  files: Array<{
    path: string;
    cases: Array<{
      name: string;
      steps: string[];
    }>;
  }>;

  // Generated artifacts
  testPlan: string;                     // Markdown test plan
  coverageMatrix: Record<string, string[]>;  // Feature → Test mapping
  artifacts?: Array<{
    filePath: string;
    content?: string;
  }>;

  // GitHub artifacts
  branch?: string;
  prUrl?: string;

  // Metadata
  metadata: {
    scenarioCount: number;
    totalTestCases: number;
    specLength: number;
    committed?: boolean;
    githubError?: string;
  };
}
```

### 3.3 Spec Parsing Strategies

Trace supports multiple specification formats, detected automatically:

| Strategy | Trigger Pattern | Example |
|---|---|---|
| Gherkin | `Scenario:` keyword | `Scenario: Login ► Given email ► When submit ► Then dashboard` |
| Arrow notation | `->` delimiters | `login -> enter email -> click submit -> see dashboard` |
| Colon notation | `name: steps` | `Login: enter email, click submit, verify dashboard` |
| Sentence-based | Period-separated | `User enters email. System validates. Dashboard loads.` |
| Line-based | Fallback | One scenario per line |

### 3.4 Generated Artifacts

| File | Description |
|---|---|
| `test-plan.md` | Structured test plan document |
| `trace-tests.test.ts` | Generated test file with scenario stubs |
| `coverage-matrix.md` | Feature-to-test traceability matrix |

---

## 4. Proto Agent

**Purpose:** MVP scaffold generator. Takes a feature definition or requirements document and produces a working project skeleton.

**Source:** `backend/src/agents/proto/ProtoAgent.ts`
**Agent ID string:** `'proto'`

### 4.1 Input Schema (ProtoPayload)

```typescript
// POST /api/agents/jobs  { type: 'proto', payload: ProtoPayload }

interface ProtoPayload {
  requirements?: string;                // Project requirements (one of requirements/goal required)
  goal?: string;                        // Alternative to requirements
  owner?: string;                       // GitHub owner
  repo?: string;                        // Repository name
  baseBranch?: string;                  // Base branch
  branchStrategy?: 'auto' | 'manual';  // Branch creation strategy
  stack?: string;                       // Preferred tech stack hint
  dryRun?: boolean;
}
```

**Validation:** Zod schema — at least one of `requirements` or `goal` must be provided.

### 4.2 Output Schema (ProtoResult)

```typescript
interface ProtoResult {
  ok: boolean;
  agent: 'proto';

  // Generated scaffold files
  artifacts: Array<{
    filePath: string;
    content?: string;
  }>;

  // GitHub artifacts
  branch?: string;
  prUrl?: string;
  message?: string;

  // Metadata
  metadata: {
    filesCreated: number;
    committed: boolean;
    githubError?: string;
  };
}
```

### 4.3 Default Scaffold (Fallback)

When AI generation fails or is unavailable, Proto produces a minimal scaffold:

| File | Content |
|---|---|
| `README.md` | Project description from requirements |
| `package.json` | Basic Node.js project metadata |
| `index.js` | Placeholder entry point |

---

## 5. Error Taxonomy

### 5.0 Standard Error Envelope (AGT-6)

**All** backend error responses MUST use this shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  },
  "requestId": "uuid"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `error.code` | `string` | yes | Machine-readable error code (see tables below) |
| `error.message` | `string` | yes | Human-readable description |
| `error.details` | `unknown` | no | Structured extra data (Zod issues, provider info, etc.) |
| `requestId` | `string` | yes | Correlation ID from `request-id` header or auto-generated UUID |

**Backend helper:** `sendError(reply, request, code, message, details?)` in `backend/src/utils/errorHandler.ts`.

**Frontend consumer:** `HttpClient.parseErrorResponse()` reads `error.code`, `error.message`, `error.details` from response JSON and `requestId` from the `request-id` response header.

**Global error handler:** Registered in `server.app.ts`. Catches unhandled `ZodError` (→ `VALIDATION_ERROR`), Fastify schema validation errors, and known application errors. Unknown errors map to `INTERNAL_ERROR` with no internal detail leakage.

### 5.1 Error Codes — AI / Agent

All agents use structured error codes stored in `job.errorCode`:

| Code | Source | HTTP | Description | User-Facing Message |
|---|---|---|---|---|
| `AI_RATE_LIMITED` | AI provider | 429 | Rate limit hit | "The AI service is busy. Your job will retry automatically." |
| `AI_PROVIDER_ERROR` | AI provider | 503 | Generic provider failure | "The AI service encountered an error. Please try again." |
| `AI_INVALID_RESPONSE` | AI provider | 503 | Unparseable AI output | "The AI returned an unexpected response. Please retry." |
| `AI_NETWORK_ERROR` | AI provider | 503 | Network timeout/failure | "Could not reach the AI service. Check your connection." |
| `AI_AUTH_ERROR` | AI provider | 502 | Invalid API key | "AI authentication failed. Check your API key in Settings." |
| `AI_KEY_MISSING` | Configuration | 412 | No API key configured | "No AI key configured. Add one in Settings > AI Keys." |
| `AI_MODEL_NOT_FOUND` | Configuration | 404 | Model not available | "The requested model is not available." |
| `MODEL_NOT_ALLOWED` | Configuration | 400 | Model not in allowlist | "This model is not allowed. Choose from the approved list." |

### 5.1b Error Codes — Auth

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `INVALID_CREDENTIALS` | 401 | Wrong password |
| `EMAIL_IN_USE` | 409 | Email already registered |
| `USER_NOT_FOUND` | 404 | No account with this email/ID |
| `EMAIL_NOT_VERIFIED` | 403 | Email not yet verified |
| `ALREADY_VERIFIED` | 403 | Email already verified |
| `INVALID_CODE` | 400 | Wrong or expired verification code |
| `RATE_LIMITED` | 429 | Too many attempts |
| `USER_DISABLED` | 403 | Account suspended |
| `INVALID_PROVIDER` | 400 | Unknown OAuth provider |
| `OAUTH_NOT_CONFIGURED` | 503 | OAuth provider not configured on server |

### 5.1c Error Codes — Settings / Config

| Code | HTTP | Description |
|---|---|---|
| `ENCRYPTION_NOT_CONFIGURED` | 503 | `AI_KEY_ENCRYPTION_KEY` not set on server |
| `DUPLICATE_KEY` | 409 | API key already exists for this provider |
| `FORBIDDEN` | 403 | Insufficient permissions |

### 5.1d Error Codes — Core

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params failed Zod or JSON schema validation |
| `NOT_FOUND` | 404 | Resource not found (job, route, etc.) |
| `INVALID_STATE` | 409 | Invalid state transition (e.g. running -> pending) |
| `DATABASE_ERROR` | 500 | Database operation failure (details not leaked) |
| `INTERNAL_ERROR` | 500 | Catch-all for unknown errors (details not leaked) |

### 5.2 Error Classes (Backend)

```
AgentError (base)
├── JobNotFoundError              — Job UUID not in database
├── InvalidStateTransitionError   — e.g. running → pending
├── DatabaseError                 — DB operation failure
└── AIProviderError               — Base for AI errors
    ├── AIRateLimitedError        — includes retryAfter (seconds)
    ├── MissingAIKeyError         — no key for provider
    └── ModelNotAllowedError      — model not in allowlist
```

### 5.3 Agent-Level Errors

| Scenario | Error Behavior |
|---|---|
| GitHub MCP unreachable | Job completes with `metadata.githubError` set |
| Empty spec (Trace) | Validation rejects before agent runs |
| No requirements/goal (Proto) | Validation rejects before agent runs |
| AI generates empty output | Agent falls back to minimal output |
| Branch creation fails | `branchCreated: false`, continues with existing branch |
| PR creation fails | `pullRequest: { url: undefined }`, job still completes |

---

## 6. API Envelope

### 6.1 Submit Job

```
POST /api/agents/jobs
Content-Type: application/json

{
  "type": "scribe" | "trace" | "proto",
  "payload": { ... },                    // Agent-specific (see sections 2-4)
  "requiresStrictValidation"?: boolean   // Enforce full schema validation
}

→ 201 Created
{
  "jobId": "uuid",
  "state": "pending"
}
```

### 6.2 Get Job

```
GET /api/agents/jobs/:id?include=plan,audit,trace,artifacts

→ 200 OK
{
  "id": "uuid",
  "type": "scribe",
  "state": "completed",
  "payload": { ... },
  "result": { ... },                     // Agent-specific result
  "error": null,
  "errorCode": null,
  "errorMessage": null,
  "aiMetrics": {
    "requested": { "provider": "openai", "model": "gpt-5-mini" },
    "resolved": { "provider": "openai", "model": "gpt-5-mini", "keySource": "user" },
    "summary": {
      "totalDurationMs": 12500,
      "inputTokens": 3200,
      "outputTokens": 1800,
      "totalTokens": 5000,
      "estimatedCostUsd": 0.015
    }
  },
  "qualityScore": 85,
  "createdAt": "2026-02-08T10:00:00Z",
  "updatedAt": "2026-02-08T10:00:12Z"
}
```

### 6.3 List Jobs

```
GET /api/agents/jobs?type=scribe&state=completed&limit=20&cursor=...

→ 200 OK
{
  "items": [ ... ],
  "nextCursor": "base64..."
}
```

### 6.4 Cancel Job

```
POST /api/agents/jobs/:id/cancel

→ 200 OK
{
  "id": "uuid",
  "state": "failed",
  "message": "Job cancelled by user"
}
```

### 6.5 Revision Chain (PR-2)

```
POST /api/agents/jobs/:id/revise
{
  "instruction": "Add more detail to the API section",
  "mode": "edit" | "regenerate",
  "scope": "files" | "plan" | "both"
}

→ 201 Created
{
  "jobId": "new-uuid",
  "parentJobId": "original-uuid",
  "state": "pending"
}
```

---

## 7. Example Requests & Responses

### 7.1 Scribe — Generate README

**Request:**
```json
{
  "type": "scribe",
  "payload": {
    "owner": "akisflow",
    "repo": "demo-app",
    "baseBranch": "main",
    "docPack": "readme",
    "docDepth": "standard",
    "dryRun": true
  }
}
```

**Response (dry-run):**
```json
{
  "ok": true,
  "agent": "scribe-v2",
  "mode": "contract-first-doc-specialist",
  "filesUpdated": 1,
  "dryRun": true,
  "preview": {
    "branch": "docs/scribe-1707350400",
    "files": [
      { "path": "README.md", "contentLength": 4200, "linesAdded": 120 }
    ],
    "commitMessage": "docs: generate README.md via Scribe agent"
  },
  "diagnostics": {
    "mode": "dry-run",
    "operations": [{ "file": "README.md", "bytes": 4200, "linesChanged": 120 }],
    "targets": ["README.md"]
  }
}
```

### 7.2 Trace — Generate Test Plan from Spec

**Request:**
```json
{
  "type": "trace",
  "payload": {
    "spec": "Scenario: User login\nGiven a registered user\nWhen they enter valid credentials\nThen they see the dashboard\n\nScenario: Invalid password\nGiven a registered user\nWhen they enter wrong password\nThen they see an error message",
    "dryRun": true
  }
}
```

**Response:**
```json
{
  "ok": true,
  "agent": "trace",
  "files": [
    {
      "path": "trace-tests.test.ts",
      "cases": [
        { "name": "User login", "steps": ["Given a registered user", "When they enter valid credentials", "Then they see the dashboard"] },
        { "name": "Invalid password", "steps": ["Given a registered user", "When they enter wrong password", "Then they see an error message"] }
      ]
    }
  ],
  "testPlan": "# Test Plan\n\n## Scenario: User login\n...",
  "coverageMatrix": {
    "User login": ["login-happy-path"],
    "Invalid password": ["login-error-handling"]
  },
  "metadata": {
    "scenarioCount": 2,
    "totalTestCases": 2,
    "specLength": 210
  }
}
```

### 7.3 Proto — Scaffold MVP

**Request:**
```json
{
  "type": "proto",
  "payload": {
    "requirements": "Build a REST API for a todo list app with CRUD operations, user authentication, and PostgreSQL storage",
    "stack": "Node.js + Express + TypeScript",
    "dryRun": true
  }
}
```

**Response:**
```json
{
  "ok": true,
  "agent": "proto",
  "artifacts": [
    { "filePath": "README.md", "content": "# Todo API\n..." },
    { "filePath": "package.json", "content": "{...}" },
    { "filePath": "src/index.ts", "content": "import express from 'express';\n..." },
    { "filePath": "src/routes/todos.ts", "content": "..." },
    { "filePath": "src/db/schema.ts", "content": "..." }
  ],
  "metadata": {
    "filesCreated": 5,
    "committed": false
  }
}
```

### 7.4 Error Response

**Request with missing AI key:**
```json
{
  "type": "scribe",
  "payload": {
    "owner": "akisflow",
    "repo": "demo",
    "baseBranch": "main"
  }
}
```

**Response (after job fails):**
```json
{
  "id": "abc-123",
  "type": "scribe",
  "state": "failed",
  "errorCode": "AI_KEY_MISSING",
  "errorMessage": "No AI key configured. Add one in Settings → AI Keys."
}
```

---

## Appendix A: Model Policy

Users choose the AI model per agent. The allowed models are centralized in backend configuration:

| Tier | Model | Use Case |
|---|---|---|
| Default | `gpt-5-mini` | Balanced quality/cost |
| Cheap | `gpt-4o-mini` | High-volume, simple tasks |
| Escalation | `gpt-5.2` | Complex or quality-critical tasks |

---

*This document is the canonical reference for agent contracts. Keep it synchronized with code changes in `backend/src/agents/` and `backend/src/api/agents.ts`.*
