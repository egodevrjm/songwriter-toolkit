/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/mcp": ["./data/songwriting_corpus.jsonl", "./data/songwriting_manifest.json"]
  }
};

export default nextConfig;
