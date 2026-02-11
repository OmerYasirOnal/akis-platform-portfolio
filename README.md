```markdown
---

# AKIS Platform

**Yazılım Geliştirme için Yapay Zeka Ajan Orkestrasyon Sistemi**

> 🌐 [English version → README.en.md](README.en.md)

AKIS, tekrarlayan yazılım mühendisliği görevlerini — dokümantasyon, test planlaması ve prototipleme — otonom yapay zeka ajanları aracılığıyla otomatikleştirir. Çıktılar GitHub pull request olarak teslim edilir.

**Canlı Demo:** [staging.akisflow.com](https://staging.akisflow.com)

### Ekran Görüntüleri

| Landing Sayfası | Giriş (OAuth) | Kayıt |
|:---:|:---:|:---:|
| ![Landing](docs/public/assets/landing-hero.png) | ![Login](docs/public/assets/oauth-login.png) | ![Signup](docs/public/assets/signup-onboarding.png) |

---

## Problem

Yazılım ekipleri tekrarlayan görevlere önemli zaman harcıyor: dokümantasyonu güncel tutmak, test planları yazmak ve şablon kod oluşturmak. Bu görevler tanımlı, kalıp tabanlı ve otomasyona uygun — ancak mevcut yapay zeka araçlarının çoğu satır içi kod tamamlamaya odaklanıyor, uçtan uca görev otomasyonuna değil.

## Çözüm

AKIS, her ajanın şu adımları izlediği **yapısal bir ajan orkestrasyon çerçevesi** sunar:
1. **Planla** — Kod tabanını analiz eder ve yürütme planı oluşturur
2. **Yürüt** — Görevi belirleyici (deterministic) prompt'larla gerçekleştirir
3. **Yansıt** — Çıktı kalitesini kritik adımıyla değerlendirir
4. **Teslim et** — Sonucu GitHub pull request olarak commit eder

---

## Ajanlar

| Ajan | Görevi | Girdi | Çıktı |
|------|--------|-------|-------|
| **Scribe** | Teknik dokümantasyon üretimi | GitHub repo + branch | Markdown belgeler → PR |
| **Trace** | Edge case'li test planı oluşturma | Kod modülü/dizini | Test plan belgesi → PR |
| **Proto** | Çalışan prototip iskelesi kurma | Spec/fikir açıklaması | Kod iskelesi → PR |

---

## Mimari

```
React SPA → Caddy (auto-TLS) → Fastify API → PostgreSQL
                                     ↓
                              AgentOrchestrator
                              (FSM yaşam döngüsü)
                                     ↓
                              MCP Gateway → GitHub API
```

### Temel Teknik Kararlar

- **Modüler monolit** — Kısıtlı altyapı için optimize edilmiş tek dağıtılabilir backend (OCI Free Tier ARM64 VM)
- **MCP Protokolü** — Tüm harici servis erişimi Model Context Protocol adaptörleri üzerinden. Doğrudan vendor SDK'ları yok (Octokit vb.)
- **Orkestratör kalıbı** — Merkezi `AgentOrchestrator` tüm ajan yaşam döngüsünü yönetir. Ajanlar izole çalışır, birbirini çağırmaz.
- **FSM durum makinesi** — Her iş `pending → running → completed | failed` akışını izler, tam trace kaydıyla
- **Sözleşme tabanlı ajanlar** — Her ajanın tipli Contract + Playbook'u var. Prompt'lar belirleyicidir (temperature=0).
- **Bağlam paketleri** — Ajan başına token/dosya limitleriyle derlenen statik dosya paketleri. Hata ayıklanabilir ve tekrarlanabilir.

### Teknoloji Yığını

| Bileşen | Teknoloji |
|---------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Fastify + TypeScript (strict mode) |
| Veritabanı | PostgreSQL 16 + Drizzle ORM |
| AI | OpenAI / OpenRouter (kullanıcı anahtarları, AES-256-GCM şifreli) |
| Kimlik Doğrulama | JWT (HTTP-only cookie) + Email/Şifre + OAuth (GitHub, Google) |
| CI/CD | GitHub Actions (typecheck + lint + build + test her PR'da) |
| Deploy | Docker Compose + Caddy (auto-HTTPS), OCI ARM64 |

---

## Proje Metrikleri

| Metrik | Değer |
|--------|-------|
| Otomatik testler | **1.344** (797 backend + 547 frontend) |
| Test dosyaları | 106 (birim, bileşen, E2E) |
| Kaynak dosyalar | 322 TypeScript/TSX |
| Kod satırı | ~58.000 |
| API endpoint | ~89 |
| i18n çeviri anahtarı | ~500 (İngilizce + Türkçe) |
| Kalite kapısı | 4 (typecheck, lint, build, test) — hepsi yeşil |
| Staging smoke testleri | 12/12 geçiyor |

---

## Yerel Kurulum

```bash
git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
cd akis-platform-portfolio

# Kurulum
pnpm install

# Backend
cp backend/.env.example backend/.env
pnpm -C backend dev

# Frontend
pnpm -C frontend dev
# → http://localhost:5173
```

---

## Testler

```bash
# Tam kalite kapısı (CI'ın her PR'da çalıştırdığı)
pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test

# 797 backend testi
pnpm -C backend test:unit

# 547 frontend testi
pnpm -C frontend test
```

---

## Hakkında

**Ömer Yasir Önal** tarafından İstanbul Fatih Sultan Mehmet Vakıf Üniversitesi bitirme tezi olarak geliştirilmiştir (2025-2026).

**Tez Sorusu:** *Yapısal bir yapay zeka ajan orkestrasyon çerçevesi, otomatik inceleme ve kritik hatları aracılığıyla çıktı kalitesini korurken, dokümantasyon, test ve prototipleme görevlerinde geliştirici üretkenliğini artırabilir mi?*

### Yaklaşım
- **Tasarım Bilimi Araştırması (DSR)** metodolojisi
- 4 ay boyunca 7 fazda iteratif geliştirme
- Staging ortamında gerçek kullanıcılarla pilot değerlendirme
- Nicel metrikler: görev tamamlanma süresi, çıktı kalite puanları, test kapsama oranı

---

## Lisans

MIT

```
```