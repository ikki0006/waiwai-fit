import type { WeightLogRepository } from "~/domain/repositories/weightLogRepository";
import type { WeightLog } from "~/domain/schemas/weightLog";

export class GetMyHistoryUseCase {
	constructor(private readonly weightLogRepo: WeightLogRepository) {}

	async execute(userId: string, limit = 90): Promise<WeightLog[]> {
		return this.weightLogRepo.listByUser(userId, limit);
	}
}
