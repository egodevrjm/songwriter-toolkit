import { ScoreLyricsInput } from "./schemas";
import { getGenrePlaybook } from "./playbooks";

type ScoreMap = {
  concept_clarity: number;
  title_strength: number;
  hook_memorability: number;
  emotional_progression: number;
  imagery_freshness: number;
  rhyme_craft: number;
  singability_prosody: number;
  genre_authenticity: number;
  chorus_lift: number;
  suno_readiness: number;
};

const CLICHES = [
  "miss you every night",
  "can't find the light",
  "by my side",
  "everything will be alright",
  "broken heart",
  "falling apart",
  "tears in the rain",
  "lost without you",
];

const sensoryWords = [
  "rain",
  "smoke",
  "neon",
  "cold",
  "heat",
  "perfume",
  "whiskey",
  "dust",
  "blood",
  "salt",
  "static",
  "glass",
  "engine",
  "street",
  "kitchen",
  "phone",
  "light",
  "shadow",
];

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function linesOf(lyrics: string): string[] {
  return lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/\b[a-zA-Z0-9']+\b/g) ?? [];
}

function endWord(line: string): string {
  const words = wordsOf(line);
  return words[words.length - 1] ?? "";
}

function endingKey(word: string): string {
  return word.slice(Math.max(0, word.length - 3));
}

function uniqueRatio(values: string[]): number {
  if (!values.length) return 0;
  return new Set(values).size / values.length;
}

export function scoreLyrics(input: ScoreLyricsInput) {
  const lyrics = input.lyrics.trim();
  const lines = linesOf(lyrics);
  const words = wordsOf(lyrics);
  const lower = lyrics.toLowerCase();

  const repeatedLines = lines.length - new Set(lines.map((line) => line.toLowerCase())).size;
  const avgWordsPerLine = lines.length ? words.length / lines.length : 0;
  const titleishRepeats = lines
    .map((line) => line.toLowerCase())
    .filter((line, index, arr) => arr.indexOf(line) !== index).length;
  const clicheHits = CLICHES.filter((phrase) => lower.includes(phrase));
  const sensoryHits = sensoryWords.filter((word) => lower.includes(word));

  const endings = lines.map(endWord).filter(Boolean).map(endingKey);
  const rhymeRatio = 1 - uniqueRatio(endings);
  const hasSectionLabels = /\b(verse|chorus|hook|bridge|pre-chorus)\b/i.test(lyrics);
  const hasContrast = /\b(but|until|now|then|still|except|because|tonight|tomorrow)\b/i.test(lyrics);

  const genre = input.genre?.trim();
  const playbook = genre ? getGenrePlaybook(genre) : null;
  const genreTerms = playbook
    ? [...playbook.image_field, ...playbook.suno_style_notes].flatMap((value) => wordsOf(value))
    : [];
  const genreOverlap = genreTerms.length
    ? words.filter((word) => genreTerms.includes(word)).length / Math.max(1, words.length)
    : 0.2;

  const scores: ScoreMap = {
    concept_clarity: clampScore(5 + (lines.length >= 4 ? 1 : 0) + (hasContrast ? 1 : 0) - (clicheHits.length > 2 ? 2 : 0)),
    title_strength: clampScore(4 + (titleishRepeats ? 2 : 0) + (lines.some((line) => line.length <= 36) ? 1 : 0) - (clicheHits.length > 1 ? 1 : 0)),
    hook_memorability: clampScore(4 + repeatedLines * 1.5 + (titleishRepeats ? 2 : 0) - clicheHits.length),
    emotional_progression: clampScore(4 + (hasContrast ? 2 : 0) + (lines.length >= 8 ? 1 : 0) - (repeatedLines > 3 ? 1 : 0)),
    imagery_freshness: clampScore(3 + sensoryHits.length * 1.1 - clicheHits.length * 1.2),
    rhyme_craft: clampScore(4 + rhymeRatio * 5 - (rhymeRatio > 0.8 ? 2 : 0)),
    singability_prosody: clampScore(6 - Math.abs(avgWordsPerLine - 7) * 0.45 - (lines.some((line) => wordsOf(line).length > 14) ? 1 : 0)),
    genre_authenticity: clampScore(5 + genreOverlap * 18 + (genre ? 1 : 0)),
    chorus_lift: clampScore(4 + (hasSectionLabels ? 1 : 0) + repeatedLines + (avgWordsPerLine <= 9 ? 1 : 0) - (clicheHits.length > 2 ? 1 : 0)),
    suno_readiness: clampScore(4 + (hasSectionLabels ? 2 : 0) + (lines.length >= 6 ? 1 : 0) + (avgWordsPerLine <= 10 ? 1 : 0)),
  };

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topStrengthKey = scoreEntries[0]?.[0] ?? "concept_clarity";
  const weakestKey = [...scoreEntries].reverse()[0]?.[0] ?? "imagery_freshness";

  const biggestFixMap: Record<string, string> = {
    concept_clarity: "Clarify the central situation in one concrete line before repeating the emotion.",
    title_strength: "Find a shorter, more ownable title phrase and place it on the strongest musical landing.",
    hook_memorability: "Replace generic longing with a repeatable phrase that has a sharper image or twist.",
    emotional_progression: "Make each section move: setup, pressure, consequence, turn.",
    imagery_freshness: "Swap familiar phrases for physical details the listener can see, touch, or hear.",
    rhyme_craft: "Use slant rhyme and internal rhyme so the lyric does not feel boxed into obvious couplets.",
    singability_prosody: "Read every line over a beat and cut overloaded phrases until the stresses land naturally.",
    genre_authenticity: "Borrow the target genre's rhythm, diction, and image field without leaning on costume cliches.",
    chorus_lift: "Make the chorus broader, simpler, and more repeatable than the verse.",
    suno_readiness: "Add clear section labels and compact chorus language before sending this to a generative music tool.",
  };

  const strengthMap: Record<string, string> = {
    concept_clarity: "The emotional situation is easy to understand.",
    title_strength: "There is at least one phrase that could become a title.",
    hook_memorability: "The lyric already uses repetition in a way a listener can catch.",
    emotional_progression: "There is some sense of movement rather than only static feeling.",
    imagery_freshness: "The lyric contains concrete sensory material.",
    rhyme_craft: "The rhyme pattern gives the lyric musical glue.",
    singability_prosody: "The lines look relatively singable at a glance.",
    genre_authenticity: genre ? `The lyric has some signals that can be shaped toward ${genre}.` : "The lyric is not overcommitted to the wrong genre.",
    chorus_lift: "The chorus has the potential to lift if simplified and made more title-forward.",
    suno_readiness: "The lyric is close to a structure a generative music model can follow.",
  };

  return {
    scores,
    top_strength: strengthMap[topStrengthKey],
    biggest_fix: biggestFixMap[weakestKey],
    suggested_next_revision: [
      biggestFixMap[weakestKey],
      clicheHits.length
        ? `Replace these familiar phrases first: ${clicheHits.slice(0, 4).join(", ")}.`
        : "Preserve the clearest emotional phrase and build fresher surrounding images.",
      "Run a chorus-only pass: shorten lines, repeat the title phrase, and make the last line feel inevitable.",
    ],
  };
}
