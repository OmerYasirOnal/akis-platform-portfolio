```markdown
# AKIS Platform Deployment Documentation

## Prerequisites
Before deploying the AKIS Platform, ensure that you have the following infrastructure in place:

- An OCI Free Tier ARM64 VM for hosting the application.
- Docker and Docker Compose installed on the VM.
- PostgreSQL 16 database configured and accessible.
- GitHub account for integrating with the platform.
- AI service keys for OpenAI or OpenRouter.

## Environment Variables
The following environment variables are required for the AKIS Platform. Ensure to configure these in your `.env` file:

| Variable                   | Description                                             |
|----------------------------|---------------------------------------------------------|
| `GITHUB_TOKEN`             | Personal Access Token for GitHub API access.           |
| `OPENAI_API_KEY`          | API key for OpenAI services.                           |
| `OPENROUTER_API_KEY`      | API key for OpenRouter services (if used).             |
| `DATABASE_URL`             | Connection string for PostgreSQL database.             |
| `JWT_SECRET`               | Secret key for JWT authentication.                      |
| `AI_MODEL_DEFAULT`         | Default AI model to be used for agent jobs.            |
| `AI_MODEL_PLANNER`         | AI model used for planning tasks.                       |
| `AI_MODEL_VALIDATION`      | Strong model used for validation tasks.                 |
| `MCP_GATEWAY_URL`          | URL for the MCP Gateway service.                        |

## Build & Deploy
Follow these steps to build and deploy the AKIS Platform:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
   cd akis-platform-portfolio
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up the environment variables:**
   Copy the example environment file and modify it with your configurations.
   ```bash
   cp backend/.env.example backend/.env
   ```

4. **Run the backend:**
   Start the backend service.
   ```bash
   pnpm -C backend dev
   ```

5. **Run the frontend:**
   Start the frontend service.
   ```bash
   pnpm -C frontend dev
   # Access the application at http://localhost:5173
   ```

6. **Docker Deployment:**
   For Docker deployment, ensure you have a `docker-compose.yml` configured. To deploy, use:
   ```bash
   docker-compose up -d
   ```

7. **Health Check:**
   After deployment, verify that the application is running correctly by checking the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

8. **Access the application:**
   Navigate to `http://localhost:3000` to access the AKIS Platform.

## Monitoring
### Health Checks
- The health check endpoint provides the status of the application.
  ```http
  GET /health
  ```
  **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

### Logging
- The application logs events to the console. For detailed logging, ensure your logging configuration is set to the desired level.

### Alerting
- Implement alerting based on the application's health check status and error logs to stay informed about potential issues.

## Rollback
In case of a bad deploy, you can rollback the last deployment by following these steps:

1. **Stop the current deployment:**
   ```bash
   docker-compose down
   ```

2. **Pull the previous stable image/version:**
   Adjust your `docker-compose.yml` to point to the previous version.

3. **Redeploy:**
   ```bash
   docker-compose up -d
   ```

4. **Verify the rollback:**
   Check the application health again:
   ```bash
   curl http://localhost:3000/health
   ```

---

For further details about the API and agent workflows, refer to the [API Specification](./API_SPEC.md) and [Agent Workflows](./AGENT_WORKFLOWS.md).
```
