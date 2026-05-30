import { NextRequest, NextResponse } from "next/server";
import { TOOL_DEFINITIONS, callSongForgeTool } from "@/lib/songforge/tools";
import { corpusStats } from "@/lib/songforge/corpus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

async function handleRpc(message: JsonRpcRequest) {
  const id = message.id ?? null;

  switch (message.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "songforge-mcp",
          version: "0.1.0"
        }
      });

    case "notifications/initialized":
      return rpcResult(id, { ok: true });

    case "tools/list":
      return rpcResult(id, { tools: TOOL_DEFINITIONS });

    case "tools/call": {
      const params = message.params ?? {};
      const name = typeof params.name === "string" ? params.name : "";
      const args = typeof params.arguments === "object" && params.arguments !== null ? params.arguments : {};
      if (!name) return rpcError(id, -32602, "tools/call requires params.name");

      const output = await callSongForgeTool(name, args);
      const isToolError = typeof output === "object" && output !== null && "error" in output;

      return rpcResult(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
          }
        ],
        structuredContent: output,
        isError: isToolError
      });
    }

    default:
      return rpcError(id, -32601, `Unsupported MCP method: ${message.method ?? "missing method"}`);
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      name: "songforge-mcp",
      endpoint: "/api/mcp",
      protocol: "MCP JSON-RPC over HTTP",
      tools: TOOL_DEFINITIONS.map((tool) => tool.name),
      corpus: corpusStats()
    });
  } catch (error) {
    return NextResponse.json(
      {
        name: "songforge-mcp",
        endpoint: "/api/mcp",
        error: error instanceof Error ? error.message : "Unable to load corpus"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: JsonRpcRequest | JsonRpcRequest[];

  try {
    body = (await request.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Invalid JSON request body."), { status: 400 });
  }

  try {
    if (Array.isArray(body)) {
      const responses = await Promise.all(body.map(handleRpc));
      return NextResponse.json(responses);
    }

    const response = await handleRpc(body);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      rpcError(null, -32603, "SongForge MCP internal error.", error instanceof Error ? error.message : error),
      { status: 500 }
    );
  }
}
