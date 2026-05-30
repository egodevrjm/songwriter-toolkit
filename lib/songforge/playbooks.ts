import type { SongForgeTask } from "./types";

type OutputTemplate = {
  template_name: string;
  sections: string[];
  formatting_rules: string[];
  recommended_response_shape: Record<string, unknown>;
};

type GenrePlaybook = {
  lyric_posture: string;
  structure: string;
  density: string;
  image_field: string;
  rhyme_repetition: string;
  avoid: string[];
  suno_style_notes: string[];
};

const DEFAULT_PLAYBOOK: GenrePlaybook = {
  lyric_posture: "Lead with a specific emotional situation, not a generic mood. Keep the singer's want legible in every section.",
  structure: "Use a familiar verse / pre / chorus / verse / bridge / chorus map unless the task asks for experiment.",
  density: "Medium density: enough detail for identity, enough space for melody.",
  image_field: "Concrete objects, locations, weather, body language, and one memorable visual turn.",
  rhyme_repetition: "Use rhyme as momentum, not decoration. Repeat the title or hook only where it gains power.",
  avoid: ["generic heartbreak language", "unearned grand statements", "AI-smooth phrasing", "overexplaining the metaphor"],
  suno_style_notes: ["name genre", "tempo feel", "vocal posture", "arrangement arc", "mix emphasis"]
};

