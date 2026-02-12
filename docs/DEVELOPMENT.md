```markdown
# AKIS Platform - Development Documentation

## Prerequisites

To set up the AKIS platform locally, ensure you have the following tools installed:

- **Node.js**: v16.x or later
- **pnpm**: v6.x or later
- **Docker**: v20.x or later (for running database and other services)
- **Git**: For version control
- **PostgreSQL**: v16.x or later (if not using Docker)

## Local Setup

Follow these steps to set up the AKIS platform on your local machine:

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
   # Access the application at http://localhost:5173
   ```

## Commands

Here are the commands you can run for development, testing, and linting:

### Development Commands
- Start backend:
  ```bash
  pnpm -C backend dev
  ```
- Start frontend:
  ```bash
  pnpm -C frontend dev
  ```

### Build Commands
- Build backend:
  ```bash
  pnpm -C backend build
  ```
- Build frontend:
  ```bash
  pnpm -C frontend build
  ```

### Test Commands
- Run all tests:
  ```bash
  pnpm -r test
  ```
- Run backend tests:
  ```bash
  pnpm -C backend test:unit
  ```
- Run frontend tests:
  ```bash
  pnpm -C frontend test
  ```

### Lint Commands
- Lint all code:
  ```bash
  pnpm -r lint
  ```
- Lint backend:
  ```bash
  pnpm -C backend lint
  ```
- Lint frontend:
  ```bash
  pnpm -C frontend lint
  ```

## Environment Variables

The following environment variables are required for local development:

- **DATABASE_URL**: PostgreSQL connection string.
- **AI_PROVIDER**: The AI provider to use (e.g., `openai`).
- **AI_MODEL_DEFAULT**: Default model for AI operations.
- **AI_MODEL_PLANNER**: Model used for planning tasks.
- **AI_MODEL_VALIDATION**: Model used for validation tasks.
- **GITHUB_TOKEN**: Token for GitHub API access.

## Troubleshooting

### Common Issues
- **Database Connection Issues**: Ensure PostgreSQL is running and accessible.
- **API Key Missing**: Check that the AI keys are set up correctly in the environment variables.
- **Rate Limit Errors**: If you encounter rate limit errors, ensure you're not exceeding the usage limits on the API keys.

```
