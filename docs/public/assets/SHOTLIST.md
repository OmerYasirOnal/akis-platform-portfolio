# Ekran Görüntüsü Listesi

> Public portfolio deposu için önerilen ekran görüntüleri.
> Cursor bunları alamaz — staging.akisflow.com adresinden manuel olarak çekin.

## Nasıl Çekilir

1. [staging.akisflow.com](https://staging.akisflow.com) adresini Chrome'da aç
2. Tutarlılık için viewport'u **1440×900** (masaüstü) olarak ayarla
3. Mobil çekimler için DevTools → Device toolbar kullan
4. PNG olarak kaydet, maksimum genişlik 1200px, dosya başına < 500KB
5. **Private** depodaki `docs/public/assets/` dizinine yerleştir
6. Public snapshot'a dahil etmek için `./scripts/public-repo/export.sh` çalıştır

## Çekim Listesi

| # | Dosya Adı | Ne Çekilecek | Sayfa/Rota |
|---|-----------|-------------|------------|
| 1 | `landing-hero.png` | Landing sayfa hero bölümü: logo, başlık ve CTA butonları | `/` |
| 2 | `landing-capabilities.png` | Yetenek kartları bölümü (4 kart: Ajanlar, Orkestrasyon, Kalite, MCP) | `/` (aşağı kaydır) |
| 3 | `signup-onboarding.png` | Kayıt formu veya onboarding ilk adımı | `/signup` |
| 4 | `oauth-login.png` | GitHub + Google OAuth butonları ile giriş sayfası | `/login` |
| 5 | `dashboard-overview.png` | Getting Started kartı ve son işlerle ana dashboard | `/dashboard` |
| 6 | `agent-console-scribe.png` | Scribe ajan konsolu — tercihen SSE timeline ile çalışırken | `/agents/scribe` |
| 7 | `job-detail-timeline.png` | Adım timeline'ı + plan görünümü ile iş detay sayfası | `/dashboard/jobs/:id` |
| 8 | `agent-hub.png` | 3 ajan kartını gösteren Ajanlar Hub sayfası | `/agents` |

## Opsiyonel (olsa iyi olur)

| # | Dosya Adı | Ne Çekilecek |
|---|-----------|-------------|
| 9 | `demo.gif` | Animasyonlu GIF: Scribe başlat → SSE izle → PR bağlantısı gör (~15sn) |
| 10 | `mobile-dashboard.png` | Mobil viewport'ta (375×812) dashboard |
| 11 | `dark-light-comparison.png` | Yan yana koyu/açık tema karşılaştırması |

## Çekimden Sonra

1. Hassas veri görünmediğini doğrula (e-postalar, token'lar, özel depolar)
2. Gerçek kullanıcı verisi varsa bulanıklaştır veya kırp
3. Private depoya commit et: `git add docs/public/assets/ && git commit -m "docs: portföy ekran görüntüleri eklendi"`
4. Export'u tekrar çalıştır: `./scripts/public-repo/export.sh`
5. Güncellenmiş public depoyu push et
