import type { ProfileRepository } from "~/domain/repositories/profileRepository";
import type { Profile, UpdateGoalsInput } from "~/domain/schemas/profile";

export class UpdateGoalsUseCase {
	constructor(private readonly profileRepo: ProfileRepository) {}

	async execute(userId: string, input: UpdateGoalsInput): Promise<Profile> {
		return this.profileRepo.updateGoals(userId, input);
	}
}
