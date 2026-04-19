import { ClaudeServiceImpl } from "~/infrastructure/claude/claudeServiceImpl";
import { ProgressPublicRepositoryImpl } from "~/infrastructure/repositories/progressPublicRepositoryImpl";
import { SlackServiceImpl } from "~/infrastructure/slack/slackServiceImpl";
import { createServiceClient } from "~/infrastructure/supabase/serviceClient";
import type { Env } from "~/types/env";
import { PostDailyBoardUseCase } from "~/usecase/slack/postDailyBoardUseCase";

function todayJstDate(): string {
	// JST = UTC+9。Cron実行時点のUTC日付を見て、JSTの「今日」に変換する。
	const nowUtc = new Date();
	const jst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
	return jst.toISOString().slice(0, 10);
}

export async function runDailyBoard(env: Env): Promise<void> {
	if (!env.SLACK_CHANNEL_ID) {
		console.warn("[dailyBoard] SLACK_CHANNEL_ID not set, skip");
		return;
	}
	const sb = createServiceClient(env);
	const progressRepo = new ProgressPublicRepositoryImpl(sb);
	const slack = new SlackServiceImpl(env.SLACK_BOT_TOKEN);
	const claude = new ClaudeServiceImpl(env.ANTHROPIC_API_KEY);
	const useCase = new PostDailyBoardUseCase(progressRepo, slack, claude);
	await useCase.execute(env.SLACK_CHANNEL_ID, todayJstDate());
}
