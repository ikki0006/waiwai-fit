import type { ProgressPublic } from "~/domain/schemas/progress";

export interface SlackService {
	lookupUserIdByEmail(email: string): Promise<string | null>;
	postDailyBoard(
		channelId: string,
		date: string,
		rows: ProgressPublic[],
		comment: string,
	): Promise<void>;
}
