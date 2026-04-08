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

