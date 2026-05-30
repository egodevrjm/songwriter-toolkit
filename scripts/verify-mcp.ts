import { callSongForgeTool } from "../lib/songforge/tools";

const examples = [
  {
    tool: "songforge_retrieve_context",
    args: {
      task: "new_song",
      query: "Write a dark synthpop song about nostalgia with a huge chorus.",
      genres: ["synthpop", "pop"],
      top_k: 5
    }
  },
  {
    tool: "songforge_get_suno_style_cards",
    args: {
      genres: ["boom bap", "orchestral trance", "symphonic black metal"],
      mood: "dramatic, nocturnal, high contrast",
      tempo_feel: "driving and cinematic"
    }
  },
  {
    tool: "songforge_score_lyrics",
    args: {
      task: "critique",
      lyrics: "I miss you every night\nI can’t find the light\nI need you by my side\nEverything will be alright."
    }
  },
  {
    tool: "songforge_retrieve_context",
    args: {
      task: "genre_transform",
      query: "Turn this lyric idea into Afrobeats heartbreak.",
      genres: ["afrobeats", "pop"],
      topics: ["lyrics"],
      top_k: 5
    }
  }
];

async function main() {
  for (const example of examples) {
    const result = await callSongForgeTool(example.tool, example.args);
    if (!result || (typeof result === "object" && "error" in result)) {
      throw new Error(`Verification failed for ${example.tool}: ${JSON.stringify(result)}`);
    }
    console.log(`✓ ${example.tool}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
