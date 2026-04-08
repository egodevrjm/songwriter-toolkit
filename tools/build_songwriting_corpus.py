#!/usr/bin/env python3
"""Build an LLM-ready songwriting corpus from markdown resources.

Outputs:
- data/songwriting_corpus.jsonl
- data/songwriting_manifest.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


SECTION_RE = re.compile(r"^#{1,6}\s+", re.MULTILINE)
WORD_RE = re.compile(r"\b\w+\b")
GENRES = {"country", "pop", "hiphop", "rock", "jazz", "edm"}
TOPIC_HINTS = {
    "lyrics": "lyrics",
    "harmony": "harmony",
    "instrumentation": "instrumentation",
    "structure": "structure",
    "flow": "flow",
    "hook": "hooks",
    "producer": "producer-insights",
    "prosody": "prosody",
    "rhyme": "rhyming",
    "melody": "melody",
    "habit": "workflow-habits",
    "co-writing": "co-writing",
    "prompt": "prompting",
}


@dataclass
class Chunk:
    text: str
    heading: str | None


def detect_genres(path: Path, text: str) -> list[str]:
    haystack = f"{path.as_posix()}\n{text}".lower()
    found = sorted(g for g in GENRES if g in haystack)
    return found or ["general"]


def detect_topics(path: Path, text: str) -> list[str]:
    haystack = f"{path.name}\n{text[:2500]}".lower()
    topics = sorted({value for key, value in TOPIC_HINTS.items() if key in haystack})
    return topics or ["general"]


def normalize(text: str) -> str:
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_sections(text: str) -> list[Chunk]:
    text = normalize(text)
    if not text:
        return []

    headings = list(SECTION_RE.finditer(text))
    if not headings:
        return [Chunk(text=text, heading=None)]

    chunks: list[Chunk] = []
    for i, match in enumerate(headings):
        start = match.start()
        end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
        segment = text[start:end].strip()
        first_line = segment.splitlines()[0].strip()
        heading = SECTION_RE.sub("", first_line).strip() or None
        chunks.append(Chunk(text=segment, heading=heading))

    return chunks


def split_oversized(chunk: Chunk, max_words: int) -> list[Chunk]:
    words = WORD_RE.findall(chunk.text)
    if len(words) <= max_words:
        return [chunk]

    paras = [p.strip() for p in chunk.text.split("\n\n") if p.strip()]
    out: list[Chunk] = []
    current: list[str] = []
    current_words = 0

    for para in paras:
        w = len(WORD_RE.findall(para))
        if current and current_words + w > max_words:
            out.append(Chunk(text="\n\n".join(current), heading=chunk.heading))
            current = []
            current_words = 0
        current.append(para)
        current_words += w

    if current:
        out.append(Chunk(text="\n\n".join(current), heading=chunk.heading))

    return out


def iter_markdown_files(resources_dir: Path) -> Iterable[Path]:
    yield from sorted(resources_dir.rglob("*.md"))


def make_chunk_id(source: str, idx: int, text: str) -> str:
    raw = f"{source}:{idx}:{text[:200]}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()[:16]


def build_corpus(resources_dir: Path, max_words: int) -> tuple[list[dict], dict]:
    entries: list[dict] = []
    file_counts: dict[str, int] = {}

    for md_file in iter_markdown_files(resources_dir):
        raw = md_file.read_text(encoding="utf-8")
        relative = md_file.relative_to(resources_dir.parent)
        base_sections = split_sections(raw)
        expanded: list[Chunk] = []
        for section in base_sections:
            expanded.extend(split_oversized(section, max_words=max_words))

        for idx, chunk in enumerate(expanded, start=1):
            body = normalize(chunk.text)
            if not body:
                continue
            entry = {
                "id": make_chunk_id(relative.as_posix(), idx, body),
                "source": relative.as_posix(),
                "source_file": md_file.name,
                "heading": chunk.heading,
                "genres": detect_genres(md_file, body),
                "topics": detect_topics(md_file, body),
                "word_count": len(WORD_RE.findall(body)),
                "text": body,
            }
            entries.append(entry)

        file_counts[relative.as_posix()] = len(expanded)

    manifest = {
        "total_files": len(file_counts),
        "total_chunks": len(entries),
        "max_chunk_words": max_words,
        "chunks_per_file": file_counts,
        "fields": [
            "id",
            "source",
            "source_file",
            "heading",
            "genres",
            "topics",
            "word_count",
            "text",
        ],
    }
    return entries, manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--resources-dir", type=Path, default=Path("Resources"))
    parser.add_argument("--out-jsonl", type=Path, default=Path("data/songwriting_corpus.jsonl"))
    parser.add_argument("--out-manifest", type=Path, default=Path("data/songwriting_manifest.json"))
    parser.add_argument("--max-words", type=int, default=220)
    args = parser.parse_args()

    entries, manifest = build_corpus(args.resources_dir, args.max_words)
    args.out_jsonl.parent.mkdir(parents=True, exist_ok=True)
    args.out_manifest.parent.mkdir(parents=True, exist_ok=True)

    with args.out_jsonl.open("w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    args.out_manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(
        f"Built corpus with {manifest['total_chunks']} chunks "
        f"from {manifest['total_files']} files."
    )


if __name__ == "__main__":
    main()
