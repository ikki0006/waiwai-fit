import type { ProgressPublicRepository } from "~/domain/repositories/progressPublicRepository";
import type { ProgressPublic } from "~/domain/schemas/progress";

export class GetBoardHistoryUseCase {
	constructor(private readonly progressRepo: ProgressPublicRepository) {}

	async execute(days: number): Promise<ProgressPublic[]> {
		const from = new Date();
		from.setUTCDate(from.getUTCDate() - (days - 1));
		const fromDate = from.toISOString().slice(0, 10);
		return this.progressRepo.listSince(fromDate);
	}
}
