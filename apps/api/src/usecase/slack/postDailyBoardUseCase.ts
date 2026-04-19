import type { ProgressPublicRepository } from "~/domain/repositories/progressPublicRepository";
import type { ClaudeService } from "~/domain/services/claudeService";
import type { SlackService } from "~/domain/services/slackService";

export class PostDailyBoardUseCase {
	constructor(
		private readonly progressRepo: ProgressPublicRepository,
		private readonly slack: SlackService,
		private readonly claude: ClaudeService,
	) {}

	async execute(channelId: string, date: string): Promise<void> {
		const rows = await this.progressRepo.listByDate(date);
		if (rows.length === 0) {
			console.log(`[dailyBoard] no progress on ${date}, skip`);
			return;
		}
		const comment = await this.claude.generateDailyComment(rows);
		await this.slack.postDailyBoard(channelId, date, rows, comment);
	}
}
