import { callSongForgeTool, listToolDefinitions } from "../lib/songforge/tools";

async function main() {
  console.log(`SongForge MCP tools: ${listToolDefinitions().map((tool) => tool.name).join(", ")}`);

  const checks = [
    {
      name: "dark synthpop retrieval",
      tool: "songforge_retrieve_context",
      input: {
        task: "new_song",
        query: "Write a dark synthpop song about nostalgia with a huge chorus.",
        genres: ["synthpop", "pop"],
        topics: ["hooks", "structure"],
        top_k: 5,
      },
    },
    {
      name: "Suno hybrid style cards",
      tool: "songforge_get_suno_style_cards",
      input: {
        genres: ["boom bap", "orchestral trance", "symphonic black metal"],
        mood: "cinematic, intense, nocturnal",
        tempo_feel: "driving midtempo with a climactic lift",
      },
    },
    {
      name: "chorus critique scoring",
      tool: "songforge_score_lyrics",
      input: {
        task: "critique",
        lyrics:
          "I miss you every night\nI can’t find the light\nI need you by my side\nEverything will be alright.",
        genre: "pop",
      },
    },
    {
      name: "Afrobeats heartbreak transform context",
      tool: "songforge_get_genre_playbook",
      input: {
        genre: "Afrobeats",
        task: "genre_transform",
      },
    },
  ];

  for (const check of checks) {
    const result = await callSongForgeTool(check.tool, check.input);
    const serialised = JSON.stringify(result);
    if (!serialised || serialised.length < 20) {
      throw new Error(`Verification failed for ${check.name}: empty result`);
    }
    console.log(`✓ ${check.name}`);
  }

  console.log("All SongForge MCP verification checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
