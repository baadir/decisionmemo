# Kurulum Kılavuzu — Claude Code

## Ön Gereksinimler

- Node.js 20+
- Claude Code

## Adım 1: Entegrasyon Dosyalarını Kopyala

Proje kökünüze şu dosyaları kopyalayın:

```
.mcp.json                    ← MCP server bağlantısı
CLAUDE.md                    ← Claude davranış talimatları
.claude/
  settings.json              ← Hook konfigürasyonu
  hooks/
    decision-nudge.js        ← Otomatik tetikleme
```

`integrations/claude-code/` klasöründen kopyalabilirsiniz:

```bash
cp integrations/claude-code/.mcp.json ./
cp integrations/claude-code/CLAUDE.md ./
cp -r integrations/claude-code/.claude/ ./
```

## Adım 2: DECISIONS.toon Oluştur

```bash
npx decision-memory init
```

Bu komut:
- `DECISIONS.toon` dosyasını proje kökünde oluşturur
- `.gitattributes` dosyasına LF satır sonu kaydı ekler

## Adım 3: DECISIONS.toon'u Git'e Ekle

```bash
git add DECISIONS.toon .gitattributes
git commit -m "chore: decision-memory entegrasyonu"
```

## Adım 4: Claude Code'u Başlat

Claude Code otomatik olarak MCP server'a bağlanır ve:
- Oturum başında `get_context_summary` çağırır
- Her dosya değişikliğinden sonra karar logu için uyarılır
- Mimari kararlar için `search_decisions` çağırır

## Doğrulama

Claude Code'da şunu yazın:
```
summary karar dosyamı göster
```

Claude `get_context_summary` çağırmalı ve TOON formatında özet döndürmelidir.

## DECISIONS.toon Yapısı

```
# decision-memory v1
project: proje-adınız
created: 2026-02-23
updated: 2026-02-23

decisions[0]{id,ts,topic,decision,rationale,impact,tags}:

summary{total,high_impact,last_updated,top_topics}:
0,0,2026-02-23,
```

---

## Manuel Karar Ekleme (CLI)

```bash
npx decision-memory log \
  --topic auth \
  --decision "JWT RS256 kullan" \
  --rationale "Private key tek serviste kalır" \
  --impact high \
  --tags auth,jwt,security
```

## Arama

```bash
# Keyword ile
npx decision-memory search --keywords jwt

# Tag ile
npx decision-memory search --tags auth,security

# Impact filtresi ile
npx decision-memory search --impact high
```

## Özet Görüntüleme

```bash
npx decision-memory summary
```

Çıktı örneği:
```
summary{total,high_impact,last_updated,top_topics}:
5,3,2026-02-23,auth|database|api

recent_high_impact[3]{id,ts,topic,decision,impact}:
D005,2026-02-23T14:32Z,api,"REST kullan GraphQL değil",high
D002,2026-02-20T09:15Z,database,Postgres kullan,high
D001,2026-02-18T11:00Z,auth,JWT RS256 kullan,high
```
