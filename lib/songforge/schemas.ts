import { z } from "zod";

export const TaskSchema = z.enum([
  "new_song",
  "rewrite",
  "critique",
  "suno_styles",
  "genre_transform",
  "title_hook_lab",
  "rap_flow",
  "theatre_character",
  "suno_troubleshooting",
  "batch_prompt_library",
]);

export type SongForgeTask = z.infer<typeof TaskSchema>;

export const RetrieveContextInputSchema = z.object({
  task: TaskSchema,
  query: z.string().min(1, "query is required"),
  genres: z.array(z.string().min(1)).optional().default([]),
  topics: z.array(z.string().min(1)).optional().default([]),
  top_k: z.number().int().min(1).max(15).optional().default(8),
});

export const OutputTemplateInputSchema = z.object({
  task: TaskSchema,
});

export const GenrePlaybookInputSchema = z.object({
  genre: z.string().min(1, "genre is required"),
  task: z.string().optional(),
});

export const SunoStyleCardsInputSchema = z.object({
  genres: z.array(z.string().min(1)).min(1, "at least one genre is required"),
  mood: z.string().optional(),
  tempo_feel: z.string().optional(),
});

export const ValidateSunoPromptInputSchema = z.object({
  prompt: z.string().min(1, "prompt is required"),
});

export const ScoreLyricsInputSchema = z.object({
  lyrics: z.string().min(1, "lyrics are required"),
  genre: z.string().optional(),
  task: z.string().optional(),
});

export type RetrieveContextInput = z.infer<typeof RetrieveContextInputSchema>;
export type OutputTemplateInput = z.infer<typeof OutputTemplateInputSchema>;
export type GenrePlaybookInput = z.infer<typeof GenrePlaybookInputSchema>;
export type SunoStyleCardsInput = z.infer<typeof SunoStyleCardsInputSchema>;
export type ValidateSunoPromptInput = z.infer<typeof ValidateSunoPromptInputSchema>;
export type ScoreLyricsInput = z.infer<typeof ScoreLyricsInputSchema>;

export const taskValues = TaskSchema.options;

export const taskTopicHints: Record<SongForgeTask, string[]> = {
  new_song: ["hooks", "lyrics", "structure", "melody"],
  rewrite: ["lyrics", "prosody", "rhyming", "hooks"],
  critique: ["hooks", "prosody", "structure", "lyrics"],
  suno_styles: ["instrumentation", "prompting", "structure"],
  genre_transform: ["lyrics", "instrumentation", "structure", "harmony"],
  title_hook_lab: ["hooks", "melody", "prosody"],
  rap_flow: ["flow", "rhyming", "prosody"],
  theatre_character: ["lyrics", "structure", "melody"],
  suno_troubleshooting: ["prompting", "instrumentation", "structure"],
  batch_prompt_library: ["prompting", "workflow-habits", "producer-insights"],
};

export function zodErrorToMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("; ");
}

export const taskJsonSchema = {
  type: "string",
  enum: taskValues,
};

export const toolInputSchemas = {
  songforge_retrieve_context: {
    type: "object",
    additionalProperties: false,
    required: ["task", "query"],
    properties: {
      task: taskJsonSchema,
      query: { type: "string", minLength: 1 },
      genres: { type: "array", items: { type: "string" } },
      topics: { type: "array", items: { type: "string" } },
      top_k: { type: "integer", minimum: 1, maximum: 15, default: 8 },
    },
  },
  songforge_get_output_template: {
    type: "object",
    additionalProperties: false,
    required: ["task"],
    properties: {
      task: taskJsonSchema,
    },
  },
  songforge_get_genre_playbook: {
    type: "object",
    additionalProperties: false,
    required: ["genre"],
    properties: {
      genre: { type: "string", minLength: 1 },
      task: { type: "string" },
    },
  },
  songforge_get_suno_style_cards: {
    type: "object",
    additionalProperties: false,
    required: ["genres"],
    properties: {
      genres: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 1 },
      },
      mood: { type: "string" },
      tempo_feel: { type: "string" },
    },
  },
  songforge_validate_suno_prompt: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string", minLength: 1 },
    },
  },
  songforge_score_lyrics: {
    type: "object",
    additionalProperties: false,
    required: ["lyrics"],
    properties: {
      lyrics: { type: "string", minLength: 1 },
      genre: { type: "string" },
      task: { type: "string" },
    },
  },
} as const;
