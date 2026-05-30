import fs from "node:fs";
import path from "node:path";
import type { CorpusEntry, RetrievedMatch } from "./types";

const TOKEN_RE = /\b[a-zA-Z0-9']+\b/g;
const MAX_TEXT_CHARS = 900;

let cachedEntries: CorpusEntry[] | null = null;
let cachedTokens: string[][] | null = null;
let cachedDf: Map<string, number> | null = null;

function tokenize(text: string): string[] {
  return [...text.matchAll(TOKEN_RE)].map((match) => match[0].toLowerCase());
}

function normaliseList(values?: string[]): string[] {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function trimText(text: string, maxChars = MAX_TEXT_CHARS): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars - 1).trimEnd()}…`;
}

export function loadCorpus(): CorpusEntry[] {
  if (cachedEntries) return cachedEntries;

  const corpusPath = path.join(process.cwd(), "data", "songwriting_corpus.jsonl");
  if (!fs.existsSync(corpusPath)) {
    throw new Error(`SongForge corpus file not found at ${corpusPath}. Run python3 tools/build_songwriting_corpus.py and commit data/songwriting_corpus.jsonl.`);
  }

  const rows = fs.readFileSync(corpusPath, "utf8").split(/\r?\n/).filter(Boolean);
  cachedEntries = rows.map((line) => JSON.parse(line) as CorpusEntry);
  cachedTokens = cachedEntries.map((entry) => tokenize(`${entry.heading ?? ""} ${entry.genres.join(" ")} ${entry.topics.join(" ")} ${entry.text}`));

  const df = new Map<string, number>();
  for (const tokens of cachedTokens) {
    for (const token of new Set(tokens)) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  cachedDf = df;

  return cachedEntries;
}

export function corpusStats() {
  const entries = loadCorpus();
  return {
    entries: entries.length,
    sources: new Set(entries.map((entry) => entry.source)).size,
    genres: [...new Set(entries.flatMap((entry) => entry.genres))].sort(),
    topics: [...new Set(entries.flatMap((entry) => entry.topics))].sort()
  };
}

export function retrieveCorpus(query: string, genres?: string[], topics?: string[], topK = 8): RetrievedMatch[] {
  const entries = loadCorpus();
  const docTokens = cachedTokens ?? [];
  const df = cachedDf ?? new Map<string, number>();

  const genreFilters = normaliseList(genres);
  const topicFilters = normaliseList(topics);
  const queryTokens = tokenize(query);
  const expandedQuery = new Set(queryTokens);

  for (const genre of genreFilters) expandedQuery.add(genre);
  for (const topic of topicFilters) expandedQuery.add(topic);

  const nDocs = Math.max(1, entries.length);
  const scored: RetrievedMatch[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const entryGenres = entry.genres.map((genre) => genre.toLowerCase());
    const entryTopics = entry.topics.map((topic) => topic.toLowerCase());

    if (genreFilters.length && !genreFilters.some((genre) => entryGenres.includes(genre))) continue;
    if (topicFilters.length && !topicFilters.some((topic) => entryTopics.includes(topic))) continue;

    const tokens = docTokens[index] ?? [];
    const tf = new Map<string, number>();
    for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);

    let score = 0;
    for (const token of expandedQuery) {
      const count = tf.get(token) ?? 0;
      if (!count) continue;
      const idf = Math.log((nDocs + 1) / ((df.get(token) ?? 0) + 1)) + 1;
      score += (count / Math.sqrt(Math.max(1, tokens.length))) * idf;
    }

    for (const genre of genreFilters) {
      if (entryGenres.includes(genre)) score += 1.5;
    }
    for (const topic of topicFilters) {
      if (entryTopics.includes(topic)) score += 1.1;
    }
    if (entry.heading && query.toLowerCase().includes(entry.heading.toLowerCase())) score += 1.2;

    if (score > 0) {
      scored.push({
        id: entry.id,
        source: entry.source,
        heading: entry.heading ?? null,
        genres: entry.genres,
        topics: entry.topics,
        text: trimText(entry.text),
        score: Number(score.toFixed(3))
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, Math.min(Math.max(topK, 1), 15));
}
