import type { ProgressPublic } from "~/domain/schemas/progress";
import type { SlackService } from "~/domain/services/slackService";

export class SlackServiceImpl implements SlackService {
	constructor(private readonly token: string) {}

	async lookupUserIdByEmail(email: string): Promise<string | null> {
		const res = await fetch(
			`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`,
			{ headers: { Authorization: `Bearer ${this.token}` } },
		);
		const body = (await res.json()) as { ok: boolean; user?: { id: string }; error?: string };
		if (!body.ok) {
			if (body.error === "users_not_found") return null;
			throw new Error(`slack lookupByEmail: ${body.error}`);
		}
		return body.user?.id ?? null;
	}

	async postDailyBoard(
		channelId: string,
		date: string,
		rows: ProgressPublic[],
		comment: string,
	): Promise<void> {
		const blocks = buildBoardBlocks(date, rows, comment);
		const res = await fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify({ channel: channelId, blocks, text: `今日のダイエット進捗 ${date}` }),
		});
		const body = (await res.json()) as { ok: boolean; error?: string };
		if (!body.ok) throw new Error(`slack postMessage: ${body.error}`);
	}
}

function buildBoardBlocks(date: string, rows: ProgressPublic[], comment: string) {
	const medals = ["🥇", "🥈", "🥉"];
	const lines = rows.map((r, i) => {
		const medal = medals[i] ?? "  ";
		const mention = r.slackUserId ? `<@${r.slackUserId}>` : r.displayName;
		const pct = r.progressFromStartPct.toFixed(1);
		const sign = r.progressFromStartPct > 0 ? "+" : "";
		const bar = renderBar(r.goalAchievementPct);
		const streak = r.streakDays >= 3 ? ` 🔥${r.streakDays}日連続` : "";
		return `${medal} ${mention}  ${sign}${pct}%  ${bar} ${Math.round(r.goalAchievementPct)}%${streak}`;
	});

	return [
		{
			type: "header",
			text: { type: "plain_text", text: `🔥 今日のダイエット進捗 ${date}` },
		},
		{
			type: "section",
			text: { type: "mrkdwn", text: `\`\`\`\n${lines.join("\n")}\n\`\`\`` },
		},
		{
			type: "context",
			elements: [{ type: "mrkdwn", text: `💬 ${comment}` }],
		},
	];
}

function renderBar(pct: number): string {
	const clamped = Math.max(0, Math.min(100, pct));
	const filled = Math.round(clamped / 10);
	return "█".repeat(filled) + "░".repeat(10 - filled);
}
