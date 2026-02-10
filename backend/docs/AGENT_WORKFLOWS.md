# AKIS Agent Workflows

> ## Özet (TR)
> Bu belge AKIS Platform'un otonom ajan sistem mimarisini ve iş akışlarını açıklar.
> AgentOrchestrator yaşam döngüsü, FSM durum geçişleri (pending → running → completed | failed),
> Plan → Yürüt → Yansıt hattı, Factory + Registry kalıbı, MCP adaptör entegrasyonu, SSE gerçek
> zamanlı akış ve kalite puanlamasını kapsar. Teknik detaylar aşağıda İngilizce olarak sunulmaktadır.

This document describes the autonomous agent system architecture and workflows in the AKIS Platform backend.

## Overview

AKIS Platform implements a **modular monolith** architecture with three primary autonomous agents:

1. **AKIS Scribe** - Documentation generation agent
2. **AKIS Trace** - Requirements tracing agent
3. **AKIS Proto** - Prototyping/code generation agent

All agents follow a unified **Plan → Execute → Reflect → Validate** pipeline orchestrated by the `AgentOrchestrator`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Fastify HTTP Layer                        │
│  /api/agents/jobs (POST)  │  /api/agents/jobs/:id (GET)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AgentOrchestrator                            │
│  - Job lifecycle management (FSM)                                │
│  - Plan → Execute → Reflect → Validate pipeline                  │
│  - Dependency injection (AIService, MCPTools)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Scribe  │    │  Trace   │    │  Proto   │
    │  Agent   │    │  Agent   │    │  Agent   │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Services Layer                            │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │ AIService   │  │ StaticCheck   │  │ MCP Adapters         │   │
│  │ (LLM calls) │  │ Runner        │  │ (GitHub/Jira/Confl.) │   │
│  └─────────────┘  └───────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Drizzle ORM)                      │
│  jobs │ job_plans │ job_audits │ users                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Job Lifecycle (State Machine)

```
     ┌─────────┐
     │ PENDING │ ──── Initial state after job submission
     └────┬────┘
          │ start()
          ▼
     ┌─────────┐
     │ RUNNING │ ──── Agent executing Plan→Execute→Reflect→Validate
     └────┬────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐  ┌────────┐
│COMPLETED│  │ FAILED │ ──── Terminal states
└─────────┘  └────────┘
```

**Valid Transitions**:
- `pending` → `running` (start)
- `running` → `completed` (success)
- `running` → `failed` (error)
- `pending` → `failed` (early failure)

---

## Pipeline Phases

### 1. Planning Phase

When `playbook.requiresPlanning = true`:

```typescript
const plan = await agent.plan(aiService.planner, context);
// Persisted to job_plans table
// Audited to job_audits (phase: 'plan')
```

**AIService.planTask()** uses `AI_MODEL_PLANNER` for strategic planning.

### 2. Execution Phase

```typescript
const result = await agent.executeWithTools(mcpTools, plan, context);
// OR fallback: await agent.execute(context);
// Audited to job_audits (phase: 'execute')
```

Agents can use MCP tools:
- `GitHubMCPService` - Repository operations
- `JiraMCPService` - Issue tracking
- `ConfluenceMCPService` - Documentation

### 3. Reflection Phase (Tool-Augmented)

When `playbook.requiresReflection = true`:

```typescript
// Run static checks first
const checkResults = await staticCheckRunner.runCriticalChecks();

// Pass check results to LLM for informed reflection
const critique = await agent.reflect(aiService.reflector, artifact, checkResults);
// Audited to job_audits (phase: 'reflect')
```

**Static Checks**:
- `lint` - ESLint validation
- `typecheck` - TypeScript compilation
- `test` - Unit tests (optional)
- `build` - Production build (optional)

### 4. Validation Phase (Strong Model)

When `job.requiresStrictValidation = true`:

```typescript
const validation = await aiService.validateWithStrongModel({
  artifact: result,
  plan: plan,
  reflection: critique,
  checkResults: checkResults,
});
// Audited to job_audits (phase: 'validate')
```

