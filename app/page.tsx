const toolNames = [
  "songforge_retrieve_context",
  "songforge_get_output_template",
  "songforge_get_genre_playbook",
  "songforge_get_suno_style_cards",
  "songforge_validate_suno_prompt",
  "songforge_score_lyrics"
];

export default function Home() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12, color: "#666" }}>SongForge</p>
      <h1 style={{ fontSize: 42, lineHeight: 1.05, margin: "0 0 16px" }}>MCP toolkit for songwriting context, templates and prompt craft.</h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: "#333" }}>
        The MCP endpoint is <code>/api/mcp</code>. SongForge keeps the LLM as the creative collaborator and provides compact,
        structured retrieval, genre playbooks, Suno prompt helpers and lyric scoring.
      </p>
      <h2 style={{ marginTop: 40 }}>Available tools</h2>
      <ul style={{ lineHeight: 1.9 }}>
        {toolNames.map((name) => (
          <li key={name}><code>{name}</code></li>
        ))}
      </ul>
    </main>
  );
}
