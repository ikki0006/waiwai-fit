import type { ProgressPublicRepository } from "~/domain/repositories/progressPublicRepository";
import type { ProgressPublic } from "~/domain/schemas/progress";

export class GetBoardUseCase {
	constructor(private readonly progressRepo: ProgressPublicRepository) {}

	async execute(loggedAt?: string): Promise<ProgressPublic[]> {
		if (loggedAt) return this.progressRepo.listByDate(loggedAt);
		return this.progressRepo.listLatestPerUser();
	}
}
