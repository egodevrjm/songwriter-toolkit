# Songwriter Toolkit

This repository now includes an **LLM-ready corpus builder** that converts the markdown knowledge base in `Resources/` into structured JSONL chunks suitable for retrieval-augmented generation (RAG).

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
python3 tools/query_songwriting_corpus.py   --query "anthemic pop chorus about regret"   --genre pop   --topic hooks   --top-k 5   --emit-prompt
```

This enables immediate prototyping without any external vector DB.


## Web app: Songwriter

Run a full local web app backed by this corpus:

```bash
python3 webapp/server.py
```

Then open `http://localhost:8000` and provide:
- song goal/query
- optional genre filters (e.g. `pop,country`)
- optional topic filters (e.g. `hooks,lyrics`)

The app retrieves the best-matching corpus chunks and generates a structured songwriting draft (concept, titles, verse, chorus, rewrite note) with source-backed matches.

## SongForge MCP server

SongForge can also run as a Vercel-hosted MCP server. The MCP layer is intentionally not the songwriter: it is the structured memory, retrieval, template, validation and scoring toolkit that a creative LLM can call while remaining the artist/collaborator.

### Local development

Install dependencies and run the Next.js app:

```bash
npm install
npm run dev
```

The local MCP endpoint is:

```text
http://localhost:3000/api/mcp
```

A small health/discovery response is available with:

```bash
curl http://localhost:3000/api/mcp
```

The existing Python corpus tooling remains available:

```bash
python3 tools/build_songwriting_corpus.py
python3 tools/query_songwriting_corpus.py --query "anthemic pop chorus about regret" --genre pop --top-k 5 --emit-prompt
```

### Build and typecheck

```bash
npm run typecheck
npm run build
npm run verify:mcp
```

`npm run verify:mcp` exercises these v1 checks:

1. “Write a dark synthpop song about nostalgia with a huge chorus.”
2. “Create a Suno Styles prompt for boom bap drums, orchestral trance and symphonic black metal.”
3. “Critique this chorus: I miss you every night / I can’t find the light / I need you by my side / Everything will be alright.”
4. “Turn this lyric idea into Afrobeats heartbreak.”

### Vercel deployment

Deploy the repo as a standard Next.js project on Vercel. No secrets are required for v1.

Recommended settings:

- Framework preset: `Next.js`
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: `.next`
- Node.js: `20.x` or newer

After deployment, the public MCP endpoint should be:

```text
https://YOUR-VERCEL-PROJECT.vercel.app/api/mcp
```

### Connecting in ChatGPT

Use the deployed `/api/mcp` URL as the custom MCP server endpoint in ChatGPT’s connector/app setup. The server exposes focused tools rather than one vague `ask_songforge` tool.

### MCP methods

The endpoint supports JSON-RPC-style MCP calls over HTTP:

- `initialize`
- `tools/list`
- `tools/call`

Example `tools/list` call:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Example tool call:

```bash
curl -X POST http://localhost:3000/api/mcp \
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
        "top_k": 5
      }
    }
  }'
```

### v1 tools

- `songforge_retrieve_context`
- `songforge_get_output_template`
- `songforge_get_genre_playbook`
- `songforge_get_suno_style_cards`
- `songforge_validate_suno_prompt`
- `songforge_score_lyrics`

All tools are stateless and return compact structured JSON designed for LLM use.