export const GENRE_PLAYBOOKS: Record<string, GenrePlaybook> = {
  pop: {
    lyric_posture: "Immediate, conversational, title-forward, emotionally clear by the first two lines.",
    structure: "Short verse, fast pre-chorus lift, oversized chorus with a title line that can survive on TikTok.",
    density: "Low-to-medium lyric density; make every line singable and vowel-friendly.",
    image_field: "Neon, bedrooms, cars, phones, mirrors, city weather, intimate snapshots.",
    rhyme_repetition: "Clean repeated hook phrase; internal rhyme only where it increases bounce.",
    avoid: ["four lines saying the same thing", "cleverness that blocks melody", "choruses without a title anchor"],
    suno_style_notes: ["modern pop substyle", "clear chorus lift", "vocal-forward mix"]
  },
  country: {
    lyric_posture: "Plainspoken emotional truth with a physical setting and a human turn.",
    structure: "Narrative verse detail into a chorus that generalises the feeling without losing the scene.",
    density: "Medium density; image-rich verses, simpler chorus.",
    image_field: "Roads, kitchens, porches, bars, trucks, weather, family objects, place names.",
    rhyme_repetition: "Strong end rhymes and conversational near-rhymes; avoid nursery-rhyme neatness.",
    avoid: ["costume-country cliches", "empty small-town references", "too-perfect greeting-card morals"],
    suno_style_notes: ["acoustic/steel/fiddle choices", "country era or hybrid", "vocal upfront"]
  },
  hiphop: {
    lyric_posture: "Voice, stance and rhythmic authority first; concept should create bars, not slogans.",
    structure: "Verse-led with optional sung hook; use flow pockets, setup/payoff, and switch-ups.",
    density: "High density but controlled; leave room around punchlines and hook phrases.",
    image_field: "Specific social detail, status markers, street-level observation, humour, contradiction.",
    rhyme_repetition: "Multis, internals and cadence variation; repetition works as chant or emphasis.",
    avoid: ["fake toughness", "random flex lists", "bars that read well but do not land rhythmically"],
    suno_style_notes: ["drum feel", "bass weight", "sample/texture palette", "rap cadence"]
  },
  rap: {
    lyric_posture: "Voice, stance and rhythmic authority first; concept should create bars, not slogans.",
    structure: "Verse-led with optional sung hook; use flow pockets, setup/payoff, and switch-ups.",
    density: "High density but controlled; leave room around punchlines and hook phrases.",
    image_field: "Specific social detail, status markers, street-level observation, humour, contradiction.",
    rhyme_repetition: "Multis, internals and cadence variation; repetition works as chant or emphasis.",
    avoid: ["fake toughness", "random flex lists", "bars that read well but do not land rhythmically"],
    suno_style_notes: ["drum feel", "bass weight", "sample/texture palette", "rap cadence"]
  },
  grime: {
    lyric_posture: "Direct, kinetic, funny when it wants to be, but grounded in pressure and self-belief.",
    structure: "Hook or reload phrase, sharp 8/16-bar blocks, flow switches and call-response moments.",
    density: "High rhythmic density; short punchy images over long explanation.",
    image_field: "City movement, weather, buses, estates, studio rooms, family pressure, quick visual flexes.",
    rhyme_repetition: "Hard internals, reloadable one-liners, repeated phrase as crowd weapon.",
    avoid: ["Americanised slang drift", "overly polished pop wording", "too much explanation between punches"],
    suno_style_notes: ["140-ish energy", "square-wave bass or icy synths", "UK vocal bite", "tight drums"]
  },
  synthpop: {
    lyric_posture: "Melancholy made glamorous: intimate pain under bright machinery.",
    structure: "Atmospheric verse, rising pre, huge melodic chorus, optional post-chorus synth motif.",
    density: "Medium-low density; let the chorus breathe and repeat the emotional thesis.",
    image_field: "Old screens, night drives, sodium lights, photographs, analogue ghosts, chrome weather.",
    rhyme_repetition: "Elegant near-rhymes and hypnotic repetition; title should feel inevitable.",
    avoid: ["overly literal technology metaphors", "flat nostalgia", "choruses that stay at verse intensity"],
    suno_style_notes: ["analogue synths", "gated drums", "wide chorus", "nostalgic modern mix"]
  },
  afrobeats: {
    lyric_posture: "Body-led heartbreak: pain stays danceable, sensual and understated.",
    structure: "Hook-first loop logic, melodic verse phrases, repeated chantable title, light bridge or breakdown.",
    density: "Low-to-medium density; rhythm and vowel shape matter more than packed detail.",
    image_field: "Heat, late-night calls, movement, skin, drinks, crowded rooms, private ache.",
    rhyme_repetition: "Repetition is a feature. Use simple, sticky phrases and melodic call-backs.",
    avoid: ["overwritten poetry", "Western power-ballad chorus logic", "generic island/tropical cliches"],
    suno_style_notes: ["syncopated percussion", "warm bass", "guitar motif", "smooth melodic vocal"]
  },
  theatre: {
    lyric_posture: "Character want is the engine. Every line should reveal status, choice or contradiction.",
    structure: "Dramatic build: setup, self-argument, decision or reversal, button ending.",
    density: "High clarity with selective wit; lyrics can be denser if diction remains performable.",
    image_field: "Objects and places from the character's world; images should stage the scene.",
    rhyme_repetition: "Rhyme can be sharper and more formal, but must sound motivated by character.",
    avoid: ["generic inspirational monologue", "pop lyrics with no dramatic action", "rhymes that flatten character voice"],
    suno_style_notes: ["theatrical style", "character vocal type", "orchestration scale", "dramatic arc"]
  },
  edm: {
    lyric_posture: "Simple emotional trigger phrases that can survive drops, repetition and remixing.",
    structure: "Verse or topline fragment, pre-build, drop hook, post-drop chant, breakdown return.",
    density: "Low density; repetition and vowel openness are central.",
    image_field: "Light, motion, pressure, crowds, night air, physical release.",
    rhyme_repetition: "Loopable title phrases; avoid complex syntax around drops.",
    avoid: ["wordy verses", "ambiguous drop hook", "phrases that cannot loop"],
    suno_style_notes: ["subgenre", "drop type", "sidechain/bass energy", "topline clarity"]
  },
  rock: {
    lyric_posture: "Embodied conviction: pressure, release, defiance, confession or mythic scale.",
    structure: "Riff-aware verse, pre-lift or turnaround, chorus that sounds like a shouted truth.",
    density: "Medium density; strong verbs, sharp images, room for guitars.",
    image_field: "Concrete rooms, roads, storms, machines, blood/heat/fire only when earned.",
    rhyme_repetition: "Big chorus repetition, rough near-rhyme, avoid over-polished couplets.",
    avoid: ["vague rebellion", "stock fire imagery", "verses with no physical stakes"],
    suno_style_notes: ["guitar tone", "drum weight", "vocal grit", "chorus size"]
  }
};

