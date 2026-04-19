import type { ProgressPublic } from "~/domain/schemas/progress";

export interface ClaudeService {
	generateDailyComment(rows: ProgressPublic[]): Promise<string>;
}
