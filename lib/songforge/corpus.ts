import fs from "node:fs";
import path from "node:path";
import { RetrieveContextInput, taskTopicHints } from "./schemas";

export type CorpusEntry = {
  id: string;
  source: string;
  source_file?: string;
  heading: string | null;
  genres: string[];
  topics: string[];
  word_count?: number;
  text: string;
};

export type CorpusMatch = {
  id: string;
  source: string;
  heading: string | null;
  genres: string[];
  topics: string[];
  text: string;
  score: number;
};

const TOKEN_RE = /\b[a-zA-Z0-9']+\b/g;
const MAX_MATCH_TEXT_CHARS = 950;

type CorpusIndex = {
  entries: CorpusEntry[];
  tokenised: string[][];
  df: Map<string, number>;
};

let cachedIndex: CorpusIndex | null = null;

export function tokenize(text: string): string[] {
  return (text.match(TOKEN_RE) ?? []).map((token) => token.toLowerCase());
}

function corpusPath(): string {
  return path.join(process.cwd(), "data", "songwriting_corpus.jsonl");
}

export function loadCorpusIndex(): CorpusIndex {
  if (cachedIndex) return cachedIndex;

  const file = corpusPath();
  if (!fs.existsSync(file)) {
    throw new Error(
      `SongForge corpus is missing at ${file}. Run: python3 tools/build_songwriting_corpus.py`
    );
  }

  const rows = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CorpusEntry);

  const df = new Map<string, number>();
  const tokenised = rows.map((entry) => {
    const haystack = [
      entry.heading ?? "",
      entry.source,
      entry.genres.join(" "),
      entry.topics.join(" "),
      entry.text,
    ].join("\n");
    const tokens = tokenize(haystack);
    for (const token of new Set(tokens)) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
    return tokens;
  });

  cachedIndex = { entries: rows, tokenised, df };
  return cachedIndex;
}

function clampText(text: string, maxChars = MAX_MATCH_TEXT_CHARS): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars - 1).trim()}…`;
}

function normaliseList(values: string[] | undefined): Set<string> {
  return new Set((values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function overlaps(entryValues: string[], requested: Set<string>): boolean {
  if (!requested.size) return true;
  const actual = new Set(entryValues.map((value) => value.toLowerCase()));
  for (const wanted of requested) {
    if (actual.has(wanted)) return true;
    for (const value of actual) {
      if (value.includes(wanted) || wanted.includes(value)) return true;
    }
  }
  return false;
}

export function retrieveContext(input: RetrieveContextInput): {
  matches: CorpusMatch[];
  warnings: string[];
} {
  const { entries, tokenised, df } = loadCorpusIndex();
  const requestedGenres = normaliseList(input.genres);
  const requestedTopics = normaliseList([...input.topics, ...taskTopicHints[input.task]]);

  const queryTokens = tokenize(
    [input.query, input.task, ...(input.genres ?? []), ...(input.topics ?? [])].join(" ")
  );

  if (!queryTokens.length) {
    return { matches: [], warnings: ["No query tokens found. Try a more descriptive query."] };
  }

  const qCounts = new Map<string, number>();
  for (const token of queryTokens) qCounts.set(token, (qCounts.get(token) ?? 0) + 1);

  const filtered = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => overlaps(entry.genres, requestedGenres))
    .filter(({ entry }) => overlaps(entry.topics, requestedTopics));

  const candidates = filtered.length ? filtered : entries.map((entry, index) => ({ entry, index }));
  const warnings: string[] = [];

  if (!filtered.length && (requestedGenres.size || requestedTopics.size)) {
    warnings.push("No exact genre/topic filtered matches found, so retrieval fell back to the full corpus.");
  }

  const nDocs = Math.max(1, entries.length);
  const scored = candidates
    .map(({ entry, index }) => {
      const tokens = tokenised[index];
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);

      const lengthNorm = Math.sqrt(Math.max(1, tokens.length));
      let score = 0;

      for (const [token, qtf] of qCounts.entries()) {
        const count = tf.get(token);
        if (!count) continue;
        const idf = Math.log((nDocs + 1) / ((df.get(token) ?? 0) + 1)) + 1;
        score += (count / lengthNorm) * idf * qtf;
      }

      const heading = (entry.heading ?? "").toLowerCase();
      for (const token of queryTokens) {
        if (heading.includes(token)) score += 0.08;
      }

      if (input.genres?.some((genre) => entry.genres.map((g) => g.toLowerCase()).includes(genre.toLowerCase()))) {
        score += 0.25;
      }

      if (entry.topics.some((topic) => taskTopicHints[input.task].includes(topic))) {
        score += 0.18;
      }

      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.top_k);

  if (!scored.length) {
    warnings.push("No keyword matches found. Broaden the query or omit filters.");
  }

  return {
    matches: scored.map(({ entry, score }) => ({
      id: entry.id,
      source: entry.source,
      heading: entry.heading ?? null,
      genres: entry.genres,
      topics: entry.topics,
      text: clampText(entry.text),
      score: Number(score.toFixed(3)),
    })),
    warnings,
  };
}

export function corpusStats(): { total_chunks: number; source_files: number } {
  const { entries } = loadCorpusIndex();
  return {
    total_chunks: entries.length,
    source_files: new Set(entries.map((entry) => entry.source)).size,
  };
}
