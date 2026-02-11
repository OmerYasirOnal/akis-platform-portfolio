# AKIS Platform - Web Sitesi Bilgi Mimarisi ve İçerik Yapısı

**Doküman Versiyonu:** v1.1  
**Hazırlanma Tarihi:** Kasım 2025  
**Amaç:** AKIS Platform web sitesinin kapsamlı bilgi mimarisi, sayfa yapıları ve kullanıcı akışları
**Güncelleme Notu (Phase 9.1):** Solid dark hero, ak-surface-2 kart desenleri ve /login + /signup karanlık temalarıyla güncellendi.

---

## 1. Genel Strateji ve Hedef Kitle

### 1.1 Hedef Kullanıcı Segmentleri

#### **Birincil Hedef: Teknik Liderler**
- **Profil:** Tech Leads, Engineering Managers, DevOps Team Leads
- **İhtiyaçlar:** Ekip verimliliğini artırma, tekrarlayan işleri otomatikleştirme
- **Karar Kriterleri:** ROI (zaman tasarrufu), entegrasyon kolaylığı, güvenlik
- **Satın Alma Gücü:** Takım bütçesi üzerinde karar yetkisi (5-20 kişi)

#### **İkincil Hedef: C-Level Yöneticiler**
- **Profil:** CTO, VP of Engineering, Head of Product
- **İhtiyaçlar:** Şirket çapında verimlilik, maliyet optimizasyonu
- **Karar Kriterleri:** Ölçeklenebilirlik, kurumsal özellikler, vendor güvenilirliği
- **Satın Alma Gücü:** Kurumsal anlaşmalar (20+ kişi)

#### **Üçüncül Hedef: Bireysel Geliştiriciler**
- **Profil:** Solo developers, freelancers, open-source maintainers
- **İhtiyaçlar:** Kişisel projelerinde zaman kazanma, ücretsiz araçlar
- **Karar Kriterleri:** Ücretsiz tier, kullanım kolaylığı, dokümantasyon kalitesi
- **Satın Alma Gücü:** Sınırlı veya yok (freemium model hedef)

### 1.2 Ana Mesaj Hiyerarşisi

**1. Seviye: Value Proposition (Hero)**
```
"Ekibinize zamanını geri verin"
"Software development's new center"
```

**2. Seviye: Problem-Solution Fit**
```
Dokümantasyon güncel değil → AKIS Scribe otomatik günceller
Test yazmak çok uzun sürüyor → AKIS Trace Jira'dan test üretir
MVP yapmak haftalar alıyor → AKIS Proto saatlerde prototip çıkarır
```

**3. Seviye: Diferansiyatörler**
```
✓ Mevcut iş akışınıza entegre (GitHub/Jira/Confluence)
✓ Şeffaf ve kontrol edilebilir (playbook-driven)
✓ Developer-friendly (Git-native, open architecture)
```

### 1.3 Marka Tonality ve Ses

- **Ton:** Profesyonel ama samimi, teknik ama anlaşılır
- **Ses:** "We help you..." değil, "Build faster, worry less."
- **Yaklaşım:** Empati-driven (ağrı noktalarını anladığımızı göster)
- **Kelime Seçimleri:**
  - ✅ Kullan: autonomous, workflow, integrate, transparent, control
  - ❌ Kullanma: revolutionary, game-changer, disrupting (abartılı pazarlama)

---

## 2. Site Mimarisi (Sitemap)

### 2.1 Genel Yapı

```
AKIS Platform (Public + Private Areas)
│
├── [PUBLIC MARKETING SITE] ──────────────────────────────────┐
│   │                                                          │
│   ├── / (Landing/Homepage)                                  │
│   │                                                          │
│   ├── /platform (Platform Overview)                         │
│   │                                                          │
│   ├── /agents                                               │
│   │   ├── /scribe (AKIS Scribe Detail)                     │
│   │   ├── /trace (AKIS Trace Detail)                       │
│   │   └── /proto (AKIS Proto Detail)                       │
│   │                                                          │
│   ├── /integrations                                         │
│   │   ├── Overview (all integrations)                       │
│   │   ├── /github                                           │
│   │   ├── /atlassian (Jira + Confluence via single OAuth)  │
│   │      └── Note: Single OAuth enables both Jira/Confluence │
│   │                                                          │
│   │                                                          │
│   ├── /solutions                                            │
│   │   ├── /by-role                                          │
│   │   │   ├── for-engineering-managers                      │
│   │   │   ├── for-qa-teams                                  │
│   │   │   └── for-product-teams                             │
│   │   └── /by-use-case                                      │
│   │       ├── documentation-automation                      │
│   │       ├── test-automation                               │
│   │       └── rapid-prototyping                             │
│   │                                                          │
│   ├── /pricing                                              │
│   │                                                          │
│   ├── /docs                                                 │
│   │   ├── /getting-started                                  │
│   │   │   ├── quickstart                                    │
│   │   │   ├── installation                                  │
│   │   │   └── first-agent-run                               │
│   │   ├── /agents                                           │
│   │   │   ├── scribe-guide                                  │
│   │   │   ├── trace-guide                                   │
│   │   │   └── proto-guide                                   │
│   │   ├── /configuration                                    │
│   │   │   ├── playbooks                                     │
│   │   │   ├── contracts                                     │
│   │   │   └── environment-variables                         │
│   │   ├── /integrations                                     │
│   │   │   ├── github-setup                                  │
│   │   │   ├── jira-setup                                    │
│   │   │   └── confluence-setup                              │
│   │   ├── /api-reference                                    │
│   │   │   ├── rest-api                                      │
│   │   │   ├── webhooks                                      │
│   │   │   └── cli-tool                                      │
│   │   ├── /architecture                                     │
│   │   │   ├── how-akis-works                                │
│   │   │   ├── security-model                                │
│   │   │   └── data-privacy                                  │
│   │   └── /troubleshooting                                  │
│   │                                                          │
│   ├── /blog (future)                                        │
│   ├── /changelog                                            │
│   ├── /status (status.akis.dev - uptime)                   │
│   │                                                          │
│   ├── /about                                                │
│   │   ├── team                                              │
│   │   ├── careers                                           │
│   │   └── press-kit                                         │
│   │                                                          │
│   ├── /contact                                              │
│   │   ├── request-demo                                      │
│   │   ├── sales-inquiry                                     │
│   │   └── support                                           │
│   │                                                          │
│   ├── /legal                                                │
│   │   ├── terms-of-service                                  │
│   │   ├── privacy-policy                                    │
│   │   └── security                                          │
│   │                                                          │
│   ├── /login (multi-step auth)                              │
│   │   ├── /login/password (Step 2: password entry)         │
│   ├── /signup (multi-step auth)                            │
│   │   ├── /signup/password (Step 2: set password)          │
│   │   ├── /signup/verify-email (Step 3: 6-digit code)      │
│   ├── /auth/welcome-beta (Beta tier notice)                │
│   └── /auth/privacy-consent (Data sharing consent)         │
│                                                              │
└── [AUTHENTICATED DASHBOARD] ────────────────────────────────┘
    │
    ├── /dashboard (Overview)
    │
    ├── /dashboard/jobs
    │   ├── /dashboard/jobs/:id (Job Detail)
    │   └── /dashboard/jobs/new (Create Job)
    │
    ├── /dashboard/agents
    │   ├── /dashboard/agents/scribe
    │   ├── /dashboard/agents/trace
    │   └── /dashboard/agents/proto
    │
    ├── /dashboard/integrations
    │
    ├── /agents/smart-automations (Smart Automations)
    │   └── /agents/smart-automations/:id (Automation Detail)
    │
    ├── /dashboard/analytics
    │
    └── /dashboard/settings
        ├── profile
        ├── workspace
        ├── api-keys
        ├── billing (future)
        └── notifications
```

