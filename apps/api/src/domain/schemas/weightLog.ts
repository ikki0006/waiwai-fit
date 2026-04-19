import { z } from "zod";

export const WeightLogSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	loggedAt: z.string(),
	weightKg: z.number().positive(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type WeightLog = z.infer<typeof WeightLogSchema>;

export const RecordWeightInputSchema = z.object({
	weightKg: z.number().positive(),
	loggedAt: z.string().optional(),
});
export type RecordWeightInput = z.infer<typeof RecordWeightInputSchema>;
