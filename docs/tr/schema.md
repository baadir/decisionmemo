# TOON Şema Referansı

## Dosya Yapısı

```
# decision-memory v1          ← Yorum satırı (isteğe bağlı)
project: proje-adi            ← Meta: proje adı
version: 1                    ← Meta: şema versiyonu
created: 2026-02-23           ← Meta: oluşturma tarihi
updated: 2026-02-23           ← Meta: son güncelleme

decisions[N]{...}:            ← Karar tablosu başlığı
D001,...                      ← Karar satırları

summary{...}:                 ← Özet bloğu (otomatik güncellenir)
...
```

## Karar Tablosu Başlığı

```
decisions[14]{id,ts,topic,decision,rationale,impact,tags}:
```

- `14` = toplam karar sayısı (otomatik güncellenir)
- Alanlar sabit sırada olmalıdır

## Karar Satırı Alanları

| Alan | Format | Örnek | Açıklama |
|---|---|---|---|
| `id` | D001-D999, DA00+ | `D001` | Otomatik üretilir |
| `ts` | ISO8601 UTC | `2026-02-10T14:32Z` | Dakika hassasiyeti |
| `topic` | kebab-case | `api-design` | Konu kategorisi |
| `decision` | string | `"JWT RS256 kullan"` | Alınan somut karar |
| `rationale` | string | `"HS256 shared secret gerektirir"` | Gerekçe |
| `impact` | enum | `high` | Etki seviyesi |
| `tags` | pipe-delimited | `auth\|jwt\|security` | Arama etiketleri |

## Impact Seviyeleri

| Seviye | Kullanım Alanı | Örnekler |
|---|---|---|
| `low` | Stil, araç seçimi | Test framework, linter kuralları |
| `medium` | Özellik tasarımı | API endpoint yapısı, UI bileşeni |
| `high` | Mimari kararlar | Veritabanı seçimi, auth stratejisi |
| `critical` | Güvenlik, veri | Şifreleme yöntemi, veri saklama |

## Alıntılama Kuralları

Virgül içeren alanlar çift tırnak içine alınır:

```
D001,...,"JWT RS256 kullan, HS256 değil","HS256 shared secret gerektirir, RS256 gerektirmez",...
```

Çift tırnak içindeki kaçış karakterleri:

| Karakter | Kodlama |
|---|---|
| `"` | `\"` |
| `\` | `\\` |
| Yeni satır | `\n` |

## Summary Bloğu

Dosyanın sonunda otomatik güncellenen özet:

```
summary{total,high_impact,last_updated,top_topics}:
14,5,2026-02-23,auth|database|api-design
```

- `total`: toplam karar sayısı
- `high_impact`: high + critical karar sayısı
- `last_updated`: son karar tarihi
- `top_topics`: en çok tekrarlayan konular (ilk 5)

## ID Üretim Kuralı

```
1-999    → D001, D002, ..., D999
1000+    → D (4 haneli base-36 kodlama)
```

Pratikte 999 karar sınırına nadiren ulaşılır (bir projede bu çok fazladır).

## Örnek Tam Dosya

```
# decision-memory v1
project: e-ticaret-api
version: 1
created: 2026-01-15
updated: 2026-02-23

decisions[5]{id,ts,topic,decision,rationale,impact,tags}:
D001,2026-01-15T10:00Z,database,"PostgreSQL kullan","ACID garantisi gerekiyor, yatay ölçekleme olmadan yeterli",high,database|postgres|sql
D002,2026-01-16T14:30Z,auth,"JWT RS256 kullan","Stateless, servisler arası doğrulama kolay; HS256 shared secret sorunlu",high,auth|jwt|security
D003,2026-01-20T09:15Z,api,"REST kullan GraphQL değil","Karmaşıklık getirisi yok; v1 için REST yeterli",medium,api|rest|architecture
D004,2026-01-25T11:00Z,testing,"Vitest kullan","ESM-native proje; Jest ESM desteği experimental",low,testing|vitest|tooling
D005,2026-02-10T16:00Z,caching,"Redis kullan","Session store ve cache için; in-memory yeterli değil",high,caching|redis|performance

summary{total,high_impact,last_updated,top_topics}:
5,3,2026-02-10,database|auth|api|caching|testing
```
