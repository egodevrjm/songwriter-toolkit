import { z } from "zod";
import { TASKS } from "./types";

export const taskSchema = z.enum(TASKS);

export const retrieveContextSchema = z.object({
  task: taskSchema,
  query: z.string().min(1).max(1200),
  genres: z.array(z.string().min(1)).max(12).optional(),
  topics: z.array(z.string().min(1)).max(12).optional(),
  top_k: z.number().int().min(1).max(15).default(8).optional()
});

export const outputTemplateSchema = z.object({
  task: taskSchema
});

export const genrePlaybookSchema = z.object({
  genre: z.string().min(1).max(80),
  task: z.string().min(1).max(80).optional()
});

export const sunoStyleCardsSchema = z.object({
  genres: z.array(z.string().min(1)).min(1).max(8),
  mood: z.string().min(1).max(160).optional(),
  tempo_feel: z.string().min(1).max(160).optional()
});

export const validateSunoPromptSchema = z.object({
  prompt: z.string().min(1).max(2000)
});

export const scoreLyricsSchema = z.object({
  lyrics: z.string().min(1).max(12000),
  genre: z.string().min(1).max(80).optional(),
  task: z.string().min(1).max(80).optional()
});

export type RetrieveContextInput = z.infer<typeof retrieveContextSchema>;
export type OutputTemplateInput = z.infer<typeof outputTemplateSchema>;
export type GenrePlaybookInput = z.infer<typeof genrePlaybookSchema>;
export type SunoStyleCardsInput = z.infer<typeof sunoStyleCardsSchema>;
export type ValidateSunoPromptInput = z.infer<typeof validateSunoPromptSchema>;
export type ScoreLyricsInput = z.infer<typeof scoreLyricsSchema>;
