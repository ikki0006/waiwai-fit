import type { ProfileRepository } from "~/domain/repositories/profileRepository";
import type { OnboardingInput, Profile } from "~/domain/schemas/profile";
import type { SlackService } from "~/domain/services/slackService";

export class CompleteOnboardingUseCase {
	constructor(
		private readonly profileRepo: ProfileRepository,
		private readonly slack: SlackService,
	) {}

	async execute(userId: string, email: string, input: OnboardingInput): Promise<Profile> {
		const existing = await this.profileRepo.findByUserId(userId);
		if (existing) return existing;

		const profile = await this.profileRepo.create(userId, email, input);

		// Slack User ID をメールで自動補完(失敗は無視)
		try {
			const slackUserId = await this.slack.lookupUserIdByEmail(email);
			if (slackUserId) {
				await this.profileRepo.updateSlackUserId(userId, slackUserId);
				return { ...profile, slackUserId };
			}
		} catch (err) {
			console.warn("[onboarding] slack lookup failed", err);
		}
		return profile;
	}
}
