# AKIS Platform - UI Design System & Component Library

**Doküman Versiyonu:** v1.1  
**Hazırlanma Tarihi:** Kasım 2025  
**Amaç:** AKIS Platform'un görsel tasarım sistemi, marka token'ları, UI komponentleri ve stil rehberi
**Güncelleme Notu (Phase 9.1):** Final karanlık tema token tablosu, logo boyutları, buton/input odak kuralları ve auth UI tutarlılıkları güncellendi.

---

## 1. Marka Kimliği (Brand Identity)

### 1.1 Marka Değerleri ve Vizyon

**Core Values:**
- **Şeffaflık:** Her agent aksiyonu görünür ve açıklanabilir
- **Kontrol:** Kullanıcı her zaman yetkili, ajanlar asistanlardır
- **Güvenilirlik:** Tutarlı, öngörülebilir sonuçlar
- **Basitlik:** Karmaşık otomasyon, basit arayüz

**Visual Personality:**
- Modern ama gösterişsiz
- Teknik ama erişilebilir
- Dark mode-first (developer tool standartı)
- Minimalist ama sıcak

### 1.2 Logo Kullanımı

**Logo Asset:**
- Birincil dosya: `frontend/src/assets/branding/akis-official-logo@2x.png` (transparent PNG, geniş boşluklu)
- Opsiyonel: @3x varyantı Phase 9.2'de eklenecek (`frontend/src/assets/branding/akis-official-logo@3x.png`)
- Referans merkezi: `frontend/src/theme/brand.ts` (`LOGO_PNG_HERO`, `LOGO_SIZES`)

**Logo Specifications:**

```
Desktop (Hero):
├── Height: 112px (CSS clamp 72px → 112px)
├── Padding: min 16px tüm kenarlar
├── Background: Transparent PNG, `bg-ak-bg` üstünde
└── Alt text: "AKIS"

Mobile (Hero):
├── Height: 72-88px (responsive clamp)
├── Padding: min 12px
└── Responsive scale: fluid

Header/Navigation:
├── Height: 24px (`LOGO_SIZES.nav`)
├── Position: Left aligned
└── Link: Navigates to "/" (homepage)

Footer/Utility:
├── Height: 20px (`LOGO_SIZES.sm`)
└── Kullanım: Footer, küçük badge

Favicon:
├── Sizes: 16x16, 32x32, 180x180, 512x512
└── Format: PNG + ICO
```

**Clear Space:**
- Minimum clear space around logo: `logo_height * 0.25`
- No other elements within clear space

**Don'ts:**
- ❌ Don't stretch or distort
- ❌ Don't rotate
- ❌ Don't change colors (use provided asset)
- ❌ Don't add effects (shadows, outlines) except subtle drop-shadow in dark contexts

---

## 2. Renk Paleti (Color System)

### 2.1 Renk Token Tablosu (Phase 9.1 Final)

| Token | Hex | Kullanım | Not |
|-------|-----|----------|-----|
| `ak-bg` | `#0A1215` | Site genel arka planı, body/html | Full-bleed, band yok |
| `ak-surface` | `#0D171B` | Düşük elevasyon (banner, şerit) | Header mobil band, pricing CTA |
| `ak-surface-2` | `#122027` | Kartlar, modallar, auth formları | Card pattern standardı |
| `ak-primary` | `#07D1AF` | CTA, link, focus halkası | WCAG AA 8.4:1 |
| `ak-text-primary` | `#E9F1F3` | Başlıklar ve kritik metin | `synced` to tokens.ts |
| `ak-text-secondary` | `#A9B6BB` | Gövde açıklamaları | 7.1:1 kontrast |
| `ak-border` | `#1A262C` | Kart/section border, divider | 1px sınırlar |
| `ak-danger` | `#FF6B6B` | Hata durumları | Inputs + alert |

Tüm token değerleri `frontend/src/theme/tokens.ts` dosyasında tip güvenli olarak tutulur. Tailwind `extend.colors` aynı değerleri kullanır.

### 2.2 Türevler & Durum Renkleri

- `ak-primary/90` → hover durumları için Tailwind `bg-ak-primary/90`
- `ak-primary/80` → odak halkası `focus-visible:outline-ak-primary`
- Danger türevleri: `ak-danger/80` (hover), `ak-danger/20` (arka plan)
- Sistem durumları (success, warning, info) Tailwind varsayılan tonlardan seçilebilir; Phase 9.1'de yalnızca `ak-danger` zorunlu.

### 2.3 Kart ve Yüzey Kuralları

- Kart pattern: `bg-ak-surface-2 border border-ak-border text-ak-text-primary`
- Hover: `hover:-translate-y-1 hover:shadow-lg` (shadow içinde `rgba(0,0,0,0.4)`)
- Listeler veya bantlar için `bg-ak-surface` + `border-y border-ak-border`

