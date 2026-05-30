import { ZodError } from "zod";
import {
  genrePlaybookSchema,
  outputTemplateSchema,
  retrieveContextSchema,
  scoreLyricsSchema,
  sunoStyleCardsSchema,
  validateSunoPromptSchema
} from "./schemas";
import { corpusStats, retrieveCorpus } from "./corpus";
import { GENRE_PLAYBOOKS, TEMPLATE_BY_TASK, getGenrePlaybook } from "./playbooks";

const SUNO_CORE_ELEMENTS = [
  { key: "genre", terms: ["pop", "rock", "country", "hip hop", "hip-hop", "rap", "edm", "synthpop", "afrobeats", "metal", "jazz", "folk", "r&b", "soul", "grime"] },
  { key: "tempo_feel", terms: ["slow", "midtempo", "uptempo", "140", "120", "bpm", "driving", "laid-back", "half-time", "danceable"] },
  { key: "vocal", terms: ["vocal", "voice", "sung", "rap", "falsetto", "baritone", "tenor", "choir", "female", "male"] },
  { key: "arrangement", terms: ["drums", "bass", "guitar", "synth", "piano", "strings", "orchestral", "808", "percussion", "pads"] },
  { key: "mix", terms: ["wide", "dry", "reverb", "punchy", "warm", "clean", "distorted", "lo-fi", "cinematic"] }
];

const CONTRADICTIONS = [
  ["slow", "uptempo"],
  ["minimal", "maximal"],
  ["acoustic", "industrial"],
  ["dry vocal", "huge reverb"],
  ["lo-fi", "polished hi-fi"]
];

function asError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      code: "invalid_arguments",
      message: "Tool input failed validation.",
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    };
  }
  return {
    code: "songforge_error",
    message: error instanceof Error ? error.message : "Unknown SongForge error"
  };
}

function containsAny(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term));
}

function sentenceCase(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function inferOutputMode(task: string) {
  if (task.includes("suno")) return "suno_prompt_pack";
  if (task === "critique") return "diagnostic_scorecard";
  if (task === "rap_flow") return "flow_and_cadence_notes";
  if (task === "title_hook_lab") return "title_hook_candidates";
  return "structured_context_pack";
}

function styleDescriptorForGenre(genre: string) {
  const playbook = getGenrePlaybook(genre);
  return `${genre.trim()} — ${playbook.suno_style_notes.slice(0, 3).join(", ")}`;
}

function makeSunoSeeds(genres: string[], mood?: string, tempoFeel?: string) {
  const genreText = genres.map((genre) => genre.trim()).filter(Boolean).join(", ");
  const moodText = mood?.trim() || "emotionally clear, high-contrast";
  const tempoText = tempoFeel?.trim() || "medium tempo with a clear lift";
  const playbookNotes = genres.map(styleDescriptorForGenre).join("; ");

  return {
    compact_prompt_seed: `${genreText}; ${moodText}; ${tempoText}; strong vocal hook; clean arrangement arc; modern mix.`,
    detailed_prompt_seed: `${genreText} fusion with ${moodText} emotional posture, ${tempoText}, memorable topline, section contrast between intimate verses and lifted chorus, focused drums/bass relationship, clear vocal presence, sourceable hook energy. Notes: ${playbookNotes}.`,
    arrangement_led_seed: `Start sparse and identity-rich, introduce signature groove early, widen into the chorus, add counter-melody or texture after chorus one, pull back for bridge/breakdown, return bigger for final chorus. Genre palette: ${genreText}. Mood: ${moodText}. Tempo feel: ${tempoText}.`,
    advanced_exclude_suggestions: [
      "muddy vocals",
      "generic stock loops",
      "flat chorus dynamics",
      "unbalanced genre clash",
      "over-compressed master",
      "unintelligible lyric phrasing"
    ]
  };
}

function keywordScore(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword) ? 1 : 0), 0);
}

function scoreOutOf10(raw: number) {
  return Math.max(1, Math.min(10, Math.round(raw)));
}

const taskEnum = [
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
];

