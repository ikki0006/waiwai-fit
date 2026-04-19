import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import type { ORPCContext } from "~/router/context";

const base = os.$context<ORPCContext>();

// 予約: MCPサーバは後付け実装。現状は 501 を返す。
const info = base
	.route({ method: "GET", path: "/mcp", tags: ["MCP"] })
	.output(z.object({ status: z.string() }))
	.handler(async () => {
		throw new ORPCError("NOT_IMPLEMENTED", { message: "MCP endpoint is reserved" });
	});

export const mcpRouter = { info };
