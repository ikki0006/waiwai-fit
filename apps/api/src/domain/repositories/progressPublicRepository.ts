import type { ProgressPublic } from "~/domain/schemas/progress";

/**
 * ⚠️ このRepositoryは READ 専用。
 * progress_public への書き込みは weight_logs のトリガー経由のみ。
 * 絶対値(weight_kg)を受け取るメソッドを生やさないことが、秘匿保証の型レベルの担保。
 */
export interface ProgressPublicRepository {
	listByDate(loggedAt: string): Promise<ProgressPublic[]>;
	listLatestPerUser(): Promise<ProgressPublic[]>;
	findByUser(userId: string, loggedAt: string): Promise<ProgressPublic | null>;
	listSince(fromDate: string): Promise<ProgressPublic[]>;
}