**AIService.validateWithStrongModel()** uses `AI_MODEL_VALIDATION` (stronger model) for final quality gate.

---

## Agent Specifications

### AKIS Scribe

**Purpose**: Generate technical documentation from code changes.

**Playbook**:
```typescript
{
  requiresPlanning: true,
  requiresReflection: true,
  maxRetries: 2,
}
```

**Workflow**:
1. Analyze code changes (via GitHubMCPService)
2. Plan documentation structure
3. Generate documentation content
4. Reflect on clarity and completeness
5. Optionally validate with strong model

**Payload**:
```json
{
  "type": "scribe",
  "payload": {
    "doc": "Feature description or documentation topic"
  }
}
```

### AKIS Trace

**Purpose**: Parse requirements and trace to implementation.

**Playbook**:
```typescript
{
  requiresPlanning: true,
  requiresReflection: true,
  maxRetries: 1,
}
```

**Workflow**:
1. Parse natural language requirements
2. Identify acceptance criteria
3. Map to Jira issues (via JiraMCPService)
4. Generate traceability matrix
5. Reflect on coverage

**Payload**:
```json
{
  "type": "trace",
  "payload": {
    "spec": "User logs in → sees dashboard → can edit profile"
  }
}
```

### AKIS Proto

**Purpose**: Generate prototype code from specifications.

**Playbook**:
```typescript
{
  requiresPlanning: true,
  requiresReflection: true,
  maxRetries: 3,
}
```

**Workflow**:
1. Analyze feature requirements
2. Plan implementation approach
3. Generate code scaffold
4. Create branch and commit (via GitHubMCPService)
5. Run static checks
6. Reflect and iterate if needed

**Payload**:
```json
{
  "type": "proto",
  "payload": {
    "feature": "Add user profile editing functionality"
  }
}
```

---

## AI Model Configuration

The system supports multi-model strategies via environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `AI_PROVIDER` | Provider selection | `openrouter`, `openai`, `mock` |
| `AI_MODEL_DEFAULT` | General generation | `meta-llama/llama-3.3-70b-instruct:free` |
| `AI_MODEL_PLANNER` | Strategic planning | Same as default or different |
| `AI_MODEL_VALIDATION` | Quality validation | `google/gemini-2.0-flash-exp:free` (stronger) |

**Budget-Aware Strategy**:
- Use cost-effective models for planning/generation
- Reserve powerful models for validation phase
- Mock provider for development/testing

---

## Database Schema

### jobs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | VARCHAR | Agent type (scribe/trace/proto) |
| state | ENUM | pending/running/completed/failed |
| payload | JSONB | Input payload |
| result | JSONB | Execution result |
| error | VARCHAR | Error message if failed |
| requiresStrictValidation | BOOLEAN | Enable strong model validation |
| createdAt | TIMESTAMP | Creation time |
| updatedAt | TIMESTAMP | Last update time |

### job_plans

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| jobId | UUID | Foreign key to jobs |
| steps | JSONB | Plan steps array |
| rationale | TEXT | Planning rationale |

### job_audits

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| jobId | UUID | Foreign key to jobs |
| phase | ENUM | plan/execute/reflect/validate |
| payload | JSONB | Phase output data |
| createdAt | TIMESTAMP | Audit timestamp |

---

## Extension Points

### Adding a New Agent

1. Create agent class in `src/agents/newagent/NewAgent.ts`
2. Extend `BaseAgent` and implement `IAgent`
3. Define playbook requirements
4. Register in `src/core/agents/registry.ts`
5. Add payload validation in `src/api/agents.ts`

### Adding a New MCP Adapter

1. Create adapter in `src/services/mcp/adapters/`
2. Follow JSON-RPC 2.0 pattern (see `GitHubMCPService`)
3. Export from `index.ts`
4. Add to `MCPTools` interface

### Customizing AI Behavior

1. Modify prompts in `AIService.ts`
2. Adjust temperature/parameters per method
3. Add new model roles if needed