---

## 3. Detaylı Sayfa İçerikleri

### 3.0 Authentication Pages (Multi-Step Flows)

AKIS Platform, **Cursor-style multi-step authentication** kullanır: Her adım tek bir karar/eylem içerir, kullanıcı yükünü azaltır ve hata yönetimini iyileştirir.

> **Teknik Referanslar:**
> - Backend implementasyon detayları: `backend/docs/Auth.md`
> - Mimari ve veri modeli: `.cursor/context/CONTEXT_ARCHITECTURE.md` (Section 7)
> - API endpoint dokümantasyonu: `backend/docs/API_SPEC.md` (Auth API bölümü)

#### **A. Sign In Flow (2 Steps)**

**Route:** `/login`

**Step 1: Email Entry**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Small]                                         │
│                                                               │
│  Welcome back                                                │
│  Sign in to continue to AKIS                                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Continue with Google              [Google Icon]        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Continue with GitHub              [GitHub Icon]        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ─────────────── or ───────────────                          │
│                                                               │
│  Email address                                               │
│  [_______________________________________________]            │
│                                                               │
│  [Continue →]                                                │
│                                                               │
│  Don't have an account? [Sign up]                           │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Social buttons: Görünür ama disabled (toast: "OAuth coming soon, use email for now")
- Email validation: Format check (frontend + backend)
- On submit → `POST /auth/login/start { email }`
  - User exists → Navigate to Step 2
  - User not found → Error: "No account with this email. [Sign up?]"

**Route:** `/login/password`

**Step 2: Password Entry**

```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]                           [AKIS Logo - Small]      │
│                                                               │
│  Enter your password                                         │
│  Signing in as user@example.com                              │
│                                                               │
│  Password                                                    │
│  [_______________________________________________] [SHOW]     │
│                                                               │
│  [Forgot password?]                                          │
│                                                               │
│  [Sign in →]                                                 │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Email shown (non-editable, from Step 1 state)
- Password toggle: "SHOW"/"HIDE" button
- On submit → `POST /auth/login/complete { userId, password }`
  - Success:
    - If `dataSharingConsent === null` → `/auth/privacy-consent`
    - Else → `/dashboard`
  - Failure: "Incorrect password"

**"Forgot password?" link:**
- Goes to `/auth/reset-password` (placeholder for now, shows "Password reset not yet implemented")

---

#### **B. Sign Up Flow (5 Steps)**

**Route:** `/signup`

**Step 1: Name + Email**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Small]                                         │
│                                                               │
│  Create your account                                         │
│  Start building with AKIS agents                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Continue with Google              [Google Icon]        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Continue with GitHub              [GitHub Icon]        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ─────────────── or ───────────────                          │
│                                                               │
│  First name                                                  │
│  [_______________________________________________]            │
│                                                               │
│  Last name                                                   │
│  [_______________________________________________]            │
│                                                               │
│  Email address                                               │
│  [_______________________________________________]            │
│                                                               │
│  [Continue →]                                                │
│                                                               │
│  Already have an account? [Sign in]                         │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Social buttons: disabled (same toast as login)
- On submit → `POST /auth/signup/start { firstName, lastName, email }`
  - Success: Store userId in state, navigate to Step 2
  - Email in use: "This email is already registered. [Sign in?]"

**Route:** `/signup/password`

**Step 2: Create Password**

```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]                           [AKIS Logo - Small]      │
│                                                               │
│  Create a password                                           │
│  For user@example.com                                        │
│                                                               │
│  Password (min. 8 characters)                                │
│  [_______________________________________________] [SHOW]     │
│                                                               │
│  Confirm password                                            │
│  [_______________________________________________] [SHOW]     │
│                                                               │
│  [Continue →]                                                │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Client-side validation: Min 8 chars, passwords match
- On submit → `POST /auth/signup/password { userId, password }`
  - Success: Generate & send verification code, navigate to Step 3
  - Failure: Show error

**Route:** `/signup/verify-email`

**Step 3: Email Verification (6-digit Code)**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Small]                                         │
│                                                               │
│  Verify your email                                           │
│  We sent a 6-digit code to user@example.com                  │
│                                                               │
│  Verification code                                           │
│  [___] [___] [___] [___] [___] [___]                         │
│  (6 separate inputs or single input with pattern)            │
│                                                               │
│  Didn't receive it? [Resend code]                            │
│                                                               │
│  [Verify →]                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Auto-focus first digit input
- Auto-advance to next input on digit entry
- On submit → `POST /auth/verify-email { userId, code }`
  - Success: Mark user as `ACTIVE`, issue JWT, navigate to Step 4
  - Invalid code: "Code is incorrect or expired. Try again."
- "Resend code" → `POST /auth/resend-code { userId }`
  - Max 3 attempts per 15min

**Route:** `/auth/welcome-beta`

**Step 4: Beta Welcome Notice**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Large]                                         │
│                                                               │
│  🎉 Welcome to AKIS!                                         │
│                                                               │
│  You're in early access                                      │
│                                                               │
│  AKIS is currently in beta. You have free access to all     │
│  agents (Scribe, Trace, Proto) with some usage limits:      │
│                                                               │
│  • 100 jobs per month                                        │
│  • Community support (Discord)                               │
│  • 7-day log retention                                       │
│                                                               │
│  Paid plans with unlimited jobs and priority support will   │
│  launch in Q2 2026. Early users get lifetime discounts!     │
│                                                               │
│  [Continue to AKIS Dashboard →]                              │
│                                                               │
│  [Learn more about pricing]                                  │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- On "Continue" → Update `hasSeenBetaWelcome: true`, navigate to Step 5
- On "Learn more" → Open `/pricing` in new tab, stay on this screen

**Route:** `/auth/privacy-consent`

**Step 5: Data Sharing Consent**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Small]                                         │
│                                                               │
│  Help improve AKIS                                           │
│                                                               │
│  AKIS may collect anonymized usage data to improve the      │
│  platform. This includes:                                    │
│                                                               │
│  ✓ Agent job types and success rates                        │
│  ✓ Feature usage (which pages you visit)                    │
│  ✓ Error logs (anonymized stack traces)                     │
│                                                               │
│  We never collect:                                           │
│  ✗ Your code or repository contents                         │
│  ✗ Jira/Confluence data                                      │
│  ✗ Integration tokens or credentials                        │
│                                                               │
│  ☐ I'm okay with AKIS using my anonymized usage data to     │
│     improve the product. I can change this anytime in        │
│     Settings → Privacy.                                      │
│                                                               │
│  [Continue to Dashboard →]                                   │
│                                                               │
│  [Learn more about privacy]                                  │
└──────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Checkbox optional (can continue without checking)
- On "Continue" → `POST /auth/update-preferences { dataSharingConsent: <true/false> }`
- Then navigate to `/dashboard`
- "Learn more" → Link to `/legal/privacy-policy`

