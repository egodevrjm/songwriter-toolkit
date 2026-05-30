export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "4rem auto", padding: "0 1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>SongForge MCP</h1>
      <p>
        SongForge is running. The MCP endpoint is <code>/api/mcp</code>.
      </p>
      <p>
        This app exposes structured songwriting retrieval, templates, genre playbooks, Suno prompt helpers,
        validators and lyric scoring. The host LLM remains the creative composition layer.
      </p>
    </main>
  );
}
