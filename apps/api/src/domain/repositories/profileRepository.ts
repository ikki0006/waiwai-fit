import type { OnboardingInput, Profile, UpdateGoalsInput } from "~/domain/schemas/profile";

export interface ProfileRepository {
	findByUserId(userId: string): Promise<Profile | null>;
	create(userId: string, email: string, input: OnboardingInput): Promise<Profile>;
	updateGoals(userId: string, input: UpdateGoalsInput): Promise<Profile>;
	updateSlackUserId(userId: string, slackUserId: string): Promise<void>;
}
