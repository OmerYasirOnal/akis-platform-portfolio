# AKIS Backend – Authentication & Authorization

> ## Özet (TR)
> Bu belge AKIS Platform'un kimlik doğrulama mimarisini tanımlar. Email/şifre ile çok adımlı kayıt
> (6 haneli doğrulama kodu, 15dk süre, bcrypt), OAuth entegrasyonu (GitHub + Google), JWT oturum
> yönetimi (HTTP-only cookie, 7 gün), yetkilendirme modeli ve güvenlik önlemlerini (rate limiting,
> CORS, şifreleme) kapsar. Tüm teknik detaylar aşağıdaki İngilizce içerikte yer almaktadır.

**Version:** 1.0  
**Last Updated:** 2025-12-06  
**Purpose:** Define the authentication architecture, user lifecycle, and authorization model for AKIS Platform

---

## 1. Overview

AKIS Platform uses a **JWT-based authentication** system with email/password credentials as the primary method. The auth flow is designed to match a **Cursor-style, multi-step onboarding experience** for improved UX and security.

### Key Principles

- **Email/password primary:** All users start with email+password auth
- **Multi-step signup:** Name/email → password → email verification → consent flows
- **OAuth available:** Google/GitHub OAuth is implemented (S0.4.2, PR #90) and available when credentials are configured
- **Stateless sessions:** JWT tokens stored in HTTP-only cookies
- **Zero trust:** Every protected endpoint validates the token

---

## 2. User Account Lifecycle

### 2.1 Account States

```typescript
enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',  // Email not yet verified
  ACTIVE = 'active',                              // Email verified, can use platform
  DISABLED = 'disabled',                          // Admin disabled
  DELETED = 'deleted'                             // Soft deleted
}
```

**State Transitions:**

```
[New Signup]
    ↓
PENDING_VERIFICATION
    ↓ (email verification)
ACTIVE
    ↓ (admin action or self-delete)
DISABLED / DELETED
```

### 2.2 User Data Model

```typescript
interface User {
  id: string;                       // UUID
  email: string;                    // Unique, lowercase
  name: string;                     // Full name
  passwordHash: string;             // bcrypt hash
  status: UserStatus;               // Account state
  emailVerified: boolean;           // Email verification flag
  emailVerificationCode: string | null;   // 6-digit code (expires)
  emailVerificationCodeExpiresAt: Date | null;
  dataSharingConsent: boolean | null;     // null = not yet shown, true/false = user choice
  hasSeenBetaWelcome: boolean;      // Whether user saw beta notice
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Authentication Flow Design

### 3.1 Sign Up (Multi-Step)

**Step 1: Name + Email (`POST /auth/signup/start`)**

- Input: `{ firstName, lastName, email }`
- Backend:
  1. Validate email format and uniqueness
  2. Create user record with `status: PENDING_VERIFICATION`
  3. Generate 6-digit verification code (store with 15min expiry)
  4. Send email with code (dev: log to console)
  5. Return: `{ userId, email, message: "Verification code sent" }`

**Step 2: Set Password (`POST /auth/signup/password`)**

- Input: `{ userId, password }` (min 8 chars)
- Backend:
  1. Validate userId exists and status is `PENDING_VERIFICATION`
  2. Hash password with bcrypt (12 rounds)
  3. Store `passwordHash`
  4. Return: `{ ok: true }`

**Step 3: Verify Email (`POST /auth/verify-email`)**

- Input: `{ userId, code }` (6 digits)
- Backend:
  1. Check code matches and not expired
  2. Update: `emailVerified: true`, `status: ACTIVE`
  3. Generate JWT session token
  4. Set HTTP-only cookie (name from `AUTH_COOKIE_NAME` env var, default: `akis_sid`)
  5. Return: `{ user: sanitized, token }`

**Step 4-5: Beta Welcome & Data Sharing**

- These are **frontend-only** flows initially
- User preferences stored via:
  - `POST /auth/update-preferences`
  - Input: `{ dataSharingConsent, hasSeenBetaWelcome }`

**Future: Email Delivery**

- Current (dev): Codes logged to console
- Production: Integrate with email service (e.g., SendGrid, AWS SES)
- Rate limiting: Max 3 verification attempts per 15min window

---

### 3.2 Sign In (Multi-Step)

**Step 1: Email Check (`POST /auth/login/start`)**

- Input: `{ email }`
- Backend:
  1. Look up user by email (case-insensitive)
  2. If not found: `404 { error: "No account found with this email" }`
  3. If found but `PENDING_VERIFICATION`: `403 { error: "Please verify your email first", userId }`
  4. If found and `ACTIVE`: `200 { userId, email, requiresPassword: true }`

**Step 2: Password (`POST /auth/login/complete`)**

- Input: `{ userId, password }`
- Backend:
  1. Verify password against stored hash
  2. If invalid: `401 { error: "Invalid password" }`
  3. If valid:
     - Generate JWT
     - Set cookie
     - Check if `dataSharingConsent === null`
     - Return: `{ user, needsDataSharingConsent: boolean }`

**Post-Login Flow (Frontend):**

- If `needsDataSharingConsent`: redirect to `/auth/privacy-consent`
- If `!hasSeenBetaWelcome`: redirect to `/auth/welcome-beta`
- Otherwise: redirect to `/dashboard`

---

### 3.3 Sign Out

**Endpoint:** `POST /auth/logout`

- Clears session cookie (set maxAge=0)
- Returns: `{ ok: true }`
- Client redirects to `/login`

---

## 4. JWT Token Structure

### 4.1 Token Payload

```typescript
interface JWTPayload {
  sub: string;       // User ID (UUID)
  email: string;
  name: string;
  iat: number;       // Issued at (Unix timestamp)
  exp: number;       // Expires at (Unix timestamp)
}
```

### 4.2 Token Lifecycle

- **Issuer:** Backend signs with `JWT_SECRET` (env var)
- **Expiry:** 7 days (configurable via `AUTH_COOKIE_MAXAGE`)
- **Storage:** HTTP-only cookie (name from `AUTH_COOKIE_NAME`, default: `akis_sid`)
- **Refresh:** Not implemented yet (future: refresh tokens)

### 4.3 Cookie Options

```typescript
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in ms
};
```

---

## 5. Authorization & Protected Routes

### 5.1 Middleware: `requireAuth`

All dashboard and agent endpoints require authentication:

```typescript
// Pseudocode
async function requireAuth(request, reply) {
  const token = request.cookies?.[env.AUTH_COOKIE_NAME];  // default: 'akis_sid'
  
  if (!token) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  try {
    const payload = await verify(token);
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub)
    });
    
    if (!user || user.status !== 'active') {
      clearCookie(reply);
      return reply.code(401).send({ error: 'Invalid session' });
    }
    
    request.user = sanitizeUser(user);  // Attach to request
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
```

### 5.2 Role-Based Access Control (RBAC)

**Current:** Not implemented (all authenticated users have same permissions)

**Future (S0.5+):**

```typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