### 2.4 Odak & Ring Renkleri

- Odak rengi: `ak-primary`
- Tailwind util: `focus:ring-2 focus:ring-ak-primary focus:ring-offset-0` (inputs) veya `focus-visible:outline focus-visible:outline-2 focus-visible:outline-ak-primary` (buttons)
- Checkbox/radyo: `focus:ring-2 focus:ring-ak-primary focus:ring-offset-0`

### 2.5 Overlay & Shadow

- Overlay: `rgba(10, 18, 21, 0.85)`
- Shadow varsayılanları (`shadow-lg`, `shadow-xl`) karanlık yüzeylerde yeterli; özel ihtiyaçta `shadow-[0_8px_32px_rgba(0,0,0,0.45)]`

### 2.6 WCAG Contrast Compliance

**Tested Combinations (Body Text, 16px):**

| Foreground | Background | Ratio | Pass AA | Pass AAA |
|------------|------------|-------|---------|----------|
| ak-text-primary | ak-bg | 15.2:1 | ✅ | ✅ |
| ak-text-primary | ak-surface | 14.1:1 | ✅ | ✅ |
| ak-text-secondary | ak-bg | 7.1:1 | ✅ | ✅ (large) |
| ak-text-secondary | ak-surface-2 | 6.4:1 | ✅ | ❌ |
| ak-primary | ak-bg | 4.8:1 | ✅ | ❌ |
| ak-danger | ak-surface-2 | 4.6:1 | ✅ | ❌ |

**Notes:**
- Muted içeriklerde `ak-text-secondary`, gövde metinleri 16px+ için AA'ya uyumludur.
- `ak-primary` CTA butonları `text-ak-bg` ile kullanılır (kontrast 12.4:1).
- `ak-danger` hata mesajlarında 16px+ ile AA'yı karşılar.

---

## 3. Tipografi (Typography)

### 3.1 Font Stack

**System Font Stack (No Web Fonts):**

```css
font-family: 
  'Inter var',           /* If locally installed */
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  sans-serif;
```

**Monospace (Code):**

```css
font-family:
  'JetBrains Mono',      /* If locally installed */
  'SF Mono',
  'Monaco',
  'Menlo',
  'Consolas',
  'Courier New',
  monospace;
```

**Rationale:**
- Avoid web font loading (performance budget)
- System fonts are optimized per OS
- Reduce first paint time

### 3.2 Type Scale

```javascript
{
  // Display (Hero headlines)
  'text-display': {
    fontSize: '3.5rem',      // 56px
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  
  // H1 (Page titles)
  'text-h1': {
    fontSize: '2.5rem',      // 40px
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  
  // H2 (Section titles)
  'text-h2': {
    fontSize: '2rem',        // 32px
    lineHeight: '1.25',
    fontWeight: '600',
  },
  
  // H3 (Subsection titles)
  'text-h3': {
    fontSize: '1.5rem',      // 24px
    lineHeight: '1.33',
    fontWeight: '600',
  },
  
  // H4 (Card titles)
  'text-h4': {
    fontSize: '1.25rem',     // 20px
    lineHeight: '1.4',
    fontWeight: '600',
  },
  
  // Body Large
  'text-body-lg': {
    fontSize: '1.125rem',    // 18px
    lineHeight: '1.75',
    fontWeight: '400',
  },
  
  // Body (Default)
  'text-body': {
    fontSize: '1rem',        // 16px
    lineHeight: '1.625',
    fontWeight: '400',
  },
  
  // Body Small
  'text-body-sm': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.57',
    fontWeight: '400',
  },
  
  // Caption
  'text-caption': {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  
  // Code
  'text-code': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.7',
    fontFamily: 'monospace',
  },
}
```

### 3.3 Font Weights

```javascript
{
  'font-normal': 400,
  'font-medium': 500,
  'font-semibold': 600,
  'font-bold': 700,
}
```

**Usage Guidelines:**
- **Headings:** `font-semibold` (600) or `font-bold` (700)
- **Body text:** `font-normal` (400)
- **Emphasis:** `font-medium` (500) inline
- **CTAs:** `font-semibold` (600)

### 3.4 Responsive Typography