---

#### **C. Post-Auth Routes (Standalone)**

**Route:** `/auth/reset-password`

- **Status:** Planned (not implemented yet)
- **Flow:** Email → Code → New Password
- **For now:** Shows placeholder: "Password reset coming soon. Contact support."

**Route:** `/logout` (or handled in header)

- Calls `POST /auth/logout`
- Clears cookie, redirects to `/login`

---

### 3.1 Landing Page (Homepage) - "/"

**Amaç:** İlk 3 saniyede dikkat çekmek, 30 saniyede değer önerisini iletmek, 2 dakikada güven inşa edip signup'a yönlendirmek.

#### **A. Hero Section** (Above the Fold)

**Boyut:** Viewport'un 100% yüksekliği (min: 600px, max: 800px)

**İçerik Bileşenleri:**

```
┌──────────────────────────────────────────────────────────────┐
│  [Header: Sticky Navigation]                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                      [AKIS LOGO]                             │
│        (Responsive height: clamp(72px → 112px) desktopte 112px) │
│                                                               │
│          Software Development's New Center                    │
│         (H1, 56px font, 700 weight, primary text)            │
│                                                               │
│     Autonomous AI agents that document, test, and build—     │
│          so your team can focus on what truly matters.       │
│     (Subtitle, 20px font, secondary text, max-width: 42rem)  │
│                                                               │
│   [Primary CTA: "Get Early Access →" (/signup)]  [Secondary: "Already with AKIS?" (/login)] │
│                                                               │
│   Trusted by development teams at                            │
│   [4-6 logo placeholders - muted grayscale]                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Arka Plan Detayları:**
- Base color: `#0A1215` (solid, full-bleed)
- Hero/body `bg-ak-bg`, root `<div id="root">` ve `<body>` `min-h-screen`
- No gradients veya blend modları (Phase 9.1 karanlık tutarlılık)

