```markdown
# AKIS Platform API Documentation

## Overview

The AKIS Platform provides a set of APIs to facilitate the orchestration of autonomous AI agents for software development tasks such as documentation generation, test planning, and prototyping. This document outlines the available API endpoints, their respective request and response formats, and usage examples.

## API Endpoints

### Health & Meta Endpoints

#### GET /health

**Description**: Health check endpoint to verify if the server is running.

**Response**:
```json
{
  "status": "ok"
}
```

#### GET /ready

**Description**: Readiness check to verify database connectivity.

**Response (200)**:
```json
{
  "ready": true
}
```

**Response (503)**:
```json
{
  "ready": false,
  "error": "Database not reachable"
}
```

#### GET /version

**Description**: Returns the application version from `package.json`.

**Response**:
```json
{
  "version": "0.1.0"
}
```

### Agent Jobs API

#### POST /api/agents/jobs

**Description**: Submit a new agent job.

**Request Body**:
```json
{
  "type": "scribe" | "trace" | "proto",
  "payload": { ... },
  "runtimeOverride": {
    "runtimeProfile": "deterministic" | "balanced" | "creative" | "custom",
    "temperatureValue": 0.0-1.0,
    "commandLevel": 1 | 2 | 3 | 4 | 5
  },
  "requiresStrictValidation": false
}
```

**Response (200)**:
```json
{
  "jobId": "uuid-string",
  "state": "pending" | "running" | "completed" | "failed"
}
```

**Response (400)** - Invalid payload:
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

**Response (412)** - Missing AI key for Scribe:
```json
{
  "error": {
    "code": "AI_KEY_MISSING",
    "message": "AI API key is not configured for provider openai. Please add a key in Settings."
  }
}
```

**Response (400)** - Model not allowlisted:
```json
{
  "error": {
    "code": "MODEL_NOT_ALLOWED",
    "message": "Model \"gpt-xyz\" is not allowed.",
    "details": { "allowlist": ["gpt-4o-mini", "gpt-4o"] }
  }
}
```

#### GET /api/agents/jobs/:id

**Description**: Get job status and result.

**Parameters**:
- `id` (path) - Job UUID

**Response (200)**:
```json
{
  "id": "uuid-string",
  "type": "scribe",
  "state": "completed",
  "effectiveRuntime": {
    "runtimeProfile": "deterministic",
    "temperatureValue": null,
    "commandLevel": 2,
    "allowCommandExecution": false,
    "settingsVersion": 1
  },
  "payload": { ... },
  "result": { ... },
  "error": null,
  "errorCode": null,
  "errorMessage": null,
  "aiProvider": "openai",
  "aiModel": "gpt-4o-mini",
  "aiTotalDurationMs": 12345,
  "aiInputTokens": 1200,
  "aiOutputTokens": 850,
  "aiTotalTokens": 2050,
  "aiEstimatedCostUsd": "0.001234",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:01.000Z"
}
```

**Response (404)**:
```json
{
  "error": "Job not found"
}
```

#### POST /api/agents/jobs/:id/cancel

**Description**: Cancel a running or pending job.

**Parameters**:
- `id` (path) - Job UUID

**Response (200)**:
```json
{
  "id": "uuid-string",
  "state": "failed",
  "message": "Job cancelled successfully"
}
```

**Response (409)** - Cannot cancel (invalid state):
```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot cancel job in completed state",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/agents/jobs/:id/cancel"
  }
}
```

**Response (404)**:
```json
{
  "error": "Job not found"
}
```

### Agent Configs API

#### GET /api/agents/configs/:agentType

**Description**: Fetch the authenticated user's agent configuration and integration status.

**Response (200)**:
```json
{
  "config": { ... },
  "integrationStatus": {
    "github": { "connected": true },
    "confluence": { "connected": false }
  }
}
```

#### POST /api/agents/configs/:agentType

**Description**: Upsert configuration (per-user).

**Response (200)**:
```json
{
  "config": { ... },
  "message": "Configuration saved successfully"
}
```

#### GET /api/agents/configs/:agentType/models

**Description**: Return allowlisted models for the agent (Scribe only).

**Response (200)**:
```json
{
  "allowlist": ["gpt-4o-mini", "gpt-4o"],
  "defaultModel": "gpt-4o-mini"
}
```

## Examples

### Submitting a Job

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
-H "Content-Type: application/json" \
-d '{
  "type": "scribe",
  "payload": {
    "owner": "organization-name",
    "repo": "repository-name",
    "baseBranch": "main"
  }
}'
```

### Getting Job Status

```bash
curl -X GET http://localhost:3000/api/agents/jobs/{jobId}
```

## Authentication

AKIS uses JWT-based authentication, and all requests to protected endpoints require a valid JWT token in the HTTP-only cookie.

## Security

- User AI keys are encrypted at rest (AES-256-GCM).
- JWT sessions use HTTP-only, Secure, SameSite cookies.
- All API endpoints are rate-limited.
- Sensitive data is redacted from SSE streams.

---

For further details, please refer to the [README.en.md](README.en.md) and [API_SPEC.md](API_SPEC.md).
```
