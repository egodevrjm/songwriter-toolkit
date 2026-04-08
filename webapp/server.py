#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
CORPUS = ROOT.parent / "data" / "songwriting_corpus.jsonl"
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


class CorpusIndex:
    def __init__(self, corpus_file: Path) -> None:
        self.entries: list[Entry] = []
        self.doc_tokens: list[list[str]] = []
        self.df: dict[str, int] = defaultdict(int)
        self._load(corpus_file)

    def _load(self, corpus_file: Path) -> None:
        if not corpus_file.exists():
            raise FileNotFoundError(f"Corpus file missing: {corpus_file}")

        for line in corpus_file.read_text(encoding="utf-8").splitlines():
            row = json.loads(line)
            entry = Entry(
                id=row["id"],
                source=row["source"],
                heading=row.get("heading"),
                genres=row.get("genres", []),
                topics=row.get("topics", []),
                text=row["text"],
            )
            toks = tokenize(entry.text)
            self.entries.append(entry)
            self.doc_tokens.append(toks)
            for tok in set(toks):
                self.df[tok] += 1

    def search(self, query: str, genres: list[str], topics: list[str], top_k: int) -> list[tuple[float, Entry]]:
        entries = self.entries
        doc_tokens = self.doc_tokens

        if genres:
            gset = {g.lower() for g in genres}
            kept = [(e, t) for e, t in zip(entries, doc_tokens) if gset.intersection({x.lower() for x in e.genres})]
            entries = [x[0] for x in kept]
            doc_tokens = [x[1] for x in kept]

        if topics:
            tset = {t.lower() for t in topics}
            kept = [(e, t) for e, t in zip(entries, doc_tokens) if tset.intersection({x.lower() for x in e.topics})]
            entries = [x[0] for x in kept]
            doc_tokens = [x[1] for x in kept]

        q_tokens = tokenize(query)
        if not q_tokens:
            return []

        q_counts = Counter(q_tokens)
        n_docs = max(1, len(entries))
        scored: list[tuple[float, Entry]] = []

        for entry, toks in zip(entries, doc_tokens):
            tf = Counter(toks)
            length_norm = math.sqrt(max(1, len(toks)))
            score = 0.0
            for tok, qtf in q_counts.items():
                if tok not in tf:
                    continue
                idf = math.log((n_docs + 1) / (self.df.get(tok, 0) + 1)) + 1.0
                score += (tf[tok] / length_norm) * idf * qtf
            if score > 0:
                scored.append((score, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:top_k]


def build_songwriter_response(goal: str, hits: list[tuple[float, Entry]]) -> dict:
    if not hits:
        return {
            "concept": "No relevant guidance found. Try a broader query.",
            "titles": [],
            "verse": "",
            "chorus": "",
            "rewrite_note": "",
            "citations": [],
        }

    top = [entry for _, entry in hits]
    title_seed = re.sub(r"[^a-zA-Z0-9\s]", "", goal).strip().title() or "Untitled Song"
    titles = [
        title_seed,
        f"{title_seed} Tonight",
        f"If {title_seed}",
        f"{title_seed} (After Midnight)",
        f"Only {title_seed}",
        f"{title_seed} Again",
    ]

    line_bank: list[str] = []
    for entry in top:
        for ln in entry.text.splitlines():
            ln = ln.strip(" -#\t")
            if 20 <= len(ln) <= 90 and not ln.lower().startswith("integration notes"):
                line_bank.append(ln)
            if len(line_bank) >= 8:
                break
        if len(line_bank) >= 8:
            break

    while len(line_bank) < 8:
        line_bank.append("Hold on to the line that hurts the most, then sing it plain.")

    verse = "\n".join(
        [
            f"{line_bank[0]}",
            f"{line_bank[1]}",
            f"{line_bank[2]}",
            f"{line_bank[3]}",
        ]
    )
    chorus_hook = re.sub(r"\s+", " ", goal).strip().capitalize()
    chorus = "\n".join(
        [
            f"{chorus_hook}",
            f"{line_bank[4]}",
            f"{chorus_hook}",
            f"{line_bank[5]}",
        ]
    )

    citations = [
        {
            "source": e.source,
            "heading": e.heading,
            "genres": e.genres,
            "topics": e.topics,
        }
        for e in top[:5]
    ]

    return {
        "concept": f"A genre-aware song draft around: {goal}",
        "titles": titles[:6],
        "verse": verse,
        "chorus": chorus,
        "rewrite_note": "Tighten chorus to 5-9 words per key line and put strongest vowel sounds on long notes.",
        "citations": citations,
    }


INDEX = CorpusIndex(CORPUS)


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, data: dict, status: int = 200) -> None:
        raw = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _serve_file(self, path: Path, content_type: str) -> None:
        if not path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        body = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            return self._serve_file(STATIC / "index.html", "text/html; charset=utf-8")
        if parsed.path == "/app.js":
            return self._serve_file(STATIC / "app.js", "application/javascript; charset=utf-8")
        if parsed.path == "/styles.css":
            return self._serve_file(STATIC / "styles.css", "text/css; charset=utf-8")
        if parsed.path == "/api/health":
            return self._send_json({"ok": True, "chunks": len(INDEX.entries)})
        self.send_error(HTTPStatus.NOT_FOUND, "Not found")

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/songwrite":
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length) or b"{}")
        query = str(payload.get("query", "")).strip()
        genres = payload.get("genres", []) or []
        topics = payload.get("topics", []) or []
        top_k = int(payload.get("top_k", 5))

        if not query:
            return self._send_json({"error": "query is required"}, status=400)

        hits = INDEX.search(query=query, genres=genres, topics=topics, top_k=max(1, min(10, top_k)))
        result = build_songwriter_response(query, hits)
        result["matches"] = [
            {
                "score": round(score, 3),
                "id": entry.id,
                "source": entry.source,
                "heading": entry.heading,
                "genres": entry.genres,
                "topics": entry.topics,
                "preview": " ".join(entry.text.split())[:220],
            }
            for score, entry in hits
        ]
        self._send_json(result)


def run() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    print("Songwriter web app running at http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    run()