```css
/* Mobile (base) */
.text-display { font-size: 2.25rem; }   /* 36px */
.text-h1 { font-size: 1.875rem; }       /* 30px */
.text-h2 { font-size: 1.5rem; }         /* 24px */

/* Tablet (md: 768px+) */
@media (min-width: 768px) {
  .text-display { font-size: 3rem; }    /* 48px */
  .text-h1 { font-size: 2.25rem; }      /* 36px */
  .text-h2 { font-size: 1.75rem; }      /* 28px */
}

/* Desktop (lg: 1024px+) */
@media (min-width: 1024px) {
  .text-display { font-size: 3.5rem; }  /* 56px */
  .text-h1 { font-size: 2.5rem; }       /* 40px */
  .text-h2 { font-size: 2rem; }         /* 32px */
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (Tailwind-based)

```javascript
{
  '0': '0px',
  '1': '0.25rem',    // 4px
  '2': '0.5rem',     // 8px
  '3': '0.75rem',    // 12px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '8': '2rem',       // 32px
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
  '32': '8rem',      // 128px
}
```

**Usage Patterns:**

```
Component Padding (Cards, Modals):
- Desktop: p-8 (32px) to p-12 (48px)
- Mobile: p-6 (24px)

Section Spacing (Vertical):
- Desktop: py-16 (64px) to py-24 (96px)
- Mobile: py-12 (48px)

Element Gaps (Flex/Grid):
- Tight: gap-2 (8px)
- Normal: gap-4 (16px)
- Loose: gap-6 (24px)

Container Max-Width:
- Narrow (text): 42rem (672px)
- Standard: 80rem (1280px)
- Wide: 90rem (1440px)
```

### 4.2 Layout Grid

**Container:**

```css
.container {
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 1.5rem; /* 24px */
}

@media (min-width: 768px) {
  .container {
    padding-inline: 2rem; /* 32px */
  }
}

@media (min-width: 1024px) {
  .container {
    padding-inline: 4rem; /* 64px */
  }
}
```

**Grid Systems:**

```css
/* 12-column grid (desktop) */
.grid-cols-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem; /* 24px */
}

/* 3-column feature grid */
.grid-cols-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem; /* 32px */
}

