import { SongForgeTask } from "./schemas";

export type OutputTemplate = {
  template_name: string;
  sections: string[];
  formatting_rules: string[];
  recommended_response_shape: Record<string, unknown>;
};

const templates: Record<SongForgeTask, OutputTemplate> = {
  new_song: {
    template_name: "SongForge New Song Brief",
    sections: ["Creative brief", "Title/hook options", "Structure map", "Drafting constraints", "Source-backed notes"],
    formatting_rules: [
      "Keep the MCP output as guidance, not finished lyrics.",
      "Return compact bullets and cite source/heading ids where context is used.",
      "Separate lyric craft advice from production/Suno advice.",
    ],
    recommended_response_shape: {
      concept: "one sentence",
      titles: "array of 6-12 candidate hooks",
      sections: ["verse", "pre-chorus", "chorus", "bridge"],
      citations: "source + heading per guidance item",
    },
  },
  rewrite: {
    template_name: "SongForge Rewrite Clinic",
    sections: ["Original intent", "Problem diagnosis", "Revision targets", "Line-level craft notes", "Next pass checklist"],
    formatting_rules: [
      "Do not rewrite everything by default.",
      "Preserve the user's point of view unless asked to transform it.",
      "Call out prosody, cliche, rhyme pressure, and emotional logic separately.",
    ],
    recommended_response_shape: {
      diagnosis: "array of concise issues",
      keep: "best existing line or idea",
      revision_plan: "3-5 targeted moves",
      optional_rewrite: "only if requested by the host LLM/user",
    },
  },
  critique: {
    template_name: "SongForge Critique Rubric",
    sections: ["Overall read", "Scores", "Biggest strength", "Biggest fix", "Revision prescription"],
    formatting_rules: [
      "Be direct but useful.",
      "Score craft dimensions separately rather than giving one vague opinion.",
      "Prioritise the next revision step.",
    ],
    recommended_response_shape: {
      scores: "object of 1-10 craft scores",
      top_strength: "single sentence",
      biggest_fix: "single sentence",
      suggested_next_revision: "ordered list",
    },
  },
  suno_styles: {
    template_name: "SongForge Suno Styles Prompt Pack",
    sections: ["Compact style seed", "Detailed style seed", "Arrangement-led seed", "Advanced exclude"],
    formatting_rules: [
      "No lyric generation.",
      "Use comma-rich musical descriptors.",
      "Avoid contradictory production instructions.",
      "Keep advanced exclude separate from the main prompt.",
    ],
    recommended_response_shape: {
      compact_prompt_seed: "one line",
      detailed_prompt_seed: "one paragraph",
      arrangement_led_seed: "one paragraph",
      advanced_exclude_suggestions: "array",
    },
  },
  genre_transform: {
    template_name: "SongForge Genre Transform Map",
    sections: ["Original emotional core", "Target genre posture", "Structure changes", "Language changes", "Production notes"],
    formatting_rules: [
      "Preserve the core story while changing surface language and rhythmic behaviour.",
      "Explain what changes and what must stay stable.",
      "Do not flatten the target genre into stereotypes.",
    ],
    recommended_response_shape: {
      keep: "core emotion/story",
      transform: "genre-specific craft moves",
      avoid: "genre cliches and mismatch risks",
    },
  },
  title_hook_lab: {
    template_name: "SongForge Title & Hook Lab",
    sections: ["Hook patterns", "Candidate titles", "Chorus thesis", "Memorability tests"],
    formatting_rules: [
      "Generate options in distinct pattern families.",
      "Label title types: plea, paradox, image, thesis, twist.",
      "Reject titles that are too abstract or unsingable.",
    ],
    recommended_response_shape: {
      candidates: "array with title + pattern + why it works",
      shortlist: "top 3",
      stress_test: "breath length, clarity, repeatability",
    },
  },
  rap_flow: {
    template_name: "SongForge Rap Flow Builder",
    sections: ["Pocket", "Rhyme architecture", "Cadence notes", "Punchline density", "Breath map"],
    formatting_rules: [
      "Separate flow/cadence from lyric subject.",
      "Use bar-level guidance and rhyme-family notes.",
      "Flag overstuffed lines and weak landing words.",
    ],
    recommended_response_shape: {
      pocket: "tempo feel + rhythmic placement",
      rhyme_scheme: "internal/end rhyme plan",
      flow_notes: "bar-by-bar guidance",
    },
  },
  theatre_character: {
    template_name: "SongForge Theatre Character Song Brief",
    sections: ["Dramatic want", "Subtext", "Before/after state", "Musical posture", "Staging-aware lyric notes"],
    formatting_rules: [
      "Anchor every song choice in character action.",
      "Make the final chorus or reprise reveal a changed state.",
      "Avoid pop-generic lines unless they serve the character.",
    ],
    recommended_response_shape: {
      i_want: "character objective",
      turn: "where the song changes",
      lyric_rules: "diction/image constraints",
    },
  },
  suno_troubleshooting: {
    template_name: "SongForge Suno Troubleshooting Checklist",
    sections: ["Prompt diagnosis", "Likely failure mode", "Repair prompt", "Advanced exclude", "Iteration plan"],
    formatting_rules: [
      "Name the conflict before rewriting the prompt.",
      "Keep the repair prompt shorter than the diagnosis.",
      "Use advanced exclude for unwanted vocals, genres, mix traits, and artifacts.",
    ],
    recommended_response_shape: {
      issue: "main prompt weakness",
      fix: "improved prompt",
      exclude: "array of avoid terms",
      next_test: "one A/B variation",
    },
  },
  batch_prompt_library: {
    template_name: "SongForge Batch Prompt Library Builder",
    sections: ["Prompt family", "Variables", "Reusable template", "Examples", "Quality gates"],
    formatting_rules: [
      "Return reusable prompt packs, not one-off prose.",
      "Expose variables clearly.",
      "Keep each prompt short enough to paste into the target tool.",
    ],
    recommended_response_shape: {
      prompt_family: "name",
      variables: "object",
      prompts: "array of compact templates",
      checks: "array of quality gates",
    },
  },
};

export function getOutputTemplate(task: SongForgeTask): OutputTemplate {
  return templates[task];
}

export function suggestedOutputMode(task: SongForgeTask): string {
  const modes: Record<SongForgeTask, string> = {
    new_song: "creative_brief_with_source_backed_context",
    rewrite: "revision_plan_then_optional_lines",
    critique: "rubric_scores_plus_next_revision",
    suno_styles: "prompt_pack",
    genre_transform: "transformation_map",
    title_hook_lab: "title_and_hook_candidates",
    rap_flow: "flow_and_rhyme_blueprint",
    theatre_character: "dramatic_song_brief",
    suno_troubleshooting: "diagnosis_and_repair_prompt",
    batch_prompt_library: "reusable_prompt_templates",
  };
  return modes[task];
}
