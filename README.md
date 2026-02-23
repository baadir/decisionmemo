# decision-memory

**Automatic decision logging for Claude Code.** Every architectural choice your AI assistant makes gets stored in a compact, token-efficient [TOON](https://github.com/toon-format/toon) file — and retrieved automatically when context is lost.

```
decisions[3]{id,ts,topic,decision,rationale,impact,tags}:
D001,2026-02-10T14:32Z,auth,"Use JWT RS256","HS256 needs shared secret across services",high,auth|security|jwt
D002,2026-02-11T09:15Z,database,"Use Postgres","Need concurrent writes; SQLite WAL insufficient",high,database|postgres
D003,2026-02-12T16:44Z,testing,"Use Vitest","ESM-native project; Jest ESM support is experimental",low,testing|vitest
```

## Why decision-memory?

- **Context loss is real.** Long sessions and session restarts mean Claude forgets why `JWT RS256` was chosen over `HS256` three days ago.
- **Re-discussing decided things wastes time.** Every re-debate costs tokens and slows development.
- **Decisions deserve a home.** Like `CHANGELOG.md` for architecture.

## How it works

1. **Auto-trigger**: A Claude Code hook fires after every `Write`/`Edit` operation, nudging Claude to log decisions automatically.
2. **Session start**: Claude calls `get_context_summary` to orient itself (~200 tokens).
3. **Before deciding**: Claude calls `search_decisions` to check prior decisions (~50-80 tokens/result).
4. **After deciding**: Claude calls `log_decision` to record the choice.

No manual intervention needed.

## Quickstart (Claude Code)

### 1. Copy integration files to your project

```bash
# Clone or download the repository
cp -r decision-memory/integrations/claude-code/.mcp.json ./
cp decision-memory/integrations/claude-code/CLAUDE.md ./
cp -r decision-memory/integrations/claude-code/.claude/ ./
```

### 2. Initialize DECISIONS.toon

```bash
npx decision-memory init
```

### 3. Start Claude Code

Claude will automatically:
- Call `get_context_summary` at session start
- Be nudged to call `log_decision` after file modifications
- Call `search_decisions` before making architectural choices

## MCP Server

The MCP server is the primary integration method. It exposes 4 tools:

| Tool | Description |
|---|---|
| `log_decision` | Log an architectural decision |
| `search_decisions` | Search past decisions by keyword/tag |
| `get_context_summary` | Get compact session-start summary |
| `update_decision` | Mark a prior decision as superseded |

## CLI

```bash
# Initialize
npx decision-memory init

# Log a decision
npx decision-memory log \
  --topic auth \
  --decision "Use JWT RS256" \
  --rationale "HS256 requires shared secret across services" \
  --impact high \
  --tags auth,security,jwt

# Search
npx decision-memory search --keywords jwt
npx decision-memory search --tags auth,security
npx decision-memory search --impact high

# Summary
npx decision-memory summary
```

## Why TOON format?

TOON (Token-Oriented Object Notation) uses **39% fewer tokens than JSON** for the same structured data. For a project with 50 decisions:

- JSON: ~4,250 tokens
- TOON: ~2,600 tokens
- Savings: **1,650 tokens per search** that's not consumed

## DECISIONS.toon schema

```
# decision-memory v1
project: <name>
created: YYYY-MM-DD
updated: YYYY-MM-DD

decisions[N]{id,ts,topic,decision,rationale,impact,tags}:
D001,YYYY-MM-DDTHH:MMZ,topic,"Decision text","Rationale text",impact,tag1|tag2

summary{total,high_impact,last_updated,top_topics}:
N,N,YYYY-MM-DD,topic1|topic2
```

**Fields:**
- `impact`: `low` | `medium` | `high` | `critical`
- `tags`: pipe-delimited (`auth|jwt|security`)
- Fields with commas are quoted: `"Use JWT, not sessions"`

## File location

Priority order:
1. `DECISION_MEMORY_FILE` environment variable
2. `./DECISIONS.toon` in current working directory ← **recommended**
3. `~/.decision-memory/global.toon` (fallback)

Commit `DECISIONS.toon` to git — it's a project artifact like `README.md`.

## Packages

| Package | Description |
|---|---|
| `@decision-memory/core` | TOON parse/write/search (zero dependencies) |
| `@decision-memory/mcp-server` | MCP server for Claude Code |
| `decision-memory` | CLI tool |

## Roadmap

- [x] Claude Code (MCP + hooks)
- [ ] Cursor (`.cursor/mcp.json`)
- [ ] VS Code + Cline (`.vscode/mcp.json`)
- [ ] Opencode (`opencode.json`)
- [ ] Semantic search (embeddings, opt-in)

## License

MIT
