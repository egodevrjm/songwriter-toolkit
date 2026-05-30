export type GenrePlaybook = {
  lyric_posture: string[];
  structure: string[];
  density: string;
  image_field: string[];
  rhyme_repetition: string[];
  avoid: string[];
  suno_style_notes: string[];
};

const basePlaybooks: Record<string, GenrePlaybook> = {
  pop: {
    lyric_posture: ["direct emotional thesis", "clean first-person language", "repeatable hook phrase"],
    structure: ["short intro", "verse / pre / chorus", "second verse escalates stakes", "bridge or post-chorus contrast"],
    density: "medium-low lyric density; leave room for melody and repetition",
    image_field: ["night drives", "phone light", "city weather", "memory objects", "body-language details"],
    rhyme_repetition: ["strong end-rhyme on hook words", "controlled internal rhyme", "title repeat with melodic variation"],
    avoid: ["overwritten metaphors", "too many plot points", "chorus lines longer than one breath"],
    suno_style_notes: ["clear lead vocal", "modern drum polish", "wide chorus lift", "radio-ready arrangement"],
  },
  synthpop: {
    lyric_posture: ["cool surface with emotional ache underneath", "nostalgia as neon memory", "precise melancholy"],
    structure: ["atmospheric intro", "tight verse", "pre-chorus lift", "huge chorus", "optional synth solo/post hook"],
    density: "medium density; sharp images with lots of negative space",
    image_field: ["neon", "rain glass", "old screens", "late-night streets", "photographs", "static", "headlights"],
    rhyme_repetition: ["repeat short hook phrases", "use vowel-rich long-note words", "avoid folk-style over-rhyming"],
    avoid: ["cyberpunk word soup", "generic sadness", "burying the chorus under production detail"],
    suno_style_notes: ["analog synth pads", "gated drums", "arpeggiated bass", "glossy melancholic lead vocal", "massive chorus"],
  },
  country: {
    lyric_posture: ["plain-spoken truth", "story-first perspective", "specific place/object detail"],
    structure: ["verse with scene", "chorus with title thesis", "verse two raises consequence", "bridge offers turn or confession"],
    density: "medium density; conversational lines must still sing easily",
    image_field: ["roads", "porches", "bars", "county lines", "weather", "truck radios", "family objects"],
    rhyme_repetition: ["natural rhyme over clever rhyme", "title repetition matters", "avoid forced perfect rhymes"],
    avoid: ["generic small-town cosplay", "listing objects without emotional stakes", "too much abstract therapy language"],
    suno_style_notes: ["acoustic guitar", "steel or fiddle colour", "intelligible vocal", "organic drum pocket"],
  },
  hiphop: {
    lyric_posture: ["voice-led authority", "rhythmic confidence", "specific lived detail"],
    structure: ["intro tag", "16-bar verse", "hook", "second verse or feature space", "outro/ad-lib"],
    density: "high density, but leave breath pockets before punchlines",
    image_field: ["street geography", "money/time pressure", "family history", "status symbols", "spiritual stakes"],
    rhyme_repetition: ["internal rhyme chains", "multi-syllabic families", "cadence variation every 4 bars"],
    avoid: ["monotone couplets", "punchlines with no setup", "borrowing slang without point of view"],
    suno_style_notes: ["drum pocket first", "bass weight", "dry lead vocal", "ad-lib space", "minimal clutter around the voice"],
  },
  rap: {
    lyric_posture: ["voice-led authority", "rhythmic confidence", "specific lived detail"],
    structure: ["hook or cold open", "16-bar verse", "hook", "second verse", "outro/ad-lib"],
    density: "high density with controlled breath and landing words",
    image_field: ["place", "pressure", "status", "family", "threats", "ambition", "contradiction"],
    rhyme_repetition: ["internal rhyme ladders", "end-rhyme variation", "switch cadence after every fourth bar"],
    avoid: ["flat end-rhyme couplets", "unearned bravado", "bars with no rhythmic mouthfeel"],
    suno_style_notes: ["tight drums", "clear vocal front", "space for ad-libs", "sub bass discipline"],
  },
  "boom bap": {
    lyric_posture: ["observational confidence", "street-corner wit", "lived-in detail"],
    structure: ["scratch/tag intro", "hook", "dense verse", "hook", "second verse", "outro loop"],
    density: "high lyric density; bars should snap against the snare",
    image_field: ["vinyl dust", "train lines", "corner shops", "old headphones", "city rain", "notebook pages"],
    rhyme_repetition: ["multisyllabic rhyme stacks", "internal rhyme", "call-back hook fragments"],
    avoid: ["trap hi-hat language", "melodic pop vagueness", "over-clean digital gloss"],
    suno_style_notes: ["dusty samples", "hard snare", "warm bassline", "DJ scratches", "dry intimate rap vocal"],
  },
  edm: {
    lyric_posture: ["simple emotional commands", "body-first language", "chorus phrases that survive repetition"],
    structure: ["intro", "build", "drop", "breakdown", "second build", "final drop"],
    density: "low lyric density; hook phrases should work as rhythm and texture",
    image_field: ["lights", "crowds", "pulse", "motion", "release", "midnight", "heat"],
    rhyme_repetition: ["repeat short imperatives", "avoid crowded rhymes before drops", "use vowel hooks"],
    avoid: ["verse-heavy storytelling", "complex plot", "too many genre modifiers"],
    suno_style_notes: ["clear tempo feel", "defined drop energy", "sidechain movement", "clean build/drop contrast"],
  },
  trance: {
    lyric_posture: ["ecstatic longing", "spiritual lift", "open vowels and simple emotional ascent"],
    structure: ["long intro", "progressive build", "breakdown", "anthemic lift", "final euphoric drop"],
    density: "low-to-medium lyric density; vocal phrases act like melodic mantras",
    image_field: ["sky", "stars", "light", "flight", "memory", "ocean", "horizon"],
    rhyme_repetition: ["repeat mantra hook", "elongated vowel endings", "avoid wordy choruses"],
    avoid: ["muddy dark imagery unless deliberately hybridised", "too many rhythmic lyrics", "unclear drop instruction"],
    suno_style_notes: ["euphoric supersaws", "driving kick", "orchestral lift if requested", "wide breakdown", "soaring female or male vocal"],
  },
  "black metal": {
    lyric_posture: ["mythic severity", "ritual intensity", "elemental imagery"],
    structure: ["cold intro", "blast-driven section", "tremolo riff movement", "ritual break", "climactic return"],
    density: "medium lyric density; images should feel carved, not explained",
    image_field: ["ice", "ash", "mountains", "cathedrals", "blood moons", "forests", "fire"],
    rhyme_repetition: ["loose rhyme is acceptable", "alliteration and incantatory repetition beat pop rhyme"],
    avoid: ["cartoon evil", "overly modern slang", "lyrics that fight the vocal texture"],
    suno_style_notes: ["tremolo guitars", "blast beats", "cold atmosphere", "harsh vocals", "avoid muddy low-end"],
  },
  afrobeats: {
    lyric_posture: ["sensual but emotionally light-footed", "heartbreak carried by groove", "melody-first phrasing"],
    structure: ["rhythmic intro", "verse", "pre/hook", "chorus", "post-hook refrain", "second verse"],
    density: "low-to-medium density; phrases should bounce and leave pocket space",
    image_field: ["heat", "dancefloor", "phone calls", "late taxis", "perfume", "rain on concrete", "gold light"],
    rhyme_repetition: ["short repeated phrases", "call-and-response", "soft internal rhyme over heavy couplets"],
    avoid: ["overwriting heartbreak", "square ballad phrasing", "crowding the percussion pocket"],
    suno_style_notes: ["syncopated percussion", "warm bass", "guitar or pluck motif", "smooth vocal stack", "danceable heartbreak"],
  },
  jazz: {
    lyric_posture: ["wry sophistication", "emotional ambiguity", "phrases that invite melodic interpretation"],
    structure: ["AABA or verse/chorus with room for solos", "turnaround-aware phrasing", "bridge with harmonic colour"],
    density: "medium density with conversational swing",
    image_field: ["clubs", "smoke", "rain", "late trains", "old letters", "blue light", "city rooms"],
    rhyme_repetition: ["slant rhyme", "internal rhyme", "phrases that sit across swing feel"],
    avoid: ["fake-cocktail cliches", "rhymes that flatten harmonic nuance", "too much plot"],
    suno_style_notes: ["upright bass", "brush drums", "piano voicings", "intimate vocal", "optional horn response"],
  },
  rock: {
    lyric_posture: ["physical emotion", "friction and release", "statement lines with grit"],
    structure: ["riff intro", "verse", "pre or lift", "chorus", "second verse", "bridge/solo", "final chorus"],
    density: "medium density; chorus should be shouted, not explained",
    image_field: ["roads", "electricity", "broken rooms", "weather", "sweat", "machines", "fire"],
    rhyme_repetition: ["hard consonant landings", "repeat title phrase", "leave space after big lines"],
    avoid: ["abstract angst", "weak verbs", "overly polite phrasing"],
    suno_style_notes: ["guitar-forward mix", "live drum energy", "strong bass movement", "big chorus guitars"],
  },
  theatre: {
    lyric_posture: ["character action over decorative emotion", "subtext made singable", "diction tied to status and want"],
    structure: ["setup", "want statement", "complication", "turn", "button or unresolved exit"],
    density: "variable density; denser verses can contrast with clear release lines",
    image_field: ["room-specific props", "gesture", "social status clues", "memory objects", "blocking/stage business"],
    rhyme_repetition: ["rhyme should reveal thought turns", "use repetition as obsession or decision"],
    avoid: ["generic pop language", "no dramatic movement", "pretty lines with no action"],
    suno_style_notes: ["clear vocal acting", "arrangement follows dramatic turn", "avoid overproduced pop unless intentional"],
  },
};

