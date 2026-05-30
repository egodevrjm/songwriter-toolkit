import { NextRequest, NextResponse } from "next/server";
import { callSongForgeTool, listToolDefinitions } from "@/lib/songforge/tools";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string; data?: unknown } };

const SERVER_INFO = {
  name: "songforge-mcp",
  version: "0.1.0",
};

const PROTOCOL_VERSION = "2025-06-18";

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function textToolResult(result: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
    isError: false,
  };
}

async function handleMessage(message: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  if (!message || typeof message !== "object") {
    return jsonRpcError(null, -32600, "Invalid JSON-RPC request.");
  }

  const id = message.id ?? null;
  const method = message.method;

  if (!method) {
    return jsonRpcError(id, -32600, "Missing JSON-RPC method.");
  }

  const isNotification = message.id === undefined || message.id === null;

  try {
    switch (method) {
      case "initialize": {
        const clientProtocolVersion =
          typeof message.params?.protocolVersion === "string"
            ? message.params.protocolVersion
            : PROTOCOL_VERSION;

        return jsonRpcResult(id, {
          protocolVersion: clientProtocolVersion,
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: SERVER_INFO,
          instructions:
            "SongForge provides structured songwriting memory, retrieval, templates, validators, scoring helpers and Suno prompt-pack builders. It does not generate final songs; the host LLM remains the creative writing layer.",
        });
      }

      case "notifications/initialized":
        return isNotification ? null : jsonRpcResult(id, { ok: true });

      case "ping":
        return jsonRpcResult(id, {});

      case "tools/list":
        return jsonRpcResult(id, { tools: listToolDefinitions() });

      case "tools/call": {
        const name = typeof message.params?.name === "string" ? message.params.name : "";
        const args = message.params?.arguments ?? {};
        if (!name) return jsonRpcError(id, -32602, "tools/call requires params.name.");
        const result = await callSongForgeTool(name, args);
        return jsonRpcResult(id, textToolResult(result));
      }

      default:
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    return jsonRpcError(id, -32000, error instanceof Error ? error.message : "SongForge tool failed.");
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    endpoint: "/api/mcp",
    tools: listToolDefinitions().map((tool) => tool.name),
  });
}

export async function POST(request: NextRequest) {
  let payload: JsonRpcRequest | JsonRpcRequest[];

  try {
    payload = (await request.json()) as JsonRpcRequest | JsonRpcRequest[];
  } catch {
    return NextResponse.json(jsonRpcError(null, -32700, "Parse error: expected JSON body."), {
      status: 400,
    });
  }

  const messages = Array.isArray(payload) ? payload : [payload];
  const responses = (await Promise.all(messages.map(handleMessage))).filter(
    (response): response is JsonRpcResponse => response !== null
  );

  if (!responses.length) {
    return new NextResponse(null, { status: 202 });
  }

  return NextResponse.json(Array.isArray(payload) ? responses : responses[0], {
    headers: {
      "MCP-Protocol-Version": PROTOCOL_VERSION,
    },
  });
}
