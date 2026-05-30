export const TASKS = [
  "new_song",
  "rewrite",
  "critique",
  "suno_styles",
  "genre_transform",
  "title_hook_lab",
  "rap_flow",
  "theatre_character",
  "suno_troubleshooting",
  "batch_prompt_library"
] as const;

export type SongForgeTask = (typeof TASKS)[number];

export type CorpusEntry = {
  id: string;
  source: string;
  source_file?: string;
  heading?: string | null;
  genres: string[];
  topics: string[];
  word_count?: number;
  text: string;
};

export type RetrievedMatch = {
  id: string;
  source: string;
  heading: string | null;
  genres: string[];
  topics: string[];
  text: string;
  score: number;
};

export type ScoreBand = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