const aliases: Record<string, string> = {
  "hip-hop": "hiphop",
  hiphop: "hiphop",
  "symphonic black metal": "black metal",
  "orchestral trance": "trance",
  "r&b": "pop",
  rb: "pop",
  musical: "theatre",
  "musical theatre": "theatre",
};

export function getGenrePlaybook(genre: string): GenrePlaybook {
  const key = genre.trim().toLowerCase();
  const normalised = aliases[key] ?? key;

  if (basePlaybooks[normalised]) return basePlaybooks[normalised];

  for (const [known, playbook] of Object.entries(basePlaybooks)) {
    if (normalised.includes(known) || known.includes(normalised)) return playbook;
  }

  return {
    lyric_posture: ["define a clear point of view", "use genre-specific language without parody", "make the hook emotionally legible"],
    structure: ["choose a familiar target-genre structure", "make contrast between sections obvious", "put the title in the highest-impact section"],
    density: "medium density until the target genre demands otherwise",
    image_field: ["specific objects", "time", "place", "weather", "body language", "memory detail"],
    rhyme_repetition: ["use repeatable hook language", "vary rhyme pressure by section", "test every line out loud"],
    avoid: ["generic genre labels with no craft choices", "contradictory tempo/arrangement notes", "cliches without a personal angle"],
    suno_style_notes: [`name ${genre} clearly`, "add instrumentation", "add vocal posture", "state tempo feel", "separate excludes"],
  };
}
