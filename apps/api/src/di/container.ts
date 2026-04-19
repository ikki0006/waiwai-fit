import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRepository } from "~/domain/repositories/profileRepository";
import type { ProgressPublicRepository } from "~/domain/repositories/progressPublicRepository";
import type { WeightLogRepository } from "~/domain/repositories/weightLogRepository";
import type { ClaudeService } from "~/domain/services/claudeService";
import type { SlackService } from "~/domain/services/slackService";
import { ClaudeServiceImpl } from "~/infrastructure/claude/claudeServiceImpl";
import { ProfileRepositoryImpl } from "~/infrastructure/repositories/profileRepositoryImpl";
import { ProgressPublicRepositoryImpl } from "~/infrastructure/repositories/progressPublicRepositoryImpl";
import { WeightLogRepositoryImpl } from "~/infrastructure/repositories/weightLogRepositoryImpl";
import { SlackServiceImpl } from "~/infrastructure/slack/slackServiceImpl";
import type { Env } from "~/types/env";

export type RequestRepos = {
	profile: ProfileRepository;
	weightLog: WeightLogRepository;
	progressPublic: ProgressPublicRepository;
};

export type Services = {
	slack: SlackService;
	claude: ClaudeService;
};

export function buildRequestRepos(sb: SupabaseClient): RequestRepos {
	return {
		profile: new ProfileRepositoryImpl(sb),
		weightLog: new WeightLogRepositoryImpl(sb),
		progressPublic: new ProgressPublicRepositoryImpl(sb),
	};
}

export function buildServices(env: Env): Services {
	return {
		slack: new SlackServiceImpl(env.SLACK_BOT_TOKEN),
		claude: new ClaudeServiceImpl(env.ANTHROPIC_API_KEY),
	};
}
