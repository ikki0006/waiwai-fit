import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
	console.error("[errorHandler]", err);
	const status = (err as { status?: number }).status ?? 500;
	return c.json(
		{
			error: err.message ?? "internal_server_error",
		},
		status as 500,
	);
};