export const TOOL_DEFINITIONS = [
  {
    name: "songforge_retrieve_context",
    description: "Retrieve compact, citeable songwriting corpus context for a focused songwriting task.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string", enum: taskEnum },
        query: { type: "string" },
        genres: { type: "array", items: { type: "string" } },
        topics: { type: "array", items: { type: "string" } },
        top_k: { type: "number", default: 8, maximum: 15 }
      },
      required: ["task", "query"]
    }
  },
  {
    name: "songforge_get_output_template",
    description: "Return the recommended structured response template for a SongForge task.",
    inputSchema: {
      type: "object",
      properties: { task: { type: "string", enum: taskEnum } },
      required: ["task"]
    }
  },
  {
    name: "songforge_get_genre_playbook",
    description: "Return compact genre craft guidance for lyric posture, structure, density, imagery, rhyme and Suno notes.",
    inputSchema: {
      type: "object",
      properties: { genre: { type: "string" }, task: { type: "string" } },
      required: ["genre"]
    }
  },
  {
    name: "songforge_get_suno_style_cards",
    description: "Build compact, detailed and arrangement-led Suno style prompt seeds for selected genres.",
    inputSchema: {
      type: "object",
      properties: {
        genres: { type: "array", items: { type: "string" }, minItems: 1 },
        mood: { type: "string" },
        tempo_feel: { type: "string" }
      },
      required: ["genres"]
    }
  },
  {
    name: "songforge_validate_suno_prompt",
    description: "Score a Suno style prompt and suggest missing elements, conflict fixes, improved prompt and advanced excludes.",
    inputSchema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"]
    }
  },
  {
    name: "songforge_score_lyrics",
    description: "Score lyrics across core SongForge craft dimensions and suggest the next revision.",
    inputSchema: {
      type: "object",
      properties: {
        lyrics: { type: "string" },
        genre: { type: "string" },
        task: { type: "string" }
      },
      required: ["lyrics"]
    }
  }
] as const;

