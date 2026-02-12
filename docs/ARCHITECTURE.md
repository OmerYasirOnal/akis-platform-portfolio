```markdown
# AKIS Platform Architecture

## Overview

The AKIS Platform is an AI agent orchestration system designed to automate repetitive software engineering tasks, such as documentation generation, test planning, and prototyping. It employs a structured agent orchestration framework where each agent adheres to a defined lifecycle, enabling efficient task execution and quality assurance.

### High-Level System Design

```
React SPA → Caddy (auto-TLS) → Fastify API → PostgreSQL
                                     ↓
                              AgentOrchestrator
                              (FSM lifecycle)
                                     ↓
                              MCP Gateway → GitHub API
```

## Components

### Major Components/Services

| Component            | Responsibilities                                                                                       |
|----------------------|-------------------------------------------------------------------------------------------------------|
| **Frontend**         | React application providing user interface for agent orchestration and interaction.                   |
| **Caddy**            | Web server with automatic TLS handling for the application.                                           |
| **Fastify API**      | Backend service providing RESTful endpoints for agent interactions and data management.               |
| **PostgreSQL**       | Database for persistent storage of job states, user information, and agent outputs.                  |
| **AgentOrchestrator**| Central controller managing the lifecycle of agents through a finite state machine (FSM) model.      |
| **MCP Gateway**      | Interface for connecting to external services, such as GitHub and Jira, using the Model Context Protocol. |
| **Agents**           | Autonomous units (Scribe, Trace, Proto) that perform specific tasks within the orchestration framework. |

#### Agents

| Agent  | What It Does                                    | Input                                | Output                         |
|--------|------------------------------------------------|--------------------------------------|--------------------------------|
| **Scribe** | Generates technical documentation            | GitHub repo + branch                 | Markdown docs → PR             |
| **Trace**  | Creates test plans with edge cases          | Code module/directory                | Test plan document → PR        |
| **Proto**  | Scaffolds working prototypes                  | Spec/idea description                | Code scaffold → PR             |

## Data Flow

1. **Agent Initialization**: The user initiates a job via the frontend, which sends a request to the Fastify API.
2. **Job Submission**: The API creates a job entry in PostgreSQL and notifies the AgentOrchestrator.
3. **Task Planning**: The orchestrator triggers the selected agent (e.g., Scribe) to analyze the context and create a plan.
4. **Execution**: The agent executes the plan, performing tasks such as generating documentation or creating test plans.
5. **Reflection**: The agent reviews its output, providing critiques and ensuring quality standards are met.
6. **Delivery**: Upon completion, the results are committed to GitHub as a pull request via the MCP Gateway.

## Technology Stack

| Component | Technology                             |
|-----------|---------------------------------------|
| Frontend  | React 19 + Vite + Tailwind CSS       |
| Backend   | Fastify + TypeScript (strict mode)   |
| Database  | PostgreSQL 16 + Drizzle ORM          |
| AI        | OpenAI / OpenRouter (user-provided keys, AES-256-GCM encrypted) |
| Auth      | JWT (HTTP-only cookie) + Email/Password + OAuth (GitHub, Google) |
| CI/CD     | GitHub Actions (typecheck + lint + build + test on every PR) |
| Deploy    | Docker Compose + Caddy (auto-HTTPS) on OCI ARM64 |

### Security Measures

- User AI keys are encrypted at rest using AES-256-GCM.
- JWT sessions are managed via HTTP-only, Secure, SameSite cookies.
- Rate limiting is enforced on all API endpoints.
- Sensitive data is redacted from Server-Sent Events (SSE) streams.
- OAuth tokens are never exposed to the frontend.

## Setup Instructions

To set up the AKIS Platform locally, follow these commands:

```bash
git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
cd akis-platform-portfolio

# Install dependencies
pnpm install

# Backend
cp backend/.env.example backend/.env
pnpm -C backend dev

# Frontend
pnpm -C frontend dev
# → Open http://localhost:5173
```

## API Endpoints

### Health & Meta Endpoints

- **GET `/health`**: Health check endpoint.
  ```json
  {
    "status": "ok"
  }
  ```

- **GET `/ready`**: Readiness check.
  ```json
  {
    "ready": true
  }
  ```

- **GET `/version`**: Returns application version.
  ```json
  {
    "version": "0.1.0"
  }
  ```

### Agent Jobs API

- **POST `/api/agents/jobs`**: Submit a new agent job.
  ```json
  {
    "type": "scribe" | "trace" | "proto",
    "payload": { ... },
    "requiresStrictValidation": false
  }
  ```

- **GET `/api/agents/jobs/:id`**: Get job status and result.
  ```json
  {
    "id": "uuid-string",
    "type": "scribe",
    "state": "completed",
    "result": { ... }
  }
  ```

## Conclusion

The AKIS Platform leverages a modular architecture to streamline software engineering tasks through intelligent automation. With its robust data flow, solid technology stack, and thorough security measures, it provides a comprehensive solution for enhancing productivity in software development.
```