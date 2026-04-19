import type { WeightLogRepository } from "~/domain/repositories/weightLogRepository";
import type { WeightLog } from "~/domain/schemas/weightLog";

export class RecordWeightUseCase {
	constructor(private readonly weightLogRepo: WeightLogRepository) {}

	async execute(userId: string, weightKg: number, loggedAt?: string): Promise<WeightLog> {
		return this.weightLogRepo.record(userId, weightKg, loggedAt);
	}
}
