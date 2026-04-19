import { z } from "zod";

export const ProfileSchema = z.object({
	userId: z.string().uuid(),
	email: z.string().email(),
	displayName: z.string().min(1),
	avatarUrl: z.string().url().nullable(),
	slackUserId: z.string().nullable(),
	startWeight: z.number().positive(),
	goalWeight: z.number().positive(),
	startedAt: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const OnboardingInputSchema = z
	.object({
		displayName: z.string().min(1),
		avatarUrl: z.string().url().nullable().optional(),
		startWeight: z.number().positive(),
		goalWeight: z.number().positive(),
	})
	.refine((v) => v.goalWeight < v.startWeight, {
		message: "goalWeight must be less than startWeight",
		path: ["goalWeight"],
	});
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

export const UpdateGoalsInputSchema = z
	.object({
		startWeight: z.number().positive().optional(),
		goalWeight: z.number().positive().optional(),
	})
	.refine((v) => !(v.startWeight && v.goalWeight) || v.goalWeight < v.startWeight, {
		message: "goalWeight must be less than startWeight",
		path: ["goalWeight"],
	});
export type UpdateGoalsInput = z.infer<typeof UpdateGoalsInputSchema>;
