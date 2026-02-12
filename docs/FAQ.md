```markdown
# FAQ - AKIS Platform

## General

### What is the AKIS Platform?
AKIS is an AI Agent Orchestration System for Software Development that automates repetitive tasks such as documentation, test planning, and prototyping through autonomous AI agents orchestrated via a web interface. Outputs are committed as GitHub pull requests.

### How does AKIS work?
AKIS provides a structured agent orchestration framework where each agent:
1. **Plans** — Analyzes the codebase and creates an execution plan
2. **Executes** — Performs the task with deterministic prompts
3. **Reflects** — Reviews output quality with a critique step
4. **Delivers** — Commits results as a GitHub pull request

### What types of agents does AKIS have?
AKIS features three main agents:
- **Scribe**: Generates technical documentation
- **Trace**: Creates test plans with edge cases
- **Proto**: Scaffolds working prototypes

### What technologies does AKIS use?
AKIS is built using a modern tech stack:
| Component  | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 19 + Vite + Tailwind CSS                  |
| Backend    | Fastify + TypeScript (strict mode)              |
| Database   | PostgreSQL 16 + Drizzle ORM                     |
| AI         | OpenAI / OpenRouter (user-provided keys)       |
| Auth       | JWT (HTTP-only cookie), Email/Password, OAuth   |
| CI/CD      | GitHub Actions                                   |
| Deploy     | Docker Compose + Caddy (auto-HTTPS) on OCI ARM64|

### How can I get started with AKIS?
To get started with AKIS, follow these setup instructions:

1. Clone the repository:
    ```bash
    git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
    cd akis-platform-portfolio
    ```

2. Install dependencies:
    ```bash
    pnpm install
    ```

3. Set up the backend:
    ```bash
    cp backend/.env.example backend/.env
    pnpm -C backend dev
    ```

4. Set up the frontend:
    ```bash
    pnpm -C frontend dev
    # → Access the app at http://localhost:5173
    ```

## Setup Issues

### What should I do if I encounter issues during installation?
If you encounter issues during installation, check the following:
- Ensure all dependencies are properly installed.
- Verify that the `.env` file is configured correctly.
- Check the console output for specific error messages.

### How can I troubleshoot common setup problems?
Common troubleshooting steps include:
- Reviewing the installation logs for errors.
- Ensuring that the necessary services (e.g., database, external APIs) are running.
- Re-checking environment variable configurations.

## Usage

### How do I run an agent in AKIS?
To run an agent, you need to submit a job through the API. Here is an example of how to submit a job for the Scribe agent:
```bash
curl -X POST http://localhost:3000/api/agents/jobs \
-H "Content-Type: application/json" \
-d '{
  "type": "scribe",
  "payload": {
    "owner": "your-github-username",
    "repo": "your-repo-name",
    "baseBranch": "main",
    "targetPath": "README.md",
    "dryRun": false
  }
}'
```

### What are the expected responses from the AKIS API?
The expected responses from the AKIS API include:
- For job submission:
    ```json
    {
      "jobId": "uuid-string",
      "state": "pending"
    }
    ```
- For job status check:
    ```json
    {
      "id": "uuid-string",
      "type": "scribe",
      "state": "completed",
      "result": { ... },
      "error": null
    }
    ```

### Where can I find more detailed documentation on agents?
More detailed documentation on agents can be found in the following sections:
- [Agent Workflows](../backend/docs/AGENT_WORKFLOWS.md)
- [Agent Contracts](../backend/docs/agents/AGENT_CONTRACTS_S0.5.md)
- [API Specification](../backend/docs/API_SPEC.md)

### How do I report a bug or request a feature?
You can report bugs or request features by creating an issue on the project's GitHub repository or contacting the maintainers directly.

---
```
