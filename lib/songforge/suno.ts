import { SunoStyleCardsInput, ValidateSunoPromptInput } from "./schemas";
import { getGenrePlaybook } from "./playbooks";

const CONTRADICTIONS = [
  ["slow", "fast"],
  ["minimal", "maximal"],
  ["acoustic", "industrial"],
  ["lo-fi", "hi-fi"],
  ["instrumental", "lead vocal"],
  ["soft", "aggressive"],
];

function cleanList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sentenceCase(value: string): string {
  return value.trim().replace(/^\w/, (char) => char.toUpperCase());
}

export function getSunoStyleCards(input: SunoStyleCardsInput) {
  const genres = cleanList(input.genres);
  const playbooks = genres.map((genre) => ({ genre, playbook: getGenrePlaybook(genre) }));

  const instrumentation = cleanList(
    playbooks.flatMap(({ playbook }) => playbook.suno_style_notes).slice(0, 12)
  );
  const imageTone = cleanList(playbooks.flatMap(({ playbook }) => playbook.image_field).slice(0, 10));
  const avoid = cleanList(playbooks.flatMap(({ playbook }) => playbook.avoid).slice(0, 10));

  const mood = input.mood?.trim() || "emotionally vivid";
  const tempo = input.tempo_feel?.trim() || "clear, song-serving tempo feel";
  const genreString = genres.join(", ");

  return {
    compact_prompt_seed: `${genreString}, ${mood}, ${tempo}, strong lead vocal, memorable chorus, clean modern mix`,
    detailed_prompt_seed: [
      `${sentenceCase(genreString)} hybrid with ${mood} emotional posture and ${tempo}.`,
      `Use ${instrumentation.slice(0, 6).join(", ")}.`,
      `Keep the song hook-forward, vocalist-led, and structurally clear.`,
      `Imagery palette: ${imageTone.slice(0, 6).join(", ")}.`,
    ].join(" "),
    arrangement_led_seed: [
      `Arrangement starts from ${instrumentation.slice(0, 3).join(", ")}.`,
      `Build section contrast before the chorus/drop, keep vocals intelligible, and let the highest-energy moment carry the title or central hook.`,
      `Blend genres by assigning each one a job rather than stacking everything at once: rhythm, harmony, vocal attitude, texture, and climax.`,
    ].join(" "),
    advanced_exclude_suggestions: cleanList([
      "muddy mix",
      "unintelligible vocals",
      "flat chorus",
      "generic lyrics",
      "awkward tempo changes",
      ...avoid.slice(0, 8),
    ]),
  };
}

function includesAny(prompt: string, words: string[]): boolean {
  return words.some((word) => prompt.includes(word));
}

export function validateSunoPrompt(input: ValidateSunoPromptInput) {
  const prompt = input.prompt.trim();
  const lower = prompt.toLowerCase();

  const missing_elements: string[] = [];
  if (!includesAny(lower, ["pop", "rock", "country", "rap", "hip", "edm", "trance", "metal", "jazz", "afrobeats", "synth", "folk", "r&b"])) {
    missing_elements.push("clear genre or genre blend");
  }
  if (!includesAny(lower, ["sad", "dark", "happy", "euphoric", "nostalgic", "romantic", "angry", "melancholic", "uplifting", "heartbreak", "moody"])) {
    missing_elements.push("mood/emotional posture");
  }
  if (!includesAny(lower, ["slow", "midtempo", "fast", "tempo", "driving", "laid-back", "danceable", "ballad", "bpm"])) {
    missing_elements.push("tempo or groove feel");
  }
  if (!includesAny(lower, ["vocal", "singer", "rap", "falsetto", "baritone", "female", "male", "choir", "harmony"])) {
    missing_elements.push("vocal identity");
  }
  if (!includesAny(lower, ["guitar", "piano", "synth", "drum", "bass", "strings", "orchestra", "808", "percussion", "steel", "fiddle", "pad"])) {
    missing_elements.push("instrumentation/arrangement detail");
  }
  if (!includesAny(lower, ["chorus", "hook", "verse", "bridge", "drop", "build", "intro", "outro"])) {
    missing_elements.push("structure or hook instruction");
  }

  const conflicts = CONTRADICTIONS.filter(([a, b]) => lower.includes(a) && lower.includes(b)).map(
    ([a, b]) => `Potential conflict: "${a}" and "${b}" both appear.`
  );

  const improvements = [
    prompt,
    missing_elements.includes("clear genre or genre blend") ? "Specify the primary genre and one secondary influence." : "",
    missing_elements.includes("mood/emotional posture") ? "Add a clear mood such as nostalgic, euphoric, dark, intimate, or heartbroken." : "",
    missing_elements.includes("tempo or groove feel") ? "Add tempo feel, e.g. midtempo, driving, slow-burn, danceable, or 120 BPM." : "",
    missing_elements.includes("vocal identity") ? "Define vocal posture: intimate male vocal, airy female lead, dry rap vocal, stacked harmonies, etc." : "",
    missing_elements.includes("instrumentation/arrangement detail") ? "Name the core instruments and mix texture." : "",
    missing_elements.includes("structure or hook instruction") ? "Add a structural goal: huge chorus, post-hook refrain, breakdown/drop, or bridge lift." : "",
  ].filter(Boolean);

  const score = Math.max(1, Math.min(10, 10 - missing_elements.length - conflicts.length));

  return {
    score,
    missing_elements,
    conflicts,
    improved_prompt: improvements.join(" "),
    advanced_exclude: cleanList([
      "muddy mix",
      "unintelligible vocals",
      "generic lyrics",
      "flat chorus",
      conflicts.length ? "contradictory tempo/genre instructions" : "",
      lower.includes("metal") ? "weak guitars" : "",
      lower.includes("rap") || lower.includes("hip") ? "off-beat rap flow" : "",
      lower.includes("trance") || lower.includes("edm") ? "weak drop" : "",
    ]),
  };
}
