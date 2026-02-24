# decision-memory

[![npm](https://img.shields.io/npm/v/decision-memory)](https://www.npmjs.com/package/decision-memory)

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
- **Decisions deserve a home — and so do code changes.** `DECISIONS.toon` is the single source of truth for both architectural choices and code-level changelog.

## How it works

1. **Auto-trigger**: A Claude Code hook fires after every `Write`/`Edit` operation, nudging Claude to log decisions automatically.
2. **Session start**: Claude calls `get_context_summary` to orient itself (~200 tokens).
3. **Before deciding**: Claude calls `search_decisions` to check prior decisions (~50-80 tokens/result).
4. **After deciding**: Claude calls `log_decision` to record the choice, or `log_change` to record a code-level change (file added/modified/removed/refactored).

No manual intervention needed.

## Quickstart (Claude Code)

```bash
npx decision-memory init
```

This single command:
- Creates `DECISIONS.toon` in your project root
- Copies `.mcp.json` (MCP server config)
- Copies `CLAUDE.md` (session-start instructions for Claude)
- Copies `.claude/hooks/` (auto-trigger hook)
- Updates `.gitattributes`

Then restart Claude Code — the MCP server connects automatically.

### Start Claude Code

Claude will automatically:
- Call `get_context_summary` at session start
- Be nudged to call `log_decision` after file modifications
- Call `search_decisions` before making architectural choices

## MCP Server

The MCP server is the primary integration method. It exposes 5 tools:

| Tool | Description |
|---|---|
| `log_decision` | Log an architectural decision |
| `search_decisions` | Search past decisions by keyword/tag |
| `get_context_summary` | Get compact session-start summary |
| `update_decision` | Mark a prior decision as superseded |
| `log_change` | Log a code change (added/modified/removed/refactored) |

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

changes[N]{id,ts,file,type,description}:
C001,YYYY-MM-DDTHH:MMZ,src/auth/login.ts,added,"Initial JWT login handler"

summary{total,high_impact,last_updated,top_topics}:
N,N,YYYY-MM-DD,topic1|topic2
```

**Decision fields:**
- `impact`: `low` | `medium` | `high` | `critical`
- `tags`: pipe-delimited (`auth|jwt|security`)
- Fields with commas are quoted: `"Use JWT, not sessions"`

**Change fields:**
- `type`: `added` | `modified` | `removed` | `refactored`
- Change IDs: `C001`, `C002`... (separate sequence from decisions)

## File location

Priority order:
1. `DECISION_MEMORY_FILE` environment variable
2. `./DECISIONS.toon` in current working directory ← **recommended**
3. `~/.decision-memory/global.toon` (fallback)

Commit `DECISIONS.toon` to git — it's a project artifact like `README.md`.

## Package

Single npm package — CLI and MCP server in one:

```bash
npm install -g decision-memory   # CLI
npx decision-memory init         # run without installing
```

The MCP server binary (`decision-memory-mcp`) is included in the same package and started automatically via `.mcp.json`.

## How does this compare to Claude Code's MEMORY.md?

Claude Code has three places where context lives. They don't overlap — they complement each other:

| | `MEMORY.md` | `CLAUDE.md` | `DECISIONS.toon` |
|---|---|---|---|
| **Written by** | Claude (auto-generated) | You (human) | Claude (via MCP tool) |
| **Contains** | Discoveries, patterns, debugging notes | Behavioral rules & instructions | Architectural decisions with rationale |
| **Searchable** | No | No | Yes — keyword + tag search |
| **Location** | `~/.claude/projects/.../memory/` | Project root | Project root |
| **Format** | Markdown | Markdown | TOON (39% fewer tokens) |

**In plain terms:**
- MEMORY.md is Claude's personal notebook ("I noticed this codebase uses X pattern")
- CLAUDE.md is your instruction manual for Claude ("always call get_context_summary at start")
- DECISIONS.toon is the project's architecture log ("we chose Postgres over SQLite because...")

All three can be active at once. decision-memory adds the one thing neither MEMORY.md nor CLAUDE.md provides: **searchable, structured, rationale-rich decision history**.

## Compatibility

decision-memory is compatible with any other MCP server or Claude Code tool. It only reads and writes `DECISIONS.toon` — it does not interfere with other tools.

**Execution order when Claude Code starts:**
1. `.mcp.json` is read → all MCP servers start (including decision-memory)
2. `CLAUDE.md` is added to the system prompt
3. Session begins — Claude calls `get_context_summary` per instructions

Other MCP tools (context-mode, etc.) run in parallel with decision-memory. There is no conflict because each MCP server handles its own tools independently.

## Roadmap

- [x] Claude Code (MCP + hooks)
- [ ] Cursor (`.cursor/mcp.json`)
- [ ] VS Code + Cline (`.vscode/mcp.json`)
- [ ] Opencode (`opencode.json`)
- [ ] Semantic search (embeddings, opt-in)

## License

MIT
