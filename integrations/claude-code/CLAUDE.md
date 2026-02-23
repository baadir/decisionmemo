# Karar Hafızası (Decision Memory)

Bu proje `decision-memory` sistemini kullanmaktadır. Proje kararları `DECISIONS.toon` dosyasında saklanır.

## Oturum Başında

Her oturumun başında şu aracı çağır:

```
get_context_summary(include_recent=true)
```

Bu, önceki kararların kompakt özetini (~200 token) döndürür.

## Karar Almadan Önce

Mimari veya tasarım kararı vermeden önce:

```
search_decisions(keywords=["ilgili-konu"], tags=["ilgili-tag"])
```

Eğer daha önce aynı konuda karar alındıysa o karara uy veya `update_decision` ile güncelle.

## Karar Aldıktan Hemen Sonra

Önemli bir tercih yaptıktan sonra hemen kaydet:

```
log_decision(
  topic="konu",
  decision="Alınan somut karar",
  rationale="Neden bu tercih? Alternatifler neden elendi?",
  impact="high",
  tags=["tag1", "tag2"]
)
```

**Erteleme. Kararı o an kaydet.**

## Kaydedilmesi Gereken Kararlar

- Teknoloji/kütüphane seçimi (hangi DB, hangi auth, hangi framework)
- Mimari yaklaşım (REST vs GraphQL, monolith vs microservice)
- Güvenlik kararları (şifreleme yöntemi, token stratejisi)
- Veri modeli değişiklikleri (yeni tablo, field kaldırma/ekleme)
- API tasarım kararları (endpoint yapısı, versiyonlama stratejisi)
- Test stratejisi (hangi test framework, coverage hedefi)

## Kaydedilmemesi Gereken Şeyler

- Değişken isimlendirme, kod formatı
- Küçük refactorlar (mantık değişmiyorsa)
- Bug düzeltmeleri (mimari etkileri yoksa)
- Yorum ekleme, dokümantasyon güncellemeleri

## Önceki Karar Değiştiğinde

```
update_decision(
  supersedes_id="D003",
  topic="konu",
  decision="Yeni karar",
  rationale="Neden değişti?",
  impact="high",
  tags=["tag1"]
)
```