// Middleware: requireRole('admin')
```

---

## 6. Security Considerations

### 6.1 Password Security

- **Hashing:** bcrypt with 12 rounds (via `@node-rs/bcrypt`)
- **Minimum length:** 8 characters (enforced at API + UI)
- **No complexity requirements** initially (may add later)

### 6.2 Rate Limiting

**Current (via `@fastify/rate-limit`):**

- Global: 100 requests/min per IP
- Auth endpoints (future): 5 attempts/15min per IP/email

### 6.3 CORS

**Dev:** `http://localhost:5173` (Vite)  
**Prod:** Configured via `CORS_ORIGINS` env var

### 6.4 Cookie Security

- `httpOnly: true` → No JS access (XSS mitigation)
- `secure: true` (prod) → HTTPS only
- `sameSite: 'lax'` → CSRF protection

### 6.5 Token Expiry

- 7-day expiry enforced at JWT level
- Backend validates `exp` claim on every request

---

## 7. OAuth Integration (S0.4.2) — IMPLEMENTED

> **Status:** ✅ Implemented and merged (PR #90)  
> **Implementation:** `backend/src/api/auth.oauth.ts`  
> **QA Evidence:** `docs/archive/qa-notes/QA_NOTES_S0.4.2_OAUTH.md` (historical)

### 7.1 Supported Providers

- ✅ Google OAuth (implemented)
- ✅ GitHub OAuth (implemented)
- (Future: Apple Sign In)

### 7.2 OAuth Configuration

**Environment Variables:**

OAuth credentials are configured via environment variables (see [Section 13.1](#131-environment-variable-mapping-checklist)):
- `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`

**Important:** These are **separate** from GitHub App credentials (`GITHUB_APP_ID`, etc.) which are used for MCP integration.

**Redirect URLs:**

OAuth providers require callback URLs to be configured:
- GitHub: `{BACKEND_URL}/auth/oauth/github/callback`
- Google: `{BACKEND_URL}/auth/oauth/google/callback`

Where `BACKEND_URL` is the value from your environment variables.

### 7.3 OAuth Flow (Implemented)

**Endpoints:**

- `GET /auth/oauth/:provider` → Redirect to provider
- `GET /auth/oauth/:provider/callback` → Handle OAuth callback

**Process:**

1. User clicks "Continue with Google/GitHub"
2. Redirect to provider OAuth consent screen
3. Callback returns authorization code
4. Backend exchanges code for access token
5. Fetch user profile (email, name)
6. If email exists → link account; else → create new user
7. Generate JWT and set cookie
8. Redirect to dashboard (or onboarding gates if needed)

**Implementation Details:**

- OAuth routes are in `backend/src/api/auth.oauth.ts`
- User linking logic: Match by email (lowercase), verified email required for GitHub
- Provider tokens stored in `oauth_accounts` table (migration: `0007_modern_nova.sql`)
- OAuth is **optional** - email/password auth remains canonical
- State token validation for CSRF protection (single-use, in-memory)

---

## 8. Error Handling

### 8.1 Auth Error Codes

| Code | HTTP Status | Message | Action |
|------|-------------|---------|--------|
| `EMAIL_IN_USE` | 409 | Email already registered | Show "Already have an account? Sign in" |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | Generic message (no hint) |
| `EMAIL_NOT_VERIFIED` | 403 | Email not verified | Offer resend verification code |
| `INVALID_CODE` | 400 | Verification code invalid or expired | Allow retry (max 3) |
| `TOO_MANY_ATTEMPTS` | 429 | Too many attempts | Show "Wait 15 minutes" |
| `UNAUTHORIZED` | 401 | Token missing or invalid | Redirect to login |

### 8.2 Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}  // Optional context
}
```

---

## 9. API Endpoints Summary

### 9.1 Implemented (Current)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Single-step signup (legacy) |
| POST | `/auth/login` | Single-step login (legacy) |
| POST | `/auth/logout` | Clear session cookie |
| GET | `/auth/me` | Get current user |

### 9.2 Multi-Step Authentication (Implemented)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/auth/signup/start` | Step 1: Name + email | ✅ |
| POST | `/auth/signup/password` | Step 2: Set password | ✅ |
| POST | `/auth/verify-email` | Step 3: Verify 6-digit code | ✅ |
| POST | `/auth/resend-code` | Resend verification email | ✅ |
| POST | `/auth/login/start` | Step 1: Email check | ✅ |
| POST | `/auth/login/complete` | Step 2: Password | ✅ |
| POST | `/auth/update-preferences` | Update consent flags | ✅ |
| GET | `/auth/oauth/:provider` | OAuth redirect | ✅ |
| GET | `/auth/oauth/:provider/callback` | OAuth callback | ✅ |

---

## 10. Database Schema

### 10.1 `users` Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_verification',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_code VARCHAR(6),
  email_verification_code_expires_at TIMESTAMP,
  data_sharing_consent BOOLEAN,
  has_seen_beta_welcome BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 10.2 `oauth_accounts` Table (Implemented)

> **Migration:** `backend/migrations/0007_modern_nova.sql`

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'google', 'github'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Password hashing/verification
- JWT sign/verify
- Email validation logic

### 11.2 Integration Tests

- Signup flow: start → password → verify
- Login flow: start → complete
- Session validation (valid/expired/missing token)
- Logout clears cookie

### 11.3 E2E Tests (Future)

- Full signup → login → dashboard flow
- OAuth flow (mocked providers)

---

## 12. Migration Path

### Completed Phases

**Phase 1 (PR #90 - S0.4.4):** ✅ DONE

- Multi-step signup/login endpoints
- Email verification (console logging in dev, Resend in prod)
- Legacy `/signup` and `/login` kept for compatibility

**Phase 2 (PR #90 - S0.4.2):** ✅ DONE

- OAuth providers (GitHub, Google) implemented
- OAuth credentials optional (email/password works without them)
- `oauth_accounts` table added

### Future Phases

**Phase 3 (S0.5+):**

- Remove legacy endpoints (when frontend fully migrated)
- Add refresh tokens
- Implement RBAC
- Add 2FA (optional)

---

## 13. Environment Variables

```bash
# Required
AUTH_JWT_SECRET=<random-256-bit-string>  # Min 32 chars, use: openssl rand -base64 32
DATABASE_URL=postgresql://...

# Authentication & Session
AUTH_COOKIE_NAME=akis_sid
AUTH_COOKIE_MAXAGE=604800  # 7 days in seconds
AUTH_COOKIE_SAMESITE=Lax
AUTH_COOKIE_SECURE=false  # Set to true in production with HTTPS
# AUTH_COOKIE_DOMAIN=localhost

# Base URLs (used for OAuth redirects and CORS)
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Email Configuration
EMAIL_PROVIDER=mock  # 'mock' for dev/test, 'resend' for production
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=15

# Resend Email Service (required when EMAIL_PROVIDER=resend)
# Get API key from: https://resend.com/api-keys
# Verify your domain or use Resend's test domain
RESEND_API_KEY=<your_resend_api_key>
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OAuth Configuration (S0.4.2)
# OAuth credentials for user login (separate from GitHub App credentials)
# These are OPTIONAL - email/password auth remains canonical
GITHUB_OAUTH_CLIENT_ID=<your_github_oauth_client_id>
GITHUB_OAUTH_CLIENT_SECRET=<your_github_oauth_client_secret>
GOOGLE_OAUTH_CLIENT_ID=<your_google_oauth_client_id>
GOOGLE_OAUTH_CLIENT_SECRET=<your_google_oauth_client_secret>

# Other
NODE_ENV=development
```

### 13.1 Environment Variable Mapping Checklist

**OAuth vs GitHub App Credentials:**

| Credential Set | Variables | Purpose | Used For |
|----------------|-----------|---------|----------|
| **OAuth Login** | `GITHUB_OAUTH_CLIENT_ID`<br>`GITHUB_OAUTH_CLIENT_SECRET`<br>`GOOGLE_OAUTH_CLIENT_ID`<br>`GOOGLE_OAUTH_CLIENT_SECRET` | User authentication | "Continue with GitHub/Google" login buttons<br>Callback: `{BACKEND_URL}/auth/oauth/{provider}/callback` |
| **GitHub App** | `GITHUB_APP_ID`<br>`GITHUB_INSTALLATION_ID`<br>`GITHUB_APP_PRIVATE_KEY_PEM` | MCP integration | GitHub API access via MCP adapter<br>Repository operations, PR creation, etc. |

⚠️ **Important:** These are **SEPARATE** credential sets with different purposes:
- **OAuth credentials** → User login/authentication
- **GitHub App credentials** → Agent/MCP integration

### 13.2 OAuth Setup Instructions

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Set Authorization callback URL: `{BACKEND_URL}/auth/oauth/github/callback`
4. Copy Client ID and generate Client Secret
5. Set in `.env`: `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`

**Google OAuth:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `{BACKEND_URL}/auth/oauth/google/callback`
4. Copy Client ID and Client Secret
5. Set in `.env`: `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`

### 13.3 Production vs Development Behavior

**Required in Production:**
- `AUTH_JWT_SECRET` (min 32 chars)
- `AUTH_COOKIE_SECURE=true` (HTTPS only)
- `DATABASE_URL`
- `BACKEND_URL` and `FRONTEND_URL` (for OAuth redirects)

**Optional (can be omitted):**
- OAuth credentials (email/password auth works without them)
- GitHub App credentials (unless using MCP integration)
- Atlassian credentials (unless `MCP_ATLASSIAN_ENABLED=true`)

**Validation Rules:**
- If a provider's `CLIENT_ID` is set, the corresponding `CLIENT_SECRET` must also be set (and vice versa)
- OAuth credentials are validated at startup but are not required for the app to run

### Email Provider Setup

**For Development (Mock):**
```bash
EMAIL_PROVIDER=mock
```
Verification codes are logged to console. No external service needed.

**For Production (Resend):**
1. Create account at https://resend.com
2. Navigate to **API Keys** and create a new key
3. Add and verify your domain (or use Resend's test domain for staging)
4. Set environment variables:
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## 14. References

- **API Spec:** `backend/docs/API_SPEC.md` (auth section)
- **Frontend IA:** `docs/WEB_INFORMATION_ARCHITECTURE.md` (auth pages)
- **UI Design:** `docs/UI_DESIGN_SYSTEM.md` (auth form patterns)
- **Architecture:** `.cursor/context/CONTEXT_ARCHITECTURE.md`
- **JWT Standard:** RFC 7519
- **bcrypt:** @node-rs/bcrypt (Rust-based, ARM-compatible)

---

## 15. Developer Guide

### 15.1 Local Development Setup

**Prerequisites:**
- Docker & Docker Compose (for PostgreSQL)
- Node.js 20.x
- pnpm

**Steps:**

1. **Start PostgreSQL via Docker Compose:**
```bash
cd devagents
docker-compose -f docker-compose.dev.yml up -d
```

2. **Set up environment variables:**
```bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL to match Docker Compose config
# Example: DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
```

3. **Run database migrations:**
```bash
pnpm db:migrate
```

4. **Start backend server:**
```bash
pnpm dev
```

### 15.2 Email Verification in Development

**MockEmailService Behavior:**

In development (`EMAIL_PROVIDER=mock`), verification codes are **not sent via email**. Instead, they are logged to the console:

```
[VerificationService] Sending verification code to user@example.com
[MockEmailService] Would send email to user@example.com
[MockEmailService] Subject: Verify your AKIS email
[MockEmailService] Code: 123456
```

**How to test signup flow:**

1. Call `POST /auth/signup/start` with name + email
2. Check console logs for the 6-digit code
3. Copy the code
4. Call `POST /auth/verify-email` with userId + code

**Inspecting Database:**

Use Adminer (included in docker-compose.dev.yml) to inspect tables:

```
http://localhost:8080
System: PostgreSQL
Server: postgres
Username: postgres
Password: postgres
Database: akis_dev
```

Navigate to:
- `users` table → Check `status`, `email_verified`, `data_sharing_consent`, etc.
- `email_verification_tokens` table → Check `code`, `expires_at`, `used_at`

### 15.3 Testing Auth Flows with curl

**Example: Complete Signup Flow**

```bash
# Step 1: Start signup
curl -X POST http://localhost:3000/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'
# Response: {"userId":"<uuid>","email":"john@example.com",...}
# Check console for 6-digit code

# Step 2: Set password
curl -X POST http://localhost:3000/auth/signup/password \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","password":"password123"}'
# Response: {"ok":true}

# Step 3: Verify email
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","code":"123456"}' \
  -c cookies.txt
# Response: {"user":{...},"message":"Email verified successfully"}
# Cookie akis_session is set

# Step 4: Update preferences
curl -X POST http://localhost:3000/auth/update-preferences \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"dataSharingConsent":true,"hasSeenBetaWelcome":true}'
# Response: {"ok":true}
```

**Example: Complete Login Flow**

```bash
# Step 1: Email check
curl -X POST http://localhost:3000/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
# Response: {"userId":"<uuid>","email":"john@example.com","requiresPassword":true}

# Step 2: Password verification
curl -X POST http://localhost:3000/auth/login/complete \
  -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","password":"password123"}' \
  -c cookies.txt
# Response: {"user":{...},"needsDataSharingConsent":false}
# Cookie akis_session is set
```

### 15.4 Common Errors and Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `409 EMAIL_IN_USE` | Email already registered | Use different email or test login flow |
| `400 INVALID_CODE` | Wrong code or expired | Check console logs for correct code; codes expire after 15 min |
| `429 RATE_LIMITED` | Too many verification attempts | Wait 15 minutes or reset `email_verification_tokens` table |
| `404 USER_NOT_FOUND` | userId doesn't exist | Check userId from signup/start response |
| `401 INVALID_CREDENTIALS` | Wrong password | Verify password matches what was set in signup/password step |
| Database connection error | PostgreSQL not running | Check `docker ps` and restart container if needed |

**Reset verification tokens (for testing):**
```sql
-- Connect to DB via Adminer or psql
DELETE FROM email_verification_tokens WHERE user_id = '<uuid>';
```

### 15.5 Extensibility and Future Work

**Switching from Mock to Real Email Provider:**

1. Sign up for Resend (https://resend.com)
2. Get API key and verify domain
3. Update `.env`:
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```
4. Restart backend → emails will be sent via Resend

**Adding OAuth Providers:**

1. Create adapter class in `backend/src/services/auth/oauth/`:
```typescript
// GoogleOAuthAdapter.ts
export class GoogleOAuthAdapter implements IOAuthAdapter {
  async initiateFlow(redirectUri: string): Promise<string> { /* ... */ }
  async handleCallback(code: string): Promise<OAuthUserProfile> { /* ... */ }
}
```

2. Register routes in `auth.ts`:
```typescript
fastify.get('/oauth/google', async (request, reply) => {
  const adapter = new GoogleOAuthAdapter(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  const authUrl = await adapter.initiateFlow(env.FRONTEND_URL + '/auth/callback');
  reply.redirect(authUrl);
});
```

3. Add environment variables:
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Adding New User Preference Fields:**

1. Update `users` table schema in `backend/src/db/schema.ts`:
```typescript
export const users = pgTable('users', {
  // ... existing fields
  newPreference: boolean('new_preference').default(false),
});
```

2. Generate migration:
```bash
pnpm db:generate
```

3. Run migration:
```bash
pnpm db:migrate
```

4. Update `/auth/update-preferences` endpoint to accept new field

---

**Status:** This document describes the **implemented state** for S0.4.2 + S0.4.4 (as of PR #90). OAuth integration is implemented and available when credentials are configured. Cookie name default is `akis_sid` (configurable via `AUTH_COOKIE_NAME`).