const shape = (sections: string[]): Record<string, unknown> => ({ sections, notes_for_llm: "string[]", structured_output: true });

export const TEMPLATE_BY_TASK: Record<SongForgeTask, OutputTemplate> = {
  new_song: { template_name: "New Song Build", sections: ["brief", "retrieved_context", "creative_constraints", "draft_shape", "revision_targets"], formatting_rules: ["separate concept from lyric execution", "cite source and heading from matches"], recommended_response_shape: shape(["concept", "title_options", "section_map", "draft_notes"]) },
  rewrite: { template_name: "Lyric Rewrite Lab", sections: ["diagnosis", "preserve", "change", "line_level_moves", "next_revision_prompt"], formatting_rules: ["identify what works first", "keep POV stable unless asked"], recommended_response_shape: shape(["diagnosis", "keepers", "moves", "rewrite_brief"]) },
  critique: { template_name: "Song Critique", sections: ["headline_read", "scores", "strengths", "weaknesses", "highest_leverage_fix"], formatting_rules: ["direct but actionable", "separate craft issues from taste"], recommended_response_shape: shape(["summary", "scores", "top_strength", "biggest_fix"]) },
  suno_styles: { template_name: "Suno Styles Prompt Pack", sections: ["compact_prompt", "detailed_prompt", "arrangement_led_prompt", "advanced_exclude"], formatting_rules: ["prioritise sound over lyric content", "avoid impossible genre soup unless framed as fusion"], recommended_response_shape: shape(["compact_prompt_seed", "detailed_prompt_seed", "arrangement_led_seed", "advanced_exclude_suggestions"]) },
  genre_transform: { template_name: "Genre Transform", sections: ["source_intent", "target_genre_rules", "what_to_keep", "what_to_translate", "prompt_for_llm"], formatting_rules: ["translate craft behaviour, not just instrumentation", "protect emotional thesis"], recommended_response_shape: shape(["keep", "transform", "genre_constraints", "revision_prompt"]) },
  title_hook_lab: { template_name: "Title and Hook Lab", sections: ["title_axis", "hook_types", "candidate_shapes", "stress_test", "next_prompt"], formatting_rules: ["title must create a chorus job", "include singability tests"], recommended_response_shape: shape(["title_angles", "hook_tests", "prompt_pack"]) },
  rap_flow: { template_name: "Rap and Flow Support", sections: ["pocket", "cadence", "rhyme_system", "breath_map", "flow_revision"], formatting_rules: ["describe cadence without writing bars unless requested", "flag lines that cannot be performed"], recommended_response_shape: shape(["flow_notes", "rhyme_moves", "breath_notes"]) },
  theatre_character: { template_name: "Theatre Character Song", sections: ["character_want", "dramatic_turn", "voice_rules", "song_moment", "craft_notes"], formatting_rules: ["advance dramatic action", "avoid generic pop confession"], recommended_response_shape: shape(["want", "dramatic_arc", "voice_constraints"]) },
  suno_troubleshooting: { template_name: "Suno Troubleshooting", sections: ["problem", "likely_causes", "prompt_fixes", "arrangement_fixes", "advanced_exclude"], formatting_rules: ["fix one failure mode at a time", "separate style prompt from lyric prompt"], recommended_response_shape: shape(["diagnosis", "fixes", "improved_prompt", "advanced_exclude"]) },
  batch_prompt_library: { template_name: "Batch Prompt Library", sections: ["prompt_family", "variants", "controls", "quality_checks"], formatting_rules: ["make prompts parallel", "keep each variant compact"], recommended_response_shape: shape(["prompts", "control_terms", "notes"]) }
};

export function getGenrePlaybook(genre: string): GenrePlaybook {
  const key = genre.trim().toLowerCase();
  return GENRE_PLAYBOOKS[key] ?? DEFAULT_PLAYBOOK;
}
