#!/usr/bin/env python3
"""Simple local retrieval over data/songwriting_corpus.jsonl.

Usage:
  python3 tools/query_songwriting_corpus.py --query "anthemic pop chorus about regret" --genre pop --top-k 5
"""
from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path

TOKEN_RE = re.compile(r"\b[a-zA-Z0-9']+\b")


@dataclass
class Entry:
    id: str
    source: str
    heading: str | None
    genres: list[str]
    topics: list[str]
    text: str


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


def load_entries(path: Path) -> list[Entry]:
    entries: list[Entry] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        row = json.loads(line)
        entries.append(
            Entry(
                id=row["id"],
                source=row["source"],
                heading=row.get("heading"),
                genres=row.get("genres", []),
                topics=row.get("topics", []),
                text=row["text"],
            )
        )
    return entries


def rank(entries: list[Entry], query: str) -> list[tuple[float, Entry]]:
    q_tokens = tokenize(query)
    if not q_tokens:
        return []

    doc_tokens = [tokenize(e.text) for e in entries]
    df = defaultdict(int)
    for toks in doc_tokens:
        for tok in set(toks):
            df[tok] += 1

    n_docs = len(entries)
    q_counts = Counter(q_tokens)

    scores: list[tuple[float, Entry]] = []
    for entry, toks in zip(entries, doc_tokens):
        tf = Counter(toks)
        length_norm = math.sqrt(max(1, len(toks)))
        score = 0.0
        for tok, qtf in q_counts.items():
            if tok not in tf:
                continue
            idf = math.log((n_docs + 1) / (df[tok] + 1)) + 1.0
            score += (tf[tok] / length_norm) * idf * qtf
        if score > 0:
            scores.append((score, entry))

    scores.sort(key=lambda x: x[0], reverse=True)
    return scores


def build_prompt(query: str, hits: list[tuple[float, Entry]]) -> str:
    context_blocks = []
    for i, (score, entry) in enumerate(hits, start=1):
        block = (
            f"[{i}] source={entry.source} heading={entry.heading or 'n/a'} "
            f"genres={','.join(entry.genres)} topics={','.join(entry.topics)} score={score:.3f}\n"
            f"{entry.text.strip()}"
        )
        context_blocks.append(block)

    return (
        "You are a songwriting assistant. Use only the provided context as primary guidance.\n\n"
        f"User goal: {query}\n\n"
        "Context:\n"
        + "\n\n---\n\n".join(context_blocks)
        + "\n\nReturn:\n"
        "1) Song concept in one sentence\n"
        "2) 6 title options\n"
        "3) Verse 1 + Chorus draft\n"
        "4) One rewrite note based on prosody and hook strength\n"
        "5) Citations as [index] where used"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--query", required=True)
    parser.add_argument("--corpus", type=Path, default=Path("data/songwriting_corpus.jsonl"))
    parser.add_argument("--genre", action="append", default=[])
    parser.add_argument("--topic", action="append", default=[])
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--emit-prompt", action="store_true")
    args = parser.parse_args()

    entries = load_entries(args.corpus)

    if args.genre:
        gset = {g.lower() for g in args.genre}
        entries = [e for e in entries if gset.intersection({x.lower() for x in e.genres})]

    if args.topic:
        tset = {t.lower() for t in args.topic}
        entries = [e for e in entries if tset.intersection({x.lower() for x in e.topics})]

    hits = rank(entries, args.query)[: args.top_k]
    if not hits:
        print("No matches found. Try broader query or remove filters.")
        return

    print(f"Top {len(hits)} matches for: {args.query}\n")
    for i, (score, entry) in enumerate(hits, start=1):
        print(f"{i}. score={score:.3f} id={entry.id}")
        print(f"   source={entry.source}")
        print(f"   heading={entry.heading or 'n/a'}")
        print(f"   genres={','.join(entry.genres)} topics={','.join(entry.topics)}")
        preview = " ".join(entry.text.split())[:240]
        print(f"   preview={preview}...")

    if args.emit_prompt:
        print("\n=== PROMPT PACK ===\n")
        print(build_prompt(args.query, hits))


if __name__ == "__main__":
    main()