/* Responsive: stack on mobile */
@media (max-width: 767px) {
  .grid-cols-3 {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

### 4.3 Elevation & Shadows

```javascript
{
  // Subtle elevation (cards, inputs)
  'shadow-ak-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
  
  // Medium elevation (dropdowns, tooltips)
  'shadow-ak-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
  
  // High elevation (modals, popovers)
  'shadow-ak-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
  
  // Accent glow (hover on primary elements)
  'shadow-ak-glow': '0 0 24px rgba(7, 209, 175, 0.3)',
  
  // Inner shadow (inset inputs)
  'shadow-ak-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
}
```

**Usage:**
- Default cards: `shadow-ak-sm`
- Hover cards: `shadow-ak-md` + `translateY(-2px)`
- Modals: `shadow-ak-lg`
- Primary CTA hover: `shadow-ak-glow`

---

## 5. UI Components

### 5.1 Buttons

`frontend/src/components/common/Button.tsx` tek kaynak.  
Props: `variant: 'primary' | 'secondary' | 'outline' | 'ghost'`, `size: 'md' | 'lg'`, `as` polymorfik.

**Temel sınıflar:**

```tsx
const baseClasses =
  "inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ak-primary focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap";
```

**Variant matrix:**

```tsx
const variantClasses = {
  primary: "bg-ak-primary text-ak-bg hover:bg-ak-primary/90",
  secondary: "bg-ak-surface-2 text-ak-text-primary hover:bg-ak-surface",
  outline:
    "bg-ak-bg border border-ak-border text-ak-text-primary hover:border-ak-primary hover:text-ak-primary hover:bg-ak-surface",
  ghost:
    "bg-ak-bg text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface",
};
```

**Boyutlar:**

```tsx
const sizeClasses = {
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};
```

**Kullanım Notları:**
- Hero CTA (`/signup`): `variant="primary" size="lg"`
- İkincil CTA (`/login`): `variant="outline" size="lg"`
- Header mobil menü: `variant="secondary" size="md"`
- Focus state her varyantta `outline-ak-primary`; ekstra ring eklemeye gerek yok.
- Disabled: `disabled` prop + `aria-disabled` gerekirse wrapper componentte ayarlanır.

---

### 5.2 Input Fields

#### **Text Input**

```tsx
className="
  w-full 
  border 
  border-ak-border 
  bg-ak-surface 
  text-ak-text-primary 
  px-4 py-3 
  rounded-xl 
  transition-colors duration-150
  placeholder:text-ak-text-secondary/70
  focus:border-ak-primary 
  focus:outline-none 
  focus:ring-2 
  focus:ring-ak-primary/70
  disabled:opacity-60 
  disabled:cursor-not-allowed
"
```

**With Label:**

```tsx
<div className="space-y-2">
  <label 
    htmlFor="email" 
    className="block text-sm font-medium text-ak-text-primary"
  >
    Email Address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="..." // input classes above
  />
</div>
```

**Error State:**

```tsx
// Add to input classes
className="
  border-ak-error 
  focus:border-ak-error
  focus:ring-2
  focus:ring-ak-error/70
"

// Error message below input
<p className="mt-1 text-sm text-ak-error">
  Invalid email address
</p>
```

#### **Password Input with Toggle:**

```tsx
<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    className="..." // standard input classes
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      rounded-lg text-xs font-medium uppercase tracking-wide
      text-ak-text-secondary hover:text-ak-primary
      focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-0
    "
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>
```

#### **Select Dropdown:**

```tsx
className="
  w-full 
  bg-ak-surface 
  border 
  border-ak-border 
  text-ak-text-primary 
  px-4 py-3 
  rounded-xl 
  cursor-pointer
  focus:border-ak-primary 
  focus:outline-none 
  focus:ring-2 
  focus:ring-ak-primary/70
"
```

---

### 5.3 Cards

#### **Base Card:**

```tsx
className="
  text-ak-text-primary 
  bg-ak-surface-2 
  border 
  border-ak-border 
  rounded-2xl 
  p-6 
  shadow-lg
  transition-transform duration-200
  hover:-translate-y-1 
  hover:shadow-xl
"
```

**Clickable Card (Link):**

```tsx
className="
  ...base-card-classes
  cursor-pointer
  hover:border-ak-primary
  focus-visible:outline 
  focus-visible:outline-2 
  focus-visible:outline-ak-primary 
  focus-visible:outline-offset-2
"
```

**Card with Header:**

```tsx
<div className="...card-classes">
  <div className="flex items-start justify-between mb-4">
    <h3 className="text-h4 text-ak-text-primary">Card Title</h3>
    <span className="text-caption text-ak-text-tertiary">Meta</span>
  </div>
  <p className="text-body-sm text-ak-text-secondary">
    Card content goes here...
  </p>
</div>
```

---

### 5.4 Badges & Pills

#### **Status Badge:**

```tsx
// Success
className="
  inline-flex items-center gap-1
  px-2.5 py-1 
  rounded-full 
  text-xs font-medium
  bg-ak-success-bg 
  text-ak-success 
  border border-ak-success-border
"

// Warning
className="
  ...
  bg-ak-warning-bg 
  text-ak-warning 
  border border-ak-warning-border
"

// Error
className="
  ...
  bg-ak-error-bg 
  text-ak-error 
  border border-ak-error-border
"
```

**Usage:**

```tsx
<span className="badge-success">
  <CheckIcon className="w-3 h-3" />
  Success
</span>
```

---

### 5.5 Modals & Overlays

#### **Modal Container:**

```tsx
// Overlay backdrop
<div className="
  fixed inset-0 
  bg-ak-overlay 
  backdrop-blur-sm 
  z-40
  flex items-center justify-center
  p-4
">
  {/* Modal content */}
  <div className="
    bg-ak-surface-2 
    rounded-2xl 
    shadow-ak-lg 
    max-w-2xl 
    w-full 
    max-h-[90vh] 
    overflow-y-auto
    p-6
  ">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <h2 className="text-h3">Modal Title</h2>
      <button 
        className="..." // icon button classes
        aria-label="Close"
      >
        <XIcon />
      </button>
    </div>
    
    {/* Body */}
    <div className="mb-6">
      Content here...
    </div>
    
    {/* Footer */}
    <div className="flex justify-end gap-3">
      <button className="...">Cancel</button>
      <button className="...">Confirm</button>
    </div>
  </div>
</div>
```

**Accessibility:**
- Trap focus within modal
- `ESC` key closes modal
- `aria-modal="true"`
- `role="dialog"`
- `aria-labelledby` pointing to title

---

### 5.6 Navigation (Header)

#### **Desktop Header:**

```tsx
<header className="sticky top-0 z-40 border-b border-ak-border bg-ak-bg">
  <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <Logo size="nav" />

    <nav className="hidden items-center gap-3 text-sm font-medium md:flex">
      <NavLink
        to="/platform"
        className={({ isActive }) =>
          cn(
            "rounded-full px-4 py-2 transition-colors",
            isActive
              ? "bg-ak-surface-2 text-ak-text-primary"
              : "text-ak-text-secondary hover:text-ak-primary"
          )
        }
      >
        Platform
      </NavLink>
      {/* Diğer menü bağlantıları */}
    </nav>

    <div className="hidden items-center gap-3 md:flex">
      <Button as={Link} to="/login" variant="outline">
        Login
      </Button>
      <Button as={Link} to="/signup">
        Sign up
      </Button>
    </div>

    <Button
      variant="secondary"
      size="md"
      className="md:hidden"
      aria-label="Open navigation"
    >
      Menu
    </Button>
  </div>
</header>
```

#### **Mobile Drawer:**

```tsx
<div
  id="mobile-nav"
  className={cn(
    "md:hidden",
    mobileOpen ? "block border-t border-ak-border bg-ak-bg" : "hidden"
  )}
>
  <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
        Navigation
      </span>
      {primaryLinks.map((link) => (
        <NavLink
          key={link.label}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-ak-surface-2 text-ak-text-primary"
                : "text-ak-text-secondary hover:bg-ak-surface hover:text-ak-primary"
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>

    <Button as={Link} to="/login" variant="outline">
      Login
    </Button>
    <Button as={Link} to="/signup">
      Sign up
    </Button>
  </div>
</div>
```

---

### 5.7 Tables

#### **Desktop Table:**

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-ak-border">
        <th className="
          px-4 py-3 
          text-left text-xs font-semibold 
          text-ak-text-secondary 
          uppercase tracking-wider
        ">
          Column 1
        </th>
        {/* More columns... */}
      </tr>
    </thead>
    <tbody>
      <tr className="
        border-b border-ak-border 
        hover:bg-ak-surface 
        transition-colors
        cursor-pointer
      ">
        <td className="px-4 py-4 text-sm text-ak-text-primary">
          Data cell
        </td>
        {/* More cells... */}
      </tr>
    </tbody>
  </table>
</div>
```

#### **Mobile Card View (Alternative):**

```tsx
// On mobile, each row becomes a card
<div className="md:hidden space-y-4">
  {data.map(item => (
    <div key={item.id} className="...card-classes">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-caption text-ak-text-tertiary">ID</span>
          <span className="text-body-sm">{item.id}</span>
        </div>
        {/* More fields... */}
      </div>
    </div>
  ))}
</div>
```

---

### 5.8 Toasts/Notifications

#### **Toast Container (Bottom-right):**

```tsx
<div className="
  fixed bottom-4 right-4 
  z-50 
  space-y-2 
  max-w-sm
">
  {/* Success toast */}
  <div className="
    bg-ak-surface-2 
    border-l-4 border-ak-success
    rounded-lg 
    shadow-ak-md 
    p-4
    flex items-start gap-3
  ">
    <CheckCircleIcon className="w-5 h-5 text-ak-success flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-ak-text-primary">
        Success!
      </p>
      <p className="text-xs text-ak-text-secondary mt-1">
        Your changes have been saved.
      </p>
    </div>
    <button className="..." aria-label="Dismiss">
      <XIcon className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Variants:**
- Success: `border-ak-success`, green icon
- Error: `border-ak-error`, red icon
- Warning: `border-ak-warning`, amber icon
- Info: `border-ak-info`, blue icon

---

## 6. Animasyon ve Transition'lar

### 6.1 Transition Durations

```javascript
{
  'duration-fast': '150ms',      // Quick interactions (hover)
  'duration-base': '200ms',      // Default (most UI)
  'duration-slow': '300ms',      // Modals, drawers
  'duration-slower': '500ms',    // Page transitions
}
```

### 6.2 Easing Functions

```css
/* Default easing (most cases) */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); 
/* ease-in-out */

/* Entrance (modals, dropdowns) */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1); 
/* ease-out */

/* Exit */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1); 
/* ease-in */
```

### 6.3 Common Animations

#### **Hover Lift (Cards):**

```css
.card-lift {
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.card-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}
```

#### **Button Scale:**

```css
.btn-scale {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.btn-scale:hover {
  transform: scale(1.05);
}

.btn-scale:active {
  transform: scale(1.0);
}
```

#### **Fade In (Page load):**

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}
```

#### **Slide In (Modal):**

```css
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-enter {
  animation: slideInUp 300ms ease-out;
}
```

#### **Spinner (Loading):**

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

**Performance Notes:**
- Only animate `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (layout thrashing)
- Use `will-change` sparingly for upcoming animations

---

## 7. Iconography

### 7.1 Icon System

**Source:** Heroicons (MIT license, Tailwind Labs)  
**Style:** Outline (default), Solid (emphasis)  
**Sizes:**

```javascript
{
  'icon-xs': 'w-3 h-3',      // 12px
  'icon-sm': 'w-4 h-4',      // 16px
  'icon-md': 'w-5 h-5',      // 20px (default)
  'icon-lg': 'w-6 h-6',      // 24px
  'icon-xl': 'w-8 h-8',      // 32px
}
```

### 7.2 Usage Guidelines

**In Buttons:**

```tsx
<button className="...">
  <PlusIcon className="w-5 h-5 mr-2" />
  Add Item
</button>
```

**Icon-Only Buttons:**

```tsx
<button 
  className="..." 
  aria-label="Settings"
>
  <CogIcon className="w-5 h-5" />
</button>
```

**In Text (Inline):**

```tsx
<p className="flex items-center gap-2">
  <CheckIcon className="w-4 h-4 text-ak-success" />
  <span>Feature enabled</span>
</p>
```

### 7.3 Common Icons Map

```javascript
{
  // Navigation
  home: HomeIcon,
  menu: MenuIcon,
  close: XMarkIcon,
  search: MagnifyingGlassIcon,
  
  // Actions
  add: PlusIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  save: CheckIcon,
  cancel: XMarkIcon,
  
  // Status
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  
  // UI
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,
  externalLink: ArrowTopRightOnSquareIcon,
  
  // Agents (custom or emoji fallback)
  scribe: DocumentTextIcon,
  trace: BeakerIcon,
  proto: RocketLaunchIcon,
}
```

---

## 8. Responsive Design Stratejileri

### 8.1 Mobile-First Approach

```css
/* Base styles (mobile, 375px) */
.component {
  padding: 1rem;
  font-size: 1rem;
}

/* Tablet (md: 768px+) */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}

/* Desktop (lg: 1024px+) */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

### 8.2 Critical Responsive Patterns

**Navigation:**
- Mobile: Hamburger → Drawer
- Desktop: Horizontal nav bar

**Hero Section:**
- Mobile: Stack, logo ~72-88px (clamp)
- Desktop: Centered, logo 112px max

**Feature Grids:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**Dashboard Sidebar:**
- Mobile: Bottom tab bar or slide-over
- Desktop: Fixed left sidebar (240px)

**Tables:**
- Mobile: Card view (each row = card)
- Desktop: Traditional table

### 8.3 Touch Targets

**Minimum Size:** 44x44px (iOS guidelines)

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  /* Even if visual size is smaller, padding extends hit area */
}
```

---

## 9. Accessibility (A11y) Detayları

### 9.1 Focus States

**Visible Focus Ring:**

```css
.focus-visible {
  outline: none; /* Remove browser default */
}

.focus-visible:focus-visible {
  outline: 2px solid var(--ak-primary);
  outline-offset: 2px;
}
```

**Tailwind Utility:**

```tsx
className="focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
```

### 9.2 Skip Links

```tsx
<a 
  href="#main-content" 
  className="
    sr-only 
    focus:not-sr-only 
    focus:absolute 
    focus:top-4 
    focus:left-4 
    focus:z-50 
    focus:px-4 
    focus:py-2 
    focus:bg-ak-primary 
    focus:text-ak-bg
  "
>
  Skip to main content
</a>
```

### 9.3 Screen Reader Classes

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 9.4 ARIA Best Practices

**Landmarks:**

```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

**Live Regions:**

```tsx
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**Modals:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Description...</p>
</div>
```

---

## 10. Dark Mode Implementasyonu

### 10.1 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Class-based dark mode
  theme: {
    extend: {
      colors: {
        // Define ak-* colors here
      },
    },
  },
}
```

### 10.2 HTML Setup (Always Dark)

```html
<!DOCTYPE html>
<html lang="tr" class="dark">
<body class="bg-ak-bg text-ak-text-primary">
  <div id="root"></div>
</body>
</html>
```

**Notes:**
- `class="dark"` on `<html>` element
- `bg-ak-bg` on `<body>` ensures full-bleed dark background
- No white flashes on load

### 10.3 Future Light Mode (If Needed)

**Toggle Implementation:**

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

**Light Mode Colors (Future):**

```javascript
{
  'ak-bg-light': '#F9FAFB',
  'ak-surface-light': '#FFFFFF',
  'ak-text-primary-light': '#111827',
  'ak-text-secondary-light': '#6B7280',
  // ... etc.
}
```

---

## 11. Performance Optimizasyonları

### 11.1 CSS Purging (Production)

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Tailwind will purge unused classes
}
```

**Result:** Production CSS < 50 KB (gzipped)

### 11.2 Image Optimization

**Logo (PNG):**
- Optimize with ImageOptim or Squoosh
- Target: < 20 KB for logo asset
- Serve @1x and @2x versions (srcset)

```tsx
<img
  src="/src/assets/branding/akis-official-logo@2x.png"
  srcSet="/src/assets/branding/akis-official-logo@2x.png 1x"
  alt="AKIS"
  style={{ height: "clamp(72px, 12vw, 112px)", width: "auto" }}
