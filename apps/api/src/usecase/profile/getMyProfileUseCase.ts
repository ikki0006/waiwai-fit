import type { ProfileRepository } from "~/domain/repositories/profileRepository";
import type { Profile } from "~/domain/schemas/profile";

export class GetMyProfileUseCase {
	constructor(private readonly profileRepo: ProfileRepository) {}

	async execute(userId: string): Promise<Profile | null> {
		return this.profileRepo.findByUserId(userId);
	}
}