export async function callSongForgeTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "songforge_retrieve_context": {
        const input = retrieveContextSchema.parse(args);
        const matches = retrieveCorpus(input.query, input.genres, input.topics, input.top_k ?? 8);
        const stats = corpusStats();
        return {
          matches,
          suggested_output_mode: inferOutputMode(input.task),
          warnings: matches.length
            ? []
            : ["No direct matches found. Try broader genre/topic filters or rebuild the corpus with more source material."],
          usage_notes: [
            "Use matches as craft context, not as lyrics to copy.",
            "Cite source and heading when using a retrieved idea.",
            `Corpus available: ${stats.entries} chunks across ${stats.sources} sources.`
          ]
        };
      }

      case "songforge_get_output_template": {
        const input = outputTemplateSchema.parse(args);
        return TEMPLATE_BY_TASK[input.task];
      }

      case "songforge_get_genre_playbook": {
        const input = genrePlaybookSchema.parse(args);
        const playbook = getGenrePlaybook(input.genre);
        return {
          genre: input.genre,
          task: input.task ?? null,
          ...playbook
        };
      }

      case "songforge_get_suno_style_cards": {
        const input = sunoStyleCardsSchema.parse(args);
        return makeSunoSeeds(input.genres, input.mood, input.tempo_feel);
      }

      case "songforge_validate_suno_prompt": {
        const input = validateSunoPromptSchema.parse(args);
        const prompt = input.prompt.trim();
        const lower = prompt.toLowerCase();
        const missing_elements = SUNO_CORE_ELEMENTS
          .filter((element) => !containsAny(lower, element.terms))
          .map((element) => element.key);
        const conflicts = CONTRADICTIONS
          .filter(([a, b]) => lower.includes(a) && lower.includes(b))
          .map(([a, b]) => `${a} conflicts with ${b}; decide which should dominate or frame it as section contrast.`);

        const score = scoreOutOf10(10 - missing_elements.length * 1.2 - conflicts.length * 1.5 + (prompt.length > 80 ? 1 : 0));
        const inferredGenres = Object.keys(GENRE_PLAYBOOKS).filter((genre) => lower.includes(genre)).slice(0, 4);
        const seed = makeSunoSeeds(inferredGenres.length ? inferredGenres : ["modern pop"], "emotionally specific", missing_elements.includes("tempo_feel") ? "medium tempo with clear chorus lift" : undefined);

        return {
          score,
          missing_elements,
          conflicts,
          improved_prompt: `${sentenceCase(prompt)}; ${missing_elements.includes("vocal") ? "clear lead vocal, " : ""}${missing_elements.includes("arrangement") ? "defined drums, bass and harmonic texture, " : ""}${missing_elements.includes("mix") ? "wide modern mix, vocal-forward clarity, " : ""}strong section contrast, memorable chorus lift.`.replace(/\s+/g, " ").trim(),
          advanced_exclude: [
            ...seed.advanced_exclude_suggestions,
            ...(conflicts.length ? ["conflicting style instructions"] : [])
          ].slice(0, 8)
        };
      }

      case "songforge_score_lyrics": {
        const input = scoreLyricsSchema.parse(args);
        const lyrics = input.lyrics.trim();
        const lines = lyrics.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const lower = lyrics.toLowerCase();
        const titleLikeRepeats = lines
          .map((line) => line.toLowerCase().replace(/[^a-z0-9\s']/g, "").trim())
          .filter((line, index, arr) => line.length > 3 && arr.indexOf(line) !== index).length;

        const concreteScore = keywordScore(lower, ["door", "room", "street", "car", "phone", "rain", "light", "bed", "bar", "kitchen", "hands", "eyes"]);
        const emotionalScore = keywordScore(lower, ["miss", "need", "want", "love", "hurt", "sorry", "afraid", "lonely", "hope", "heart"]);
        const genrePlaybook = input.genre ? getGenrePlaybook(input.genre) : null;
        const lineLengthVariance = lines.length > 1
          ? Math.max(...lines.map((line) => line.length)) - Math.min(...lines.map((line) => line.length))
          : 0;

        const scores = {
          concept_clarity: scoreOutOf10(4 + emotionalScore + (lines.length >= 4 ? 1 : 0)),
          title_strength: scoreOutOf10(4 + titleLikeRepeats * 2 + (lines.some((line) => line.length <= 40) ? 1 : 0)),
          hook_memorability: scoreOutOf10(3 + titleLikeRepeats * 2 + keywordScore(lower, ["tonight", "again", "never", "always", "say", "stay"])),
          emotional_progression: scoreOutOf10(3 + new Set(lines.map((line) => line.split(/\s+/)[0]?.toLowerCase())).size / 2),
          imagery_freshness: scoreOutOf10(3 + concreteScore - keywordScore(lower, ["light", "side", "night"]) / 2),
          rhyme_craft: scoreOutOf10(4 + Math.min(4, lines.filter((line) => /ight|ay|ow|ee|ide|ire$/i.test(line)).length)),
          singability_prosody: scoreOutOf10(7 - (lineLengthVariance > 45 ? 2 : 0) + (lines.every((line) => line.length < 80) ? 1 : 0)),
          genre_authenticity: scoreOutOf10(input.genre ? 5 + keywordScore(lower, genrePlaybook?.image_field.toLowerCase().split(/[,\s]+/).slice(0, 12) ?? []) : 5),
          chorus_lift: scoreOutOf10(4 + titleLikeRepeats * 2 + (lines.length <= 8 ? 1 : 0)),
          suno_readiness: scoreOutOf10(4 + (lines.length >= 4 ? 1 : 0) + (titleLikeRepeats ? 2 : 0) + (lineLengthVariance < 35 ? 1 : 0))
        };

        const scoreEntries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];

        return {
          scores,
          top_strength: `${scoreEntries[0][0].replace(/_/g, " ")} is currently the strongest craft dimension.`,
          biggest_fix: `${weakest[0].replace(/_/g, " ")} needs the most attention.`,
          suggested_next_revision:
            weakest[0] === "imagery_freshness"
              ? "Replace at least two abstract lines with physical images only this singer would notice."
              : weakest[0] === "hook_memorability"
                ? "Find a shorter title phrase and repeat it in the same melodic position twice."
                : weakest[0] === "emotional_progression"
                  ? "Make line one the wound, line two the denial, line three the turn, and line four the admission."
                  : "Tighten line lengths, put the strongest vowel sounds on long notes, and make the chorus title unavoidable."
        };
      }

      default:
        return {
          error: {
            code: "unknown_tool",
            message: `SongForge does not expose a tool named ${name}.`
          }
        };
    }
  } catch (error) {
    return { error: asError(error) };
  }
}
