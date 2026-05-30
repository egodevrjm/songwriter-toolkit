# Songwriter Toolkit

This repository includes an **LLM-ready corpus builder** that converts the markdown knowledge base in `Resources/` into structured JSONL chunks suitable for retrieval-augmented generation (RAG).

It also includes **SongForge MCP**, a minimal Next.js/TypeScript server intended for Vercel hosting. SongForge is designed as a structured memory/toolkit layer for ChatGPT: retrieval, genre playbooks, output templates, Suno prompt helpers, validators, and lyric scoring. The MCP server should not be treated as the final songwriter; the host LLM remains the creative reasoning and composition layer.

## Build the corpus

```bash
python3 tools/build_songwriting_corpus.py
```

Outputs:
- `data/songwriting_corpus.jsonl` — one chunk per line, with metadata.
- `data/songwriting_manifest.json` — dataset stats + schema fields.

## Chunk schema

Each JSONL row contains:
- `id`: deterministic short hash id
- `source`: path to original markdown file
- `source_file`: source filename
- `heading`: markdown heading for the chunk (if present)
- `genres`: inferred genre tags
- `topics`: inferred topic tags
- `word_count`: words in the chunk
- `text`: chunk body text

## Why this helps

- Converts static notes into retrieval-friendly records.
- Enables cross-genre prompting using `genres` + `topics` filters.
- Produces deterministic ids for easier indexing/versioning.

## Tuning

Adjust chunk size:

```bash
python3 tools/build_songwriting_corpus.py --max-words 300
```

Set custom paths:

```bash
python3 tools/build_songwriting_corpus.py \
  --resources-dir Resources \
  --out-jsonl data/songwriting_corpus.jsonl \
  --out-manifest data/songwriting_manifest.json
```

## New foundational resources

- `Resources/Songwriting Playbook - Cross Genre.md` provides practical cross-genre writing systems for hooks, melody, lyrics, harmony, arrangement, rewrites, and LLM prompt templates.
- `Resources/External Songwriting Guide Integrations.md` distills external songwriting guides and repository patterns into reusable exercises, workflows, and prompt templates.

## Query the corpus (MVP retrieval)

Use local retrieval to find relevant songwriting chunks and optionally generate an LLM-ready prompt pack:

```bash
python3 tools/query_songwriting_corpus.py \
  --query "anthemic pop chorus about regret" \
  --genre pop \
  --topic hooks \
  --top-k 5 \
  --emit-prompt
```

This enables immediate prototyping without any external vector DB.

## Web app: Songwriter

Run the existing local Python web app backed by this corpus:

```bash
python3 webapp/server.py
```

Then open `http://localhost:8000` and provide:
- song goal/query
- optional genre filters (e.g. `pop,country`)
- optional topic filters (e.g. `hooks,lyrics`)

The app retrieves the best-matching corpus chunks and generates a structured songwriting draft with source-backed matches.

## SongForge MCP server

The Vercel-ready MCP layer lives in:

- `app/api/mcp/route.ts` — JSON-RPC MCP endpoint
- `lib/songforge/schemas.ts` — Zod input schemas and JSON schema metadata
- `lib/songforge/corpus.ts` — stateless JSONL corpus loading and keyword/topic/genre retrieval
- `lib/songforge/templates.ts` — task-specific response templates
- `lib/songforge/playbooks.ts` — compact genre playbooks
- `lib/songforge/suno.ts` — Suno style card builder and prompt validator
- `lib/songforge/scoring.ts` — lyric scoring helper
- `lib/songforge/tools.ts` — tool definitions and dispatcher

The public MCP endpoint path is:

```text
/api/mcp
```

Use the full deployed URL in ChatGPT, for example:

```text
https://YOUR_PROJECT.vercel.app/api/mcp
```

### MCP tools

V1 exposes focused tools, not a single vague `ask_songforge` tool:

1. `songforge_retrieve_context`
2. `songforge_get_output_template`
3. `songforge_get_genre_playbook`
4. `songforge_get_suno_style_cards`
5. `songforge_validate_suno_prompt`
6. `songforge_score_lyrics`

### Local dev

```bash
npm install
npm run dev
```

Then check the endpoint:

```bash
curl http://localhost:3000/api/mcp
```

List tools with JSON-RPC:

```bash
curl -s http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Call retrieval:

```bash
curl -s http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "songforge_retrieve_context",
      "arguments": {
        "task": "new_song",
        "query": "Write a dark synthpop song about nostalgia with a huge chorus.",
        "genres": ["synthpop", "pop"],
        "topics": ["hooks", "structure"],
        "top_k": 5
      }
    }
  }'
```

### Build and verification

```bash
npm run typecheck
npm run build
npm run verify:mcp
```

`npm run verify:mcp` exercises these example requests:

1. “Write a dark synthpop song about nostalgia with a huge chorus.”
2. “Create a Suno Styles prompt for boom bap drums, orchestral trance and symphonic black metal.”
3. “Critique this chorus: I miss you every night / I can’t find the light / I need you by my side / Everything will be alright.”
4. “Turn this lyric idea into Afrobeats heartbreak.”

### Vercel deploy

This project needs no secrets for v1 because it reads committed corpus data and keeps tools stateless.

Deploy with Vercel Git integration by importing/linking this GitHub repository as a Next.js project, or from a checked-out project root:

```bash
vercel deploy
```

Production deployments should expose:

```text
https://YOUR_PROJECT.vercel.app/api/mcp
```

If ChatGPT rejects the endpoint because it requires a newer streamable MCP transport, keep the same tool modules and replace only `app/api/mcp/route.ts` with an official MCP SDK transport adapter.

### Connect in ChatGPT

1. Deploy the app on Vercel.
2. Copy the production or preview endpoint URL ending in `/api/mcp`.
3. In ChatGPT, add a custom MCP connector/server using that URL.
4. Confirm `tools/list` shows the six SongForge tools.
5. Use SongForge as the memory/toolkit layer and let ChatGPT remain the creative songwriter.
