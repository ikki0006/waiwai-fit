import Anthropic from "@anthropic-ai/sdk";
import type { ProgressPublic } from "~/domain/schemas/progress";
import type { ClaudeService } from "~/domain/services/claudeService";

const SYSTEM_PROMPT = `あなたは社内ダイエットアプリの応援担当です。
渡されたメンバー全員の今日の進捗データを見て、1〜2文の短い日本語コメントを生成してください。
- 誰かの頑張りを具体的に褒める(名前に @ を付けない)
- 明るく、煽り気味でもOK
- 数字を1つだけ引用する
- 60文字以内`;

export class ClaudeServiceImpl implements ClaudeService {
	private readonly client: Anthropic;

	constructor(apiKey: string) {
		this.client = new Anthropic({ apiKey });
	}

	async generateDailyComment(rows: ProgressPublic[]): Promise<string> {
		const summary = rows
			.map((r) => {
				const weekly = r.weeklyDeltaPct === null ? "—" : `${r.weeklyDeltaPct.toFixed(1)}%`;
				return `${r.displayName}: 開始比 ${r.progressFromStartPct.toFixed(1)}%, 週比 ${weekly}, 目標到達 ${Math.round(r.goalAchievementPct)}%, streak ${r.streakDays}日`;
			})
			.join("\n");

		const res = await this.client.messages.create({
			model: "claude-opus-4-7",
			max_tokens: 200,
			system: [
				{
					type: "text",
					text: SYSTEM_PROMPT,
					cache_control: { type: "ephemeral" },
				},
			],
			messages: [
				{
					role: "user",
					content: `今日の進捗:\n${summary}`,
				},
			],
		});

		const text = res.content.find((c) => c.type === "text");
		return text?.type === "text" ? text.text.trim() : "今日もコツコツいこう!";
	}
}
