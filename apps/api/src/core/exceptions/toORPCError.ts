import { ORPCError } from "@orpc/server";

export function toORPCError(error: unknown): ORPCError<string, unknown> {
	if (error instanceof ORPCError) return error;
	const message = error instanceof Error ? error.message : "internal_server_error";
	return new ORPCError("INTERNAL_SERVER_ERROR", { message });
}
