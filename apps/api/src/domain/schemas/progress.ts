import { z } from "zod";

export const ProgressPublicSchema = z.object({
	userId: z.string().uuid(),
	displayName: z.string(),
	avatarUrl: z.string().url().nullable(),
	slackUserId: z.string().nullable(),
	loggedAt: z.string(),
	progressFromStartPct: z.number(),
	goalAchievementPct: z.number(),
	weeklyDeltaPct: z.number().nullable(),
	streakDays: z.number().int(),
	updatedAt: z.string(),
});
export type ProgressPublic = z.infer<typeof ProgressPublicSchema>;
