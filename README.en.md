# AKIS Platform

**AI Agent Orchestration System for Software Development**

> 🌐 [Türkçe sürüm → README.md](README.md)

AKIS automates repetitive software engineering tasks — documentation, test planning, and prototyping — through autonomous AI agents orchestrated via a web interface. Outputs are committed as GitHub pull requests.

**Live Demo:** [staging.akisflow.com](https://staging.akisflow.com)

### Screenshots

| Landing Page | Login (OAuth) | Sign Up |
|:---:|:---:|:---:|
| ![Landing](docs/public/assets/landing-hero.png) | ![Login](docs/public/assets/oauth-login.png) | ![Signup](docs/public/assets/signup-onboarding.png) |

---

## The Problem

Software teams spend significant time on repetitive tasks: keeping documentation in sync, writing test plans, and scaffolding boilerplate code. These tasks are well-defined, pattern-driven, and ripe for automation — yet most AI coding tools focus on inline code completion rather than end-to-end task automation.

## The Solution

AKIS provides a **structured agent orchestration framework** where each agent:
1. **Plans** — Analyzes the codebase and creates an execution plan
2. **Executes** — Performs the task with deterministic prompts
3. **Reflects** — Reviews output quality with a critique step
4. **Delivers** — Commits results as a GitHub pull request

---

## Agents

| Agent | What It Does | Input | Output |
|-------|-------------|-------|--------|
| **Scribe** | Generates technical documentation | GitHub repo + branch | Markdown docs → PR |
| **Trace** | Creates test plans with edge cases | Code module/directory | Test plan document → PR |
| **Proto** | Scaffolds working prototypes | Spec/idea description | Code scaffold → PR |

---

## Architecture Highlights

```
React SPA → Caddy (auto-TLS) → Fastify API → PostgreSQL
                                     ↓
                              AgentOrchestrator
                              (FSM lifecycle)
                                     ↓
                              MCP Gateway → GitHub API
```

### Key Technical Decisions

- **Modular monolith** — Single deployable backend, optimized for constrained infrastructure (OCI Free Tier ARM64 VM)
- **MCP Protocol** — All external service access through Model Context Protocol adapters. No direct vendor SDKs.
- **Orchestrator pattern** — Central `AgentOrchestrator` owns full agent lifecycle. Agents are isolated.
- **FSM state machine** — Every job follows `pending → running → completed | failed` with full trace logging
- **Contract-first agents** — Each agent has a typed Contract + Playbook. Prompts are deterministic (temperature=0).
- **Context packs** — Static file bundles assembled per agent with token/file limits.

### Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Fastify + TypeScript (strict mode) |
| Database | PostgreSQL 16 + Drizzle ORM |
| AI | OpenAI / OpenRouter (user-provided keys, AES-256-GCM encrypted) |
| Auth | JWT (HTTP-only cookie) + Email/Password + OAuth (GitHub, Google) |
| CI/CD | GitHub Actions (typecheck + lint + build + test on every PR) |
| Deploy | Docker Compose + Caddy (auto-HTTPS) on OCI ARM64 |

---

## Numbers

| Metric | Value |
|--------|-------|
| Automated tests | **1,344** (797 backend + 547 frontend) |
| Test files | 106 (unit, component, E2E) |
| Source files | 322 TypeScript/TSX |
| Lines of code | ~58,000 |
| API endpoints | ~89 |
| i18n translation keys | ~500 (English + Turkish) |
| Quality gate checks | 4 (typecheck, lint, build, test) — all green |
| Staging smoke tests | 12/12 passing |

---

## What I Built (Engineering Highlights)

### Agent Orchestration Engine
- Full FSM lifecycle management with state persistence
- Factory + Registry pattern for dynamic agent instantiation
- Plan → Execute → Reflect pipeline with quality scoring (0-100)
- Real-time job streaming via Server-Sent Events (SSE)
- Stale job detection with configurable watchdog

### Authentication System
- Multi-step email/password flow with 6-digit verification codes (15min expiry, bcrypt)
- OAuth integration (GitHub + Google) with automatic welcome emails
- JWT sessions in HTTP-only, Secure, SameSite cookies

### Developer Experience
- Cursor-inspired UI with lazy-loaded pages (50% bundle size reduction)
- 3-step onboarding flow: connect GitHub → add AI key → run first agent
- Bilingual interface (English/Turkish) with ~500 i18n keys
- Standardized error handling with error envelope pattern

### Infrastructure & DevOps
- Docker multi-arch builds (amd64 + arm64)
- CI/CD pipeline: GitHub Actions with quality gates on every PR
- Staging deploy with health verification, version check, and auto-rollback
- 12-check automated smoke test suite
- MCP Gateway always-on in staging (zero manual post-deploy steps)

### Security
- AES-256-GCM encryption for user AI keys at rest
- Sensitive data redaction in SSE streams (GitHub PATs, OAuth tokens, API keys)
- Rate limiting, Helmet headers, CORS enforcement
- API key masking in UI (last 4 characters only)

---

## About

Built by **Ömer Yasir Önal** as a senior thesis project at Istanbul Fatih Sultan Mehmet University (2025-2026).

**Thesis:** *Can a structured AI agent orchestration framework improve developer productivity in documentation, testing, and prototyping tasks while maintaining output quality through automated review and critique pipelines?*

### Approach
- **Design Science Research (DSR)** methodology
- Iterative development with 7 phases over 4 months
- Pilot evaluation with real users on staging environment
- Quantitative metrics: task completion time, output quality scores, test coverage

---

## License

MIT
