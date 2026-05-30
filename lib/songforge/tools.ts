import {
  GenrePlaybookInputSchema,
  OutputTemplateInputSchema,
  RetrieveContextInputSchema,
  ScoreLyricsInputSchema,
  SunoStyleCardsInputSchema,
  ValidateSunoPromptInputSchema,
  toolInputSchemas,
  zodErrorToMessage,
} from "./schemas";
import { retrieveContext, corpusStats } from "./corpus";
import { getOutputTemplate, suggestedOutputMode } from "./templates";
import { getGenrePlaybook } from "./playbooks";
import { getSunoStyleCards, validateSunoPrompt } from "./suno";
import { scoreLyrics } from "./scoring";

export type SongForgeToolName =
  | "songforge_retrieve_context"
  | "songforge_get_output_template"
  | "songforge_get_genre_playbook"
  | "songforge_get_suno_style_cards"
  | "songforge_validate_suno_prompt"
  | "songforge_score_lyrics";

export type ToolDefinition = {
  name: SongForgeToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "songforge_retrieve_context",
    title: "Retrieve SongForge context",
    description:
      "Retrieve compact, citeable songwriting corpus chunks for a specific creative task. Returns context only; the host LLM remains the creative writer.",
    inputSchema: toolInputSchemas.songforge_retrieve_context,
  },
  {
    name: "songforge_get_output_template",
    title: "Get SongForge output template",
    description:
      "Return the recommended response shape, sections, and formatting rules for a SongForge task.",
    inputSchema: toolInputSchemas.songforge_get_output_template,
  },
  {
    name: "songforge_get_genre_playbook",
    title: "Get genre playbook",
    description:
      "Return a compact genre/style playbook covering lyric posture, structure, density, imagery, rhyme/repetition, avoid list, and Suno notes.",
    inputSchema: toolInputSchemas.songforge_get_genre_playbook,
  },
  {
    name: "songforge_get_suno_style_cards",
    title: "Build Suno style cards",
    description:
      "Build compact, detailed, and arrangement-led Suno style prompt seeds from one or more genres plus optional mood and tempo feel.",
    inputSchema: toolInputSchemas.songforge_get_suno_style_cards,
  },
  {
    name: "songforge_validate_suno_prompt",
    title: "Validate Suno prompt",
    description:
      "Score a Suno Styles prompt, identify missing elements/conflicts, and return an improved prompt plus advanced exclude suggestions.",
    inputSchema: toolInputSchemas.songforge_validate_suno_prompt,
  },
  {
    name: "songforge_score_lyrics",
    title: "Score lyrics",
    description:
      "Score lyrics across craft dimensions and return the top strength, biggest fix, and next revision prescription.",
    inputSchema: toolInputSchemas.songforge_score_lyrics,
  },
];

export function listToolDefinitions(): ToolDefinition[] {
  return toolDefinitions;
}

export async function callSongForgeTool(name: string, rawInput: unknown): Promise<unknown> {
  switch (name) {
    case "songforge_retrieve_context": {
      const parsed = RetrieveContextInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      const { matches, warnings } = retrieveContext(parsed.data);
      const stats = corpusStats();
      return {
        matches,
        suggested_output_mode: suggestedOutputMode(parsed.data.task),
        warnings,
        usage_notes: [
          "Use matches as source-backed guidance, not as final lyrics.",
          "Cite matches by source and heading if their guidance influences the host LLM response.",
          `Corpus currently contains ${stats.total_chunks} chunks from ${stats.source_files} source files.`,
        ],
      };
    }

    case "songforge_get_output_template": {
      const parsed = OutputTemplateInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      return getOutputTemplate(parsed.data.task);
    }

    case "songforge_get_genre_playbook": {
      const parsed = GenrePlaybookInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      const playbook = getGenrePlaybook(parsed.data.genre);
      return {
        genre: parsed.data.genre,
        task: parsed.data.task ?? null,
        ...playbook,
      };
    }

    case "songforge_get_suno_style_cards": {
      const parsed = SunoStyleCardsInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      return getSunoStyleCards(parsed.data);
    }

    case "songforge_validate_suno_prompt": {
      const parsed = ValidateSunoPromptInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      return validateSunoPrompt(parsed.data);
    }

    case "songforge_score_lyrics": {
      const parsed = ScoreLyricsInputSchema.safeParse(rawInput ?? {});
      if (!parsed.success) throw new Error(zodErrorToMessage(parsed.error));
      return scoreLyrics(parsed.data);
    }

    default:
      throw new Error(`Unknown SongForge tool: ${name}`);
  }
}