/>
```

**Lazy Loading:**

```tsx
<img 
  src="..." 
  alt="..." 
  loading="lazy" 
  decoding="async"
/>
```

### 11.3 Animation Performance

**GPU Acceleration:**

```css
.animated {
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform;   /* Hint to browser */
}

/* After animation completes, remove will-change */
```

**Reduce Motion (Accessibility):**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Özel Bileşen Örnekleri

### 12.1 Feature Card (Landing Page)

```tsx
function FeatureCard({ icon, title, description, link }) {
  return (
    <a
      href={link}
      className="
        group
        bg-ak-surface-2 
        border border-ak-border 
        rounded-2xl 
        p-8 
        transition-all 
        duration-300
        hover:-translate-y-2 
        hover:shadow-ak-md
        hover:border-ak-primary
        focus:outline-none 
        focus:ring-2 
        focus:ring-ak-primary
      "
    >
      <div className="
        w-12 h-12 
        rounded-lg 
        bg-ak-primary-muted 
        flex items-center justify-center
        mb-4
        group-hover:scale-110
        transition-transform
      ">
        {icon}
      </div>
      <h3 className="text-h4 text-ak-text-primary mb-2">
        {title}
      </h3>
      <p className="text-body-sm text-ak-text-secondary mb-4">
        {description}
      </p>
      <span className="
        text-sm text-ak-primary 
        font-medium 
        inline-flex items-center gap-1
        group-hover:gap-2
        transition-all
      ">
        Learn more
        <ArrowRightIcon className="w-4 h-4" />
      </span>
    </a>
  );
}
```

### 12.2 Status Badge Component

```tsx
function StatusBadge({ status, children }) {
  const variants = {
    success: 'bg-ak-success-bg text-ak-success border-ak-success-border',
    warning: 'bg-ak-warning-bg text-ak-warning border-ak-warning-border',
    error: 'bg-ak-error-bg text-ak-error border-ak-error-border',
    pending: 'bg-ak-info-bg text-ak-info border-ak-info-border',
  };
  
  const icons = {
    success: <CheckIcon className="w-3 h-3" />,
    warning: <ExclamationTriangleIcon className="w-3 h-3" />,
    error: <XMarkIcon className="w-3 h-3" />,
    pending: <ClockIcon className="w-3 h-3" />,
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1
      px-2.5 py-1 
      rounded-full 
      text-xs font-medium
      border
      ${variants[status]}
    `}>
      {icons[status]}
      {children}
    </span>
  );
}
```

---

## 13. Tailwind Config Özeti

```javascript
// tailwind.config.js (Complete)
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ak-bg': '#0A1215',
        'ak-surface': '#0E1A1F',
        'ak-surface-2': '#142832',
        'ak-surface-3': '#1A3240',
        'ak-primary': '#07D1AF',
        'ak-primary-hover': '#06BF9F',
        'ak-primary-active': '#05AD8F',
        'ak-primary-muted': 'rgba(7, 209, 175, 0.1)',
        'ak-primary-border': 'rgba(7, 209, 175, 0.3)',
        'ak-text-primary': '#E5F0ED',
        'ak-text-secondary': '#8FA7A1',
        'ak-text-tertiary': '#5C7570',
        'ak-text-disabled': '#3A4B48',
        'ak-border': '#1F3338',
        'ak-border-focus': '#07D1AF',
        'ak-divider': '#152A2F',
        'ak-overlay': 'rgba(10, 18, 21, 0.85)',
        'ak-success': '#10B981',
        'ak-success-bg': 'rgba(16, 185, 129, 0.1)',
        'ak-success-border': 'rgba(16, 185, 129, 0.3)',
        'ak-warning': '#F59E0B',
        'ak-warning-bg': 'rgba(245, 158, 11, 0.1)',
        'ak-warning-border': 'rgba(245, 158, 11, 0.3)',
        'ak-error': '#EF4444',
        'ak-error-bg': 'rgba(239, 68, 68, 0.1)',
        'ak-error-border': 'rgba(239, 68, 68, 0.3)',
        'ak-info': '#3B82F6',
        'ak-info-bg': 'rgba(59, 130, 246, 0.1)',
        'ak-info-border': 'rgba(59, 130, 246, 0.3)',
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'ak-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'ak-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'ak-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'ak-glow': '0 0 24px rgba(7, 209, 175, 0.3)',
        'ak-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
```

---

## 14. Motion & Animation Tokens (Cursor UI Update)

**Güncelleme Notu:** Phase 10 - Cursor-inspired UI ile eklenen motion, glow ve blur tokenları.

### 14.1 Motion Duration Tokens

Animasyon sürelerini tutarlı tutmak için standart token'lar:

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ak-motion-fast` | `150ms` | Hover state'leri, micro-interactions |
| `--ak-motion-base` | `200ms` | Varsayılan geçişler |
| `--ak-motion-slow` | `300ms` | Modal/drawer açılışları |
| `--ak-motion-slower` | `500ms` | Sayfa geçişleri |

**CSS Implementation:**

```css
:root {
  --ak-motion-fast: 150ms;
  --ak-motion-base: 200ms;
  --ak-motion-slow: 300ms;
  --ak-motion-slower: 500ms;
}
```

### 14.2 Easing Functions

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ak-ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Genel geçişler (ease-in-out) |
| `--ak-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Giriş animasyonları |
| `--ak-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Çıkış animasyonları |

### 14.3 Glow Tokens

AKIS Liquid Neon efekti için glow token'ları:

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ak-glow-accent` | `0 0 24px rgba(7, 209, 175, 0.25)` | Primary buton hover, accent elementler |
| `--ak-glow-subtle` | `0 0 16px rgba(7, 209, 175, 0.12)` | Kart hover, hafif vurgu |
| `--ak-glow-edge` | `0 0 40px rgba(7, 209, 175, 0.08)` | Background blob'lar |

**Tailwind Extension:**

```javascript
boxShadow: {
  'ak-glow': '0 0 24px rgba(7, 209, 175, 0.25)',
  'ak-glow-sm': '0 0 16px rgba(7, 209, 175, 0.12)',
  'ak-glow-lg': '0 0 40px rgba(7, 209, 175, 0.3)',
}
```

### 14.4 Blur Tokens

Glassmorphism ve backdrop efektleri için:

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--ak-blur-backdrop` | `16px` | Header frosted glass, modal overlay |
| `--ak-blur-card` | `8px` | Kart blur efekti |
| `--ak-blur-blob` | `36px` | Background blob'ları |

### 14.5 Reduced Motion Kuralları

**Sistem Tercihi Desteği:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .liquid-blob {
    animation: none !important;
    opacity: 0.1 !important;
  }
}
```

**Manuel Toggle:**

localStorage'da `akis-reduced-motion` anahtarı ile kullanıcı tercihi saklanır:

```typescript
// Okuma
const reducedMotion = localStorage.getItem('akis-reduced-motion') === 'true';

// Yazma
localStorage.setItem('akis-reduced-motion', String(newValue));
```

### 14.6 Animation Best Practices

**Yapılması Gerekenler:**

- ✅ Yalnızca `transform` ve `opacity` animate edin (GPU-accelerated)
- ✅ `will-change` özelliğini ihtiyatlı kullanın
- ✅ Maksimum animasyon süresi: 500ms
- ✅ Arka plan animasyonları: 10-20 saniye döngü, çok hafif
- ✅ Her zaman `prefers-reduced-motion` kontrol edin

**Yapılmaması Gerekenler:**

- ❌ `width`, `height`, `top`, `left`, `margin`, `padding` animate etmeyin
- ❌ Ana içerik alanında döngüsel animasyonlar kullanmayın
- ❌ Yoğun JavaScript animation frame kullanmayın
- ❌ Canvas veya WebGL gerektiren efektler eklemeyin (OCI performans kısıtı)

### 14.7 Liquid Neon Background Kullanımı

Background blob'ları için standart yapılandırma:

| Blob | Boyut | Blur | Opacity | Animasyon Süresi |
|------|-------|------|---------|------------------|
| Primary | 384px | 40px | 0.15-0.20 | 20s |
| Secondary | 320px | 32px | 0.12-0.18 | 25s |
| Tertiary | 288px | 36px | 0.15-0.22 | 22s |
| Ambient | 256px | 28px | 0.10-0.15 | 28s |
| Edge | 224px | 28px | 0.08-0.12 | 30s |

**Responsive Blob Sayısı:**

- Desktop (lg+): 5 blob
- Tablet (md): 3 blob  
- Mobile (< md): 2 blob

---

## 15. Sonuç ve Kullanım Kılavuzu

Bu design system dokümanı, AKIS Platform'un tüm UI bileşenlerini, renk paletini, tipografiyi ve kullanım kurallarını tanımlar.

### Kullanım:
1. **Yeni component geliştirirken:** İlgili bölüme (Buttons, Inputs, Cards) bakın
2. **Renk seçiminde:** Semantic renkleri (ak-success, ak-error) tercih edin
3. **Spacing:** Tailwind spacing scale'ini (4, 6, 8) kullanın
4. **Accessibility:** Her zaman ARIA label'ları ve focus state'leri ekleyin

### Güncelleme:
- Design token'ları değişirse `tailwind.config.js` güncelleyin
- Yeni component pattern'leri bu dökümana ekleyin
- Tüm değişiklikleri git'e commit'leyin

**Bu doküman, frontend takımının referans rehberidir ve codebase ile senkron tutulmalıdır.**


