import { ORPCError } from "@orpc/client";

export type FieldErrors = Record<string, string[]>;

export type MutationError =
	| { type: "field"; fieldErrors: FieldErrors; message: string }
	| { type: "form"; code: string; message: string };

const FALLBACK_MESSAGE = "通信に失敗しました。時間をおいて再度お試しください。";

function extractFieldErrors(data: unknown): FieldErrors | null {
	if (!data || typeof data !== "object") return null;
	const candidate = (data as { fieldErrors?: unknown }).fieldErrors;
	if (!candidate || typeof candidate !== "object") return null;
	const out: FieldErrors = {};
	for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
		if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
			out[key] = value;
		}
	}
	return Object.keys(out).length > 0 ? out : null;
}

export function toMutationError(error: unknown): MutationError {
	if (error instanceof ORPCError) {
		const fieldErrors = extractFieldErrors(error.data);
		if (fieldErrors) {
			return { type: "field", fieldErrors, message: error.message || FALLBACK_MESSAGE };
		}
		return { type: "form", code: error.code, message: error.message || FALLBACK_MESSAGE };
	}
	const message = error instanceof Error ? error.message : FALLBACK_MESSAGE;
	return { type: "form", code: "UNKNOWN", message };
}

export function fieldErrorOf(err: MutationError | null | undefined, name: string): string | null {
	if (!err || err.type !== "field") return null;
	return err.fieldErrors[name]?.[0] ?? null;
}
