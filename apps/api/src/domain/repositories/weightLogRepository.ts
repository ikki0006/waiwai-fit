import type { WeightLog } from "~/domain/schemas/weightLog";

export interface WeightLogRepository {
	record(userId: string, weightKg: number, loggedAt?: string): Promise<WeightLog>;
	listByUser(userId: string, limit?: number): Promise<WeightLog[]>;
	latest(userId: string): Promise<WeightLog | null>;
}
