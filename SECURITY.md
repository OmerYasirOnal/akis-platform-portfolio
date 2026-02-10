# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

**Email:** omeryasironal@gmail.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Do NOT** open a public GitHub issue for security vulnerabilities.

## Scope

This security policy applies to the AKIS Platform source code in this repository.
The staging environment ([staging.akisflow.com](https://staging.akisflow.com)) is a
demo instance and should not be used for production workloads.

## Security Measures

- User AI keys are encrypted at rest (AES-256-GCM)
- JWT sessions use HTTP-only, Secure, SameSite cookies
- All API endpoints are rate-limited
- Sensitive data is redacted from SSE streams
- OAuth tokens are never exposed to the frontend