**CTA Butonları:**
- **Primary:** `Button` komponenti `variant="primary"` (`bg-ak-primary`, `text-ak-bg`, `focus-visible:outline-ak-primary`)
- **Secondary:** `Button` komponenti `variant="outline"` (`border-ak-border`, `text-ak-text-primary`, hover'da `text-ak-primary`)
- Aralarında `gap-3` (mobile dikey stack, desktop yatay); rotalar `/signup` ve `/login`

**Trust Signals (Logo Wall):**
- 4-6 logo, grayscale filter, `opacity-50`
- Hover: color + `opacity-100`
- Placeholder names: "TechCorp", "DevTeam Inc", "BuildFast", "CodeLabs"

---

#### **B. Social Proof Band**

**Boyut:** 120px yükseklik, full-width

```
┌──────────────────────────────────────────────────────────────┐
│  "Join 500+ teams saving 20+ hours/week on repetitive tasks" │
│                                                               │
│    [GitHub Icon] [Jira Icon] [Confluence Icon]               │
│         "Integrates with your existing tools"                │
└──────────────────────────────────────────────────────────────┘
```

**Stilizasyon:**
- Background: `ak-surface` (slightly elevated from base)
- Text: `text-sm`, `ak-text-secondary`, center-aligned
- Icons: 24px height, muted colors

---

#### **C. Problem Statement** (Empathy Section)

**Başlık:** "Why Dev Teams Lose 40% of Their Week"

**Layout:** 3-column grid (desktop), stack (mobile)

**Kart 1: Outdated Documentation**
```
[Icon: 📄 veya Document SVG]
Başlık: "Outdated Documentation"
İçerik:
Engineers spend hours syncing docs that nobody reads.
Knowledge gaps slow onboarding. Tribal knowledge compounds.

Stat: "73% of developers say docs are always out of date"
```

**Kart 2: Manual Test Creation**
```
[Icon: 🧪 veya Test Tube SVG]
Başlık: "Manual Testing Bottleneck"
İçerik:
QA teams waste days converting tickets to test scripts.
Coverage drops. Bugs slip through. Releases delay.

Stat: "Test automation costs 5-10x more than manual planning"
```

**Kart 3: Slow Prototyping**
```
[Icon: 🚀 veya Rocket SVG]
Başlık: "Slow MVP Creation"
İçerik:
MVPs take weeks. Ideas die waiting. Competitive edge fades.
First-mover advantage lost to faster competitors.

Stat: "Average time-to-prototype: 2-4 weeks"
```

**Card Styling:**
- Background: `ak-surface-2`
- Border: 1px `ak-border`
- Border-radius: `1.5rem`
- Padding: `2rem`
- Hover: `translateY(-4px)`, shadow increase

---

#### **D. Solution Overview**

**Başlık:** "Meet Your New Team: AKIS Agents"

**Alt Başlık:** "Autonomous specialists that handle the work you hate—while you ship what customers love."

**Layout:** 3-column grid, card-based

**Agent Kartları (Özet Versiyon):**

```
┌─────────────────────────────────────────────────────────────┐
│                      AKIS Scribe                            │
│                   [Agent Icon/Illustration]                  │
│                                                              │
│              Documentation from your commits                 │
│                                                              │
│  Automatically updates Confluence, wikis, and specs          │
│  whenever code changes. Always in sync.                      │
│                                                              │
│               [Learn More About Scribe →]                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AKIS Trace                             │
│                   [Agent Icon/Illustration]                  │
│                                                              │
│              Test cases from your Jira tickets               │
│                                                              │
│  Extracts acceptance criteria and generates Cucumber         │
│  scenarios. Coverage analysis included.                      │
│                                                              │
│               [Learn More About Trace →]                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AKIS Proto                             │
│                   [Agent Icon/Illustration]                  │
│                                                              │
│              Working MVPs from your requirements             │
│                                                              │
│  Analyzes specs, designs architecture, scaffolds code,       │
│  and generates tests. Ship prototypes in hours.              │
│                                                              │
│               [Learn More About Proto →]                     │
└─────────────────────────────────────────────────────────────┘
```

**Interaktivite:**
- Hover: Card lifts, shadow expands
- Click: Navigate to agent detail page

---

#### **E. Agents Deep Dive** (On-Page Sections)

Her agent için detaylı bölüm (anchor: `#scribe`, `#trace`, `#proto`)

**AKIS Scribe Deep Dive (#scribe):**

```
┌──────────────────────────────────────────────────────────────┐
│                 [AKIS Scribe Icon + Name]                    │
│           Your Always-On Documentation Engineer              │
│                                                               │
│  "Commits become docs. Automatically."                       │
│                                                               │
│  ┌─────────────────────┐  ┌───────────────────────────┐     │
│  │  How It Works:      │  │  Real Use Cases:          │     │
│  │                     │  │                           │     │
│  │  ✓ Monitors PRs     │  │  → New API endpoint?      │     │
│  │  ✓ Analyzes diffs   │  │    OpenAPI spec updated   │     │
│  │  ✓ Updates Confluence│ │  → Feature shipped?       │     │
│  │  ✓ Generates changelogs│ Release notes drafted  │     │
│  │  ✓ Preserves manual │  │  → README outdated?       │     │
│  │    edits (smart merge)│  │    Wiki synced          │     │
│  └─────────────────────┘  └───────────────────────────┘     │
│                                                               │
│  "Scribe saved our team 15 hours/week. Docs are finally      │
│   trustworthy again." — Sarah Chen, Engineering Manager      │
│                                                               │
│              [Try Scribe Free →]  [View Docs]                │
└──────────────────────────────────────────────────────────────┘
```

**AKIS Trace Deep Dive (#trace):**

```
┌──────────────────────────────────────────────────────────────┐
│                 [AKIS Trace Icon + Name]                     │
│           Your Test Automation Specialist                    │
│                                                               │
│  "Jira tickets become test cases. Instantly."                │
│                                                               │
│  ┌─────────────────────┐  ┌───────────────────────────┐     │
│  │  What It Does:      │  │  Practical Scenarios:     │     │
│  │                     │  │                           │     │
│  │  ✓ Reads Jira tickets│ │  → Sprint planning done?  │     │
│  │  ✓ Extracts criteria│  │    Test scaffold ready    │     │
│  │  ✓ Generates Cucumber│ │  → Coverage gaps?        │     │
│  │  ✓ Identifies flaky │  │    Trace highlights them  │     │
│  │    test areas       │  │  → New user story?        │     │
│  │  ✓ Coverage analysis│  │    Test suite updated     │     │
│  └─────────────────────┘  └───────────────────────────┘     │
│                                                               │
│  "Test coverage doubled in 2 sprints. QA team actually       │
│   enjoys their job now." — Marcus Liu, QA Lead               │
│                                                               │
│              [Try Trace Free →]  [View Docs]                 │
└──────────────────────────────────────────────────────────────┘
```

**AKIS Proto Deep Dive (#proto):**

```
┌──────────────────────────────────────────────────────────────┐
│                 [AKIS Proto Icon + Name]                     │
│           Your Rapid Prototyping Partner                     │
│                                                               │
│  "Ideas become working MVPs. In hours, not weeks."           │
│                                                               │
│  ┌─────────────────────┐  ┌───────────────────────────┐     │
│  │  The Proto Process: │  │  Real-World Wins:         │     │
│  │                     │  │                           │     │
│  │  ✓ Analyzes requirements│ → Pitch tomorrow?      │     │
│  │  ✓ Designs architecture│  │    Demo ready tonight   │     │
│  │  ✓ Scaffolds full-stack│ │  → Test market fit?     │     │
│  │  ✓ Generates tests  │  │    Validate idea fast     │     │
│  │  ✓ Deployment config│  │  → Hackathon starter?     │     │
│  │    included         │  │    30-minute boilerplate  │     │
│  └─────────────────────┘  └───────────────────────────┘     │
│                                                               │
│  "Proto turned a napkin sketch into a working prototype      │
│   in 4 hours. Investors were blown away." — Alex Rivera, CTO │
│                                                               │
│              [Try Proto Free →]  [View Docs]                 │
└──────────────────────────────────────────────────────────────┘
```

---

#### **F. How It Works** (3-Step Process)

**Başlık:** "Three Steps to Autonomous Workflow"

```
Step 1: Connect           Step 2: Configure         Step 3: Deploy
[GitHub Icon]             [Settings Gear]           [Rocket Icon]

Link your tools           Choose your agents        Sit back & save time
2-minute OAuth setup      Set guardrails            Jobs run autonomously

                  [Visual: Timeline connector line]
```

**Layout:**
- Horizontal stepper (desktop), vertical (mobile)
- Numbers in circles: `1`, `2`, `3` (primary color)
- Icons above, text below
- Connector line animates on scroll (optional)

---

#### **G. Technical Trust Section**

**Başlık:** "Built for Engineers, By Engineers"

**Content Grid (2 columns):**

```
Left Column:
✓ Open Architecture
  Transparent agent playbooks, no black boxes.

✓ Git-Native Workflows
  Works how you already work. No new tools to learn.

✓ Zero Lock-In
  Export all data anytime. Open API standards.

Right Column:
✓ Transparent Logs
  Full audit trail for every agent action.

✓ Playbook-Driven
  Customize behavior with simple YAML configs.

✓ Self-Hostable (future)
  Keep your code on your infrastructure.

[CTA: Read Architecture Docs →]
```

**Styling:**
- Background: `ak-surface`, subtle left border accent (4px primary)
- Checkmarks: Primary color, bold
- Micro-copy: Secondary text, 14px

---

#### **H. Pricing Teaser**

**Başlık:** "Early Access: Free Forever"

```
We're in beta. Sign up now for lifetime free access to core features.
No credit card. No commitments. Cancel anytime.

[Primary CTA: Get Early Access →]  [Secondary: See Roadmap]
```

**Background:** `ak-surface` band, `border-y ak-border` (gradient kaldırıldı)

---

#### **I. Final CTA Section**

**Başlık:** "Stop Losing Time to Busywork. Start Building."

```
[Extra Large CTA Button]
      Create Free Account →

Already have an account? [Sign in]
```

**Styling:**
- Full-width section, centered content
- CTA button: `text-lg`, `px-12`, `py-4`
- High contrast background

---

#### **J. Footer**

```
┌──────────────────────────────────────────────────────────────┐
│  [AKIS Logo - Small]                                         │
│                                                               │
│  ┌────────────┬────────────┬────────────┬────────────┐      │
│  │ Product    │ Resources  │ Company    │ Legal      │      │
│  ├────────────┼────────────┼────────────┼────────────┤      │
│  │ Platform   │ Docs       │ About      │ Terms      │      │
│  │ Scribe     │ Blog       │ Team       │ Privacy    │      │
│  │ Trace      │ Changelog  │ Careers    │ Security   │      │
│  │ Proto      │ API Ref    │ Contact    │            │      │
│  │ Integrations│ Status    │ Press Kit  │            │      │
│  │ Pricing    │            │            │            │      │
│  └────────────┴────────────┴────────────┴────────────┘      │
│                                                               │
│  © 2025 AKIS Platform. Built with ❤️ for developers.        │
│                                                               │
│  [GitHub Icon] [Twitter/X Icon] [LinkedIn Icon]              │
└──────────────────────────────────────────────────────────────┘
```

**Footer Details:**
- 4-column grid (desktop), accordion/stack (mobile)
- Height: ~300px desktop
- Text: 14px, `ak-text-secondary`
- Links: Hover underline, `ak-text-primary` on hover
- Social icons: 20px, ghost button style

---

### 3.2 Agent Detail Pages

**Template Yapısı (Her agent için aynı):**

```
/agents/scribe
/agents/trace
/agents/proto
```

#### **Ortak Bölümler:**

**A. Hero Section**
```
[Agent Icon - Large, 80px]
[Agent Name - H1]
[Tagline - One sentence]
[Primary CTA: Try {Agent} Free] [Secondary: View Docs]
```

**B. Demo/Preview**
```
[5-10 second looped GIF or video]
Caption: "Watch {Agent} in action"
```

**C. Features Grid**
```
4-6 feature cards:
- Icon + Title + 2-sentence description
- Link to detailed docs
```

**D. Technical Specifications**
```
Table format:
├── Supported Languages: JavaScript, TypeScript, Python, Go...
├── Input Sources: GitHub PRs, Jira tickets, API calls
├── Output Formats: Markdown, Confluence, OpenAPI, JSDoc
├── Integration: GitHub App, Jira Cloud API, Confluence API
└── Latency: Average 5-12 seconds per job
```

**E. Configuration Example**
```yaml
# Example playbook snippet
scribe:
  trigger: on_pr_merge
  targets:
    - confluence_space: "ENGDOCS"
      template: "feature_spec"
  review: auto_approve
```

**F. Use Cases (3-4 detailed scenarios)**
```
Scenario 1: API Documentation Sync
Problem: New endpoints aren't documented
Solution: Scribe detects new routes, updates OpenAPI spec
Result: Docs always match reality

[Repeat for 2-3 more scenarios]
```

**G. FAQ Section (Agent-Specific)**
```
5-7 questions like:
- Does Scribe overwrite my manual changes?
- Which documentation platforms are supported?
- Can I customize the writing tone?
- How does conflict resolution work?
```

**H. Testimonial / Mini Case Study**
```
"[Quote about impact]"
— [Name, Title, Company]

[Stat: "Reduced doc lag from 2 weeks to 2 hours"]
```

**I. Related Resources**
```
Links:
- Full documentation →
- API reference →
- Example playbooks (GitHub) →
- Community forum →
```

**J. Bottom CTA**
```
Ready to try {Agent}?
[Create Free Account →]
```

---

### 3.3 Pricing Page (/pricing)

#### **Hero:**
```
Pricing That Scales With Your Team
Start free. Upgrade when you're ready. Cancel anytime.
```

#### **Tier Comparison:**

**Üç Tier Önerisi:**

```
┌─────────────────────────────────────────────────────────────┐
│                      Developer (Free)                        │
│                          $0/mo                               │
│                                                              │
│  Perfect for: Solo developers, open-source projects         │
│                                                              │
│  ✓ 1 active agent at a time                                │
│  ✓ 100 jobs/month                                          │
│  ✓ Community support (Discord)                             │
│  ✓ 7-day log retention                                     │
│  ✓ GitHub + Jira integrations                              │
│                                                              │
│               [Start Free →]                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Team (Most Popular)                     │
│                        $49/month                             │
│                                                              │
│  Perfect for: Small to mid-sized teams (5-20 people)        │
│                                                              │
│  Everything in Developer, plus:                             │
│  ✓ All agents active simultaneously                         │
│  ✓ Unlimited jobs                                          │
│  ✓ Priority Slack support                                  │
│  ✓ 90-day log retention                                    │
│  ✓ SSO (Google, GitHub)                                    │
│  ✓ Team management (5 seats included)                      │
│  ✓ Custom playbook library                                 │
│                                                              │
│         [Start 14-Day Free Trial →]                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Enterprise                             │
│                       Custom Pricing                         │
│                                                              │
│  Perfect for: Large organizations (20+ people)              │
│                                                              │
│  Everything in Team, plus:                                  │
│  ✓ Self-hosted deployment option                            │
│  ✓ 99.9% SLA with dedicated support                        │
│  ✓ Dedicated customer success manager                       │
│  ✓ Advanced security (SSO, SAML, audit logs)               │
│  ✓ Unlimited seats                                         │
│  ✓ Custom integrations                                      │
│  ✓ On-premise training                                      │
│                                                              │
│              [Contact Sales →]                              │
└─────────────────────────────────────────────────────────────┘
```

#### **Feature Comparison Table:**

```
| Feature              | Developer | Team    | Enterprise |
|----------------------|-----------|---------|------------|
| Active Agents        | 1         | All (3) | All (3)    |
| Jobs/Month           | 100       | ∞       | ∞          |
| Support              | Community | Slack   | Dedicated  |
| Log Retention        | 7 days    | 90 days | Custom     |
| Team Seats           | 1         | 5       | Unlimited  |
| SSO                  | ❌        | ✅      | ✅ (SAML)  |
| Self-Hosted          | ❌        | ❌      | ✅         |
| SLA                  | ❌        | ❌      | 99.9%      |
| Custom Integrations  | ❌        | ❌      | ✅         |
```

#### **ROI Calculator (Interactive):**

```
Estimate Your Savings

Team Size: [Slider: 1-50]
Average Hours Saved/Week per Person: [Input: default 5]

──────────────────────────────
Your Potential Annual Savings:

Time: 1,300 hours/year
Cost (@ $100/hr): $130,000/year

AKIS Cost: $588/year (Team plan)
Net Savings: $129,412

[Get Started Free →]
```

#### **FAQ Section:**
```
Billing & Plans:
- Can I change plans later? Yes, anytime.
- What payment methods? Credit card, invoice (Enterprise).
- What happens if I exceed job limits? Soft limit, upgrade prompt.

Cancellation:
- Can I cancel anytime? Yes, no penalties.
- Do I keep my data? Yes, export available for 30 days.
- Refund policy? 14-day money-back guarantee (Team plan).

Security:
- Where is data stored? AWS (US/EU regions available).
- Is data encrypted? Yes, at rest and in transit.
- SOC 2 compliance? In progress, expected Q2 2026.
```

#### **Trust Badges:**
```
[Icon: 🔒] No credit card for free tier
[Icon: 💳] 14-day money-back guarantee
[Icon: 🚪] Cancel anytime, keep your data
```

---

### 3.4 Integrations Page (/integrations)

#### **Hero:**
```
Works With the Tools You Already Use
No new workflows. No migrations. Just connect and go.
```

#### **Integration Cards:**

**Primary Integrations (Available Now):**

```
┌─────────────────────────────────────────────────────────────┐
│  [GitHub Logo]                                    [✓ Live]  │
│  GitHub                                                      │
│                                                              │
│  Deep integration via GitHub App and MCP protocol.          │
│  Monitor repos, read PRs, commit files, manage branches.    │
│                                                              │
│  Setup: 2-minute OAuth flow                                │
│  Used by: Scribe, Trace, Proto                              │
│                                                              │
│  [Setup Guide →]  [View Permissions →]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Jira Logo]                                      [✓ Live]  │
│  Jira Cloud                                                  │
│                                                              │
│  Extract tickets, acceptance criteria, and project data.    │
│  Supports Jira Cloud API with token-based auth.             │
│                                                              │
│  Setup: API token required                                  │
│  Used by: Trace, Proto                                      │
│                                                              │
│  [Setup Guide →]  [Test Connection →]                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Confluence Logo]                                [✓ Live]  │
│  Confluence Cloud                                            │
│                                                              │
│  Create, update, and sync documentation pages.              │
│  Real-time content sync with smart merge capabilities.      │
│                                                              │
│  Setup: API token (same as Jira)                            │
│  Used by: Scribe                                            │
│                                                              │
│  [Setup Guide →]  [Preview Templates →]                     │
└─────────────────────────────────────────────────────────────┘
```

**Coming Soon:**

```
GitLab         [🕐 Q1 2026]
Azure DevOps   [🕐 Q2 2026]
Linear         [🕐 Q2 2026]
Notion         [🕐 Q3 2026]
Slack          [🕐 Q1 2026] (Notifications)
```

#### **Request Integration:**

```
Don't see your tool?
[Request Integration Form]
- Tool name
- Use case
- Team size
- Priority (1-5)

[Submit Request →]
```

---

## 4. Kullanıcı Akışları (User Flows)

### 4.1 Flow: İlk Ziyaretçi → Kayıt → İlk Agent Çalıştırma

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Landing Page'e Giriş                                      │
│    - Google arama veya direkt URL                            │
│    - İlk izlenim: Hero + AKIS logo                           │
│    - Scroll: Problem → Solution → Agents                     │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CTA Click: "Get Early Access"                            │
│    - Hero veya footer'dan signup'a yönlendirme              │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Signup Page (/signup)                                     │
│    - Form: Name, Email, Password, Confirm                    │
│    - OAuth Option: "Continue with GitHub" (recommended)     │
│    - Terms checkbox validation                               │
│    - UI: Full-bleed `ak-bg`, kart `ak-surface-2`, odak halkası `ak-primary` (Phase 9.1) │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Account Creation Success                                  │
│    - Toast: "Welcome to AKIS! 🎉"                           │
│    - Auto-redirect to onboarding wizard                      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Onboarding Wizard (Multi-Step)                           │
│                                                              │
│    Step 1/4: Welcome Screen                                 │
│    - "Let's get you set up in 2 minutes"                    │
│    - [Continue →]                                           │
│                                                              │
│    Step 2/4: Connect GitHub                                 │
│    - "Connect your GitHub account"                          │
│    - [Authorize GitHub App] button                          │
│    - OAuth flow → GitHub permission page → Redirect back    │
│                                                              │
│    Step 3/4: Select Repository                              │
│    - Dropdown: List of user's repos                         │
│    - "Which repo should we start with?"                     │
│    - [Continue →]                                           │
│                                                              │
│    Step 4/4: Choose First Agent                             │
│    - Radio cards: [Scribe] [Trace] [Proto]                 │
│    - Recommendation: "Scribe is great for getting started"  │
│    - [Finish Setup →]                                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Agent Configuration Quick Setup                           │
│    - Pre-filled default playbook shown                       │
│    - "You can customize later. Want to run a test job now?" │
│    - [Run Test Job] [Skip to Dashboard]                     │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. First Job Execution                                       │
│    - Loading spinner: "Scribe is analyzing your repo..."    │
│    - Progress indicator (simulated or real-time)            │
│    - Duration: ~10-15 seconds                                │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Success Screen                                            │
│    - Confetti animation: "🎉 Your first AKIS agent ran!"   │
│    - Summary card:                                          │
│      "Scribe analyzed 12 files and found 3 outdated docs"   │
│    - [View Details] [Go to Dashboard]                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 9. Dashboard Redirect                                        │
│    - Welcome banner: "Hi [Name], here's your workspace"     │
│    - First job visible in "Recent Jobs" table               │
│    - Quick tip tooltip: "Run more jobs from here →"         │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Points:**
- Total time to first value: **< 5 minutes**
- Progress visibility throughout
- Success celebration (confetti) for positive reinforcement
- Clear next steps at each stage

---

### 4.2 Flow: Returning User → New Job Başlatma

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Login (/login)                                            │
│    - Email/password veya "Continue with GitHub"             │
│    - Remember me checkbox                                    │
│    - UI: `ak-bg` tam ekran, form kartı `ak-surface-2`, focus ring `ak-primary` │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Dashboard Overview                                        │
│    - Metrics cards: Jobs this week, time saved, success rate│
│    - Recent jobs table (last 10)                            │
│    - Quick actions panel visible                             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Quick Action: "Run Scribe Now" Button Click              │
│    - Modal opens: "Run Scribe Job"                          │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Job Configuration Modal                                   │
│    - Repository dropdown (pre-selected last used)           │
│    - Target branch (default: main)                          │
│    - Run mode: [Auto] [Dry Run]                             │
│    - Advanced: collapse/expand section                       │
│    - [Cancel] [Run Job →]                                   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Job Queued                                                │
│    - Toast notification: "Scribe job started"               │
│    - Modal closes                                            │
│    - Dashboard updates: New row in jobs table (status: Running)│
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Real-Time Updates (Optional)                              │
│    - Status badge changes: Running → Processing → Finalizing│
│    - Progress bar (if WebSocket enabled)                     │
│    - Estimated time remaining                                │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Job Completion                                            │
│    - Toast: "✓ Scribe completed in 12s. View details →"    │
│    - Table row updates: Status badge → Success (green)      │
│    - Click on row to view details                           │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Job Detail Page                                           │
│    - Summary: Files analyzed, docs updated, time taken      │
│    - Logs: Collapsible sections (agent reasoning visible)   │
│    - Artifacts: Links to updated Confluence pages, PRs      │
│    - Actions: [Retry] [Download Logs] [Share]               │
└──────────────────────────────────────────────────────────────┘
```

**Optimization Points:**
- Pre-fill last-used settings for faster repeat jobs
- One-click re-run from job detail page
- Toast notifications don't block workflow

---

### 4.3 Flow: Teknik User → API Integration

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Dashboard → Settings → API Keys Tab                      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. API Keys Management Page                                  │
│    - List of existing keys (name, created, last used)       │
│    - [Generate New Key] button (top right)                  │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Generate API Key Modal                                    │
│    - Key name: [Input]                                      │
│    - Expiration: [Dropdown: 30/90/365 days, Never]         │
│    - Scopes: [Checkboxes: read:jobs, write:jobs, admin]    │
│    - [Cancel] [Generate Key →]                              │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Key Generated Success                                     │
│    - Warning banner: "This key will only be shown once"     │
│    - API Key: [ak_live_xyz123...] [Copy] button            │
│    - [I've copied this key] checkbox → enables [Done]       │
│    - Link: "View API docs →" (/docs/api-reference)         │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. API Documentation Page                                    │
│    - Quick start section with curl examples                 │
│    - Endpoint reference (REST API)                          │
│    - Authentication guide                                    │
│    - Rate limits table                                       │
│    - SDK links: JavaScript, Python, Go                      │
│    - Postman collection download                             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Test API Call (User's Terminal)                          │
│    curl -H "Authorization: Bearer ak_live_xyz..." \         │
│         https://api.akis.dev/v1/jobs                        │
│                                                              │
│    Response: { "jobs": [...] }                              │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Integration Success                                       │
│    - User implements AKIS into CI/CD                        │
│    - Jobs triggered via API show in dashboard               │
│    - Usage stats visible in API keys page                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Uygulama (Dashboard) Sayfaları

### 5.1 Dashboard Overview (/dashboard)

**Layout:** Sidebar (left) + Main content area

**Sidebar Navigation:**
```
[AKIS Logo]

🏠 Overview
📋 Jobs
🤖 Agents
   ├─ Scribe
   ├─ Trace
   └─ Proto
🔗 Integrations
📊 Analytics (future)
⚙️ Settings

───────────

[User Avatar]
[Username]
[Logout]
```

**Main Content:**

```
┌──────────────────────────────────────────────────────────────┐
│  Welcome back, [Name]! 👋                                    │
│  Here's what's happening with your agents.                   │
└──────────────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Jobs        │ Time Saved  │ Success     │ Active      │
│ This Week   │ This Month  │ Rate        │ Agents      │
│             │             │             │             │
│    47       │  18.5 hrs   │   94%       │    3/3      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Recent Jobs                              [View All →]       │
├────────┬──────┬────────┬────────┬──────────┬──────────────┤
│ ID     │Agent │ Repo   │ Status │ Duration │ Started      │
├────────┼──────┼────────┼────────┼──────────┼──────────────┤
│ #1247  │Scribe│ api    │ ✓ Success│ 12s    │ 2m ago       │
│ #1246  │Trace │ frontend│ ✓ Success│ 8s    │ 1h ago       │
│ #1245  │Proto │ mvp-v2 │ ⚠ Partial│ 45s   │ 3h ago       │
│ #1244  │Scribe│ docs   │ ✗ Failed │ 3s     │ 5h ago       │
│ ...    │ ...  │ ...    │ ...    │ ...      │ ...          │
└────────┴──────┴────────┴────────┴──────────┴──────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Quick Actions                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Run Scribe   │  │ Run Trace    │  │ Create Job   │      │
│  │ Now →        │  │ Now →        │  │ (Advanced)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Activity Feed                               [Mark all read] │
│  ○ Scribe completed job #1247 (api repo) - 2m ago          │
│  ○ GitHub integration refreshed successfully - 1h ago       │
│  ○ New Confluence pages created (3) - 3h ago                │
│  ● Trace job #1245 partially completed - 5h ago             │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.2 Jobs Page (/dashboard/jobs)

**Features:**
- **Table View** (default)
- Filters: Agent type, Status, Date range
- Search: Job ID, repo name
- Pagination: 20 per page
- Bulk actions: Retry, Delete

**Table Columns:**
```
├── Job ID (link)
├── Agent (icon + name)
├── Repository
├── Trigger (PR merge, Manual, Scheduled)
├── Status (badge: Success/Failed/Running/Partial)
├── Duration
├── Started At (relative time)
└── Actions (⋮ menu: View, Retry, Delete, Share)
```

**Click on Row → Modal or Detail Page:**
```
Job #1247 Details

Summary:
- Agent: Scribe
- Repository: mycompany/api
- Branch: main
- Trigger: PR #456 merged
- Duration: 12.3 seconds
- Status: ✓ Completed successfully

Logs: [Collapsible sections]
├── [09:12:34] Started Scribe agent
├── [09:12:35] Fetching PR diff...
├── [09:12:38] Analyzing 12 changed files
├── [09:12:42] Generating documentation updates
├── [09:12:45] Updating Confluence page "API Reference"
└── [09:12:46] ✓ Job completed

Artifacts:
├── Updated Confluence Page: [Link →]
├── Generated Changelog: [View →]
└── Agent reasoning (debug): [Expand]

Actions:
[Retry Job] [Download Logs] [Share Link] [Delete]
```

---

### 5.3 Scribe Single-Page Console

**Path:** `/dashboard/agents/scribe`

**Purpose:** Run Scribe documentation agent from a single workspace with real-time monitoring.

**Layout:** Split-panel design

```
┌──────────────────────────────────────────────────────────────┐
│  Scribe Console                                              │
│  Configure and run Scribe documentation agent                │
└──────────────────────────────────────────────────────────────┘

Left Panel (Configuration):
┌───────────────────────────┐  Right Panel (Glass Box):
│ Configuration             │  ┌─────────────────────────────┐
│ [Link to Integrations →]  │  │ [📋 Logs] [📄 Preview] [📝 Diff]│
│                           │  │                             │
│ Owner: [Select]           │  │ Console output:             │
│ Repository: [Select]      │  │ > Starting Scribe...        │
│ Base Branch: [Select]     │  │ > Scanning repository...    │
│                           │  │ > Analyzing docs...         │
│ Advanced Options ▼        │  │ > Complete ✓                │
│  Target Path: [docs/]     │  │                             │
│  ☑ Dry run                │  └─────────────────────────────┘
│                           │
│ [🚀 Run Scribe]           │
│                           │
│ Status Summary (when run):│
│  Status: Running          │
│  Job ID: abc123...        │
└───────────────────────────┘
```

**Features:**
- Real GitHub repository integration (requires GitHub OAuth)
- Live job status polling with real-time logs
- Preview and diff tabs for generated documentation
- Dry-run mode for safe testing
- Direct link to integrations setup

**No Demo Mode:** All operations connect to real backend and GitHub API.

---

### 5.4 Integrations Page (/dashboard/integrations)

```
┌──────────────────────────────────────────────────────────────┐
│  Connected Services                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [GitHub Logo] GitHub                         [✓ Connected]  │
│  Connected as: @username                                     │
│  Permissions: read:repo, write:repo, webhooks                │
│  Last synced: 5 minutes ago                                  │
│  [Disconnect] [View Settings]                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Jira Logo] Jira Cloud                       [✓ Connected]  │
│  Connected to: mycompany.atlassian.net                       │
│  API token: ****************xyz                              │
│  Status: Active                                              │
│  [Disconnect] [Refresh Token] [Test Connection]              │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Confluence Logo] Confluence                 [⚠ Warning]   │
│  Connected to: mycompany.atlassian.net                       │
│  API token expires in: 7 days                                │
│  [Renew Token →]                                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Available Integrations                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [GitLab Logo] GitLab                        [🕐 Coming Soon]│
│  Expected: Q1 2026                                           │
│  [Notify Me]                                                 │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Slack Logo] Slack (Notifications)           [Connect →]   │
│  Get job completion alerts in your Slack workspace           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.5 Settings Pages (/dashboard/settings)

**Tabs:** Profile | Workspace | API Keys | Billing | Notifications

#### **Profile Tab:**
```
Avatar: [Upload/Change Photo]
Full Name: [Input]
Email: [Input] (verified ✓)
Password: ******** [Change Password]
[Save Changes]
```

#### **Workspace Tab:**
```
Workspace Name: [Input]
Workspace ID: ws_abc123 (read-only)
Created: Jan 15, 2025

Danger Zone:
[Delete Workspace] (requires confirmation)
```

#### **API Keys Tab:**
```
Active Keys:
├── Production Key (created 30 days ago, last used 2h ago) [Revoke]
├── CI/CD Key (created 5 days ago, never used) [Revoke]

[Generate New Key]
```

#### **Billing Tab (Future):**
```
Current Plan: Team ($49/mo)
Next billing date: Feb 1, 2026
Payment method: •••• 4242

Usage This Month:
├── Jobs run: 1,247 / Unlimited
├── Storage: 245 MB / 10 GB

[Upgrade Plan] [Update Payment Method] [Download Invoice]
```

#### **Notifications Tab:**
```
Email Notifications:
☑ Job completions
☑ Job failures
☐ Weekly summary
☐ Product updates

Slack Notifications:
☑ Job failures only
☐ All job completions

[Save Preferences]
```

---

## 6. Responsive ve Erişilebilirlik Notları

### 6.1 Responsive Breakpoints

```css
Mobile (base):  375px  (iPhone SE)
Tablet (sm):    640px
Laptop (md):    768px
Desktop (lg):   1024px
Wide (xl):      1280px
Ultra (2xl):    1536px
```

### 6.2 Kritik Responsive Davranışlar

**Header:**
- Desktop: Horizontal nav, all items visible
- Tablet: Condensed nav, some items in dropdown
- Mobile: Hamburger menu → Full-screen drawer

**Hero Logo:**
- Desktop: 112px height (max)
- Tablet: ~96px height
- Mobile: 72–88px (CSS clamp ile)

**Product Cards (Landing):**
- Desktop: 3-column grid
- Tablet: 2-column grid
- Mobile: Stacked (1 column)

**Dashboard Sidebar:**
- Desktop: Fixed left sidebar (240px width)
- Tablet: Collapsible sidebar with toggle
- Mobile: Slide-over overlay (triggered by hamburger)

**Tables:**
- Desktop: Full table view
- Tablet: Horizontal scroll with sticky first column
- Mobile: Card view (each row becomes a card)

### 6.3 Erişilebilirlik (A11y) Checklist

**✅ WCAG 2.1 AA Compliance Target:**

- **Color Contrast:**
  - Body text: ≥ 4.5:1
  - Large text (18px+): ≥ 3:1
  - UI components: ≥ 3:1

- **Keyboard Navigation:**
  - All interactive elements reachable via Tab
  - Logical tab order (top→bottom, left→right)
  - Visible focus indicators (2px ring, primary color)
  - Escape key closes modals/dropdowns

- **Semantic HTML:**
  - `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
  - Headings hierarchy (H1 → H2 → H3, no skips)
  - Lists for navigation items (`<ul>`, `<li>`)

- **ARIA Labels:**
  - Icon-only buttons: `aria-label="Close"`, `aria-label="Menu"`
  - Form inputs: Associated `<label>` or `aria-labelledby`
  - Loading states: `aria-live="polite"` for status updates

- **Images:**
  - Logo: `alt="AKIS"`
  - Decorative images: `alt=""` (empty)
  - Informative images: Descriptive alt text

- **Forms:**
  - Error messages: `aria-describedby` linking to error text
  - Required fields: `aria-required="true"` or `required` attribute
  - Validation feedback: Inline + accessible

- **Skip Links:**
  - "Skip to main content" link (hidden, visible on focus)
  - Positioned at top of DOM

- **Screen Reader Testing:**
  - Test with VoiceOver (macOS) or NVDA (Windows)
  - Ensure all content readable and navigable

---

## 7. SEO ve Meta Bilgileri

### 7.1 Primary Pages Meta Tags

**Landing Page (/):**
```html
<title>AKIS - AI Agents for Software Development Automation</title>
<meta name="description" content="Autonomous AI agents that document, test, and build—so your team can focus on what truly matters. Integrate with GitHub, Jira, and Confluence in minutes.">
<meta name="keywords" content="AI agents, software automation, documentation automation, test automation, rapid prototyping, GitHub integration, Jira, Confluence">

<!-- Open Graph -->
<meta property="og:title" content="AKIS - Software Development's New Center">
<meta property="og:description" content="Save 20+ hours/week with autonomous AI agents for docs, tests, and MVPs.">
<meta property="og:image" content="https://akis.dev/og-image.png">
<meta property="og:url" content="https://akis.dev">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="AKIS - AI Development Automation">
<meta name="twitter:description" content="Autonomous agents for docs, tests, and MVPs. Free beta access.">
<meta name="twitter:image" content="https://akis.dev/twitter-card.png">
```

**Agent Pages (/agents/scribe):**
```html
<title>AKIS Scribe - Automated Documentation from Git Commits</title>
<meta name="description" content="AKIS Scribe automatically updates Confluence, wikis, and specs from your GitHub PRs. Always-current documentation with zero manual effort.">
```

**Pricing Page:**
```html
<title>AKIS Pricing - Free for Developers, $49/mo for Teams</title>
<meta name="description" content="Start free. Upgrade when ready. Transparent pricing for AI-powered development automation. No credit card required.">
```

### 7.2 Structured Data (JSON-LD)

**SoftwareApplication Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AKIS Platform",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

---

## 8. Performans ve Analytics

### 8.1 Performance Budgets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms

**Bundle Size Targets:**
- Initial JS bundle: < 150 KB (gzipped)
- Initial CSS: < 50 KB (gzipped)
- Total page weight (first load): < 500 KB

### 8.2 Optimization Tactics

- **Code Splitting:** Route-based chunks
- **Image Optimization:** WebP format, lazy-load below fold
- **Font Loading:** System fonts (no web fonts initially)
- **Critical CSS:** Inline above-the-fold styles
- **Third-Party Scripts:** Defer/async, minimize count

### 8.3 Analytics Events (Önerilen)

**Conversion Funnels:**
```javascript
// Landing → Signup
track('Landing Page Viewed')
track('CTA Clicked', { location: 'hero' | 'pricing' | 'footer' })
track('Signup Started')
track('Signup Completed', { method: 'github' | 'google' | 'email' })

// Onboarding
track('Onboarding Started')
track('GitHub Connected')
track('Repository Selected', { repo_name })
track('First Agent Configured', { agent: 'scribe' | 'trace' | 'proto' })
track('First Job Completed', { agent, duration, success })

// Product Usage
track('Job Created', { agent, trigger_type })
track('Job Completed', { agent, status, duration })
track('Integration Connected', { platform })
track('Agent Config Updated', { agent })
track('API Key Generated')

// Engagement
track('Docs Page Viewed', { page_path })
track('Pricing Page Viewed')
track('Contact Form Submitted')
```

---

## 9. Gelecek Geliştirmeler (Roadmap Hints)

**Phase 2 (Post-MVP):**
- Blog/Content Hub
- Community forum (Discourse veya custom)
- Customer showcase/case studies page
- Interactive product tour (Appcues, Intro.js)
- Video tutorials section

**Phase 3 (Growth):**
- Multi-language support (i18n)
- Regional landing pages (US, EU, APAC)
- A/B testing infrastructure
- Referral program page
- Partner/Integration marketplace

---

## 10. Sonuç ve Uygulama Öncelikleri

### Minimum Viable Marketing Site (Week 1-2):
1. ✅ Landing page (hero + 3 agent summaries + CTA)
2. ✅ Login/Signup pages (UI only, mock auth)
3. ✅ Basic dashboard shell (overview + jobs list)
4. ✅ Header + Footer (responsive)
5. ✅ Dark theme implemented globally

### Core Product Pages (Week 3-4):
1. ✅ Agent detail pages (Scribe, Trace, Proto)
2. ✅ Pricing page
3. ✅ Integrations page
4. ✅ Docs structure (Getting Started minimum)
5. ✅ Real auth (GitHub OAuth)

### Polish & Optimize (Week 5-6):
1. ✅ A11y audit + fixes
2. ✅ Performance optimization (Lighthouse 90+)
3. ✅ SEO meta tags + sitemap.xml
4. ✅ Analytics integration
5. ✅ Error tracking (Sentry)

---

**Bu doküman, AKIS Platform'un web sitesi bilgi mimarisini, kullanıcı akışlarını ve sayfa içeriklerini kapsamlı şekilde tanımlar. Proje kapsam dokümanına eklenmeye hazırdır.**

