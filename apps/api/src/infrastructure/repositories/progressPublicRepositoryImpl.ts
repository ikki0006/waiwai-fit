import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressPublicRepository } from "~/domain/repositories/progressPublicRepository";
import type { ProgressPublic } from "~/domain/schemas/progress";

type ProgressPublicRow = {
	user_id: string;
	display_name: string;
	avatar_url: string | null;
	slack_user_id: string | null;
	logged_at: string;
	progress_from_start_pct: number;
	goal_achievement_pct: number;
	weekly_delta_pct: number | null;
	streak_days: number;
	updated_at: string;
};

function toProgress(row: ProgressPublicRow): ProgressPublic {
	return {
		userId: row.user_id,
		displayName: row.display_name,
		avatarUrl: row.avatar_url,
		slackUserId: row.slack_user_id,
		loggedAt: row.logged_at,
		progressFromStartPct: Number(row.progress_from_start_pct),
		goalAchievementPct: Number(row.goal_achievement_pct),
		weeklyDeltaPct: row.weekly_delta_pct === null ? null : Number(row.weekly_delta_pct),
		streakDays: row.streak_days,
		updatedAt: row.updated_at,
	};
}

export class ProgressPublicRepositoryImpl implements ProgressPublicRepository {
	constructor(private readonly sb: SupabaseClient) {}

	async listByDate(loggedAt: string): Promise<ProgressPublic[]> {
		const { data, error } = await this.sb
			.from("progress_public")
			.select("*")
			.eq("logged_at", loggedAt)
			.order("progress_from_start_pct", { ascending: true });
		if (error) throw new Error(`listByDate: ${error.message}`);
		return (data as ProgressPublicRow[]).map(toProgress);
	}

	async listLatestPerUser(): Promise<ProgressPublic[]> {
		// Postgres の distinct on を使うのが自然だが、supabase-js からは生クエリになるので
		// 一旦全件取って JS 側で集約(10人規模なのでOK)。
		const { data, error } = await this.sb
			.from("progress_public")
			.select("*")
			.order("logged_at", { ascending: false });
		if (error) throw new Error(`listLatestPerUser: ${error.message}`);
		const seen = new Set<string>();
		const rows: ProgressPublic[] = [];
		for (const row of data as ProgressPublicRow[]) {
			if (seen.has(row.user_id)) continue;
			seen.add(row.user_id);
			rows.push(toProgress(row));
		}
		return rows.sort((a, b) => a.progressFromStartPct - b.progressFromStartPct);
	}

	async findByUser(userId: string, loggedAt: string): Promise<ProgressPublic | null> {
		const { data, error } = await this.sb
			.from("progress_public")
			.select("*")
			.eq("user_id", userId)
			.eq("logged_at", loggedAt)
			.maybeSingle();
		if (error) throw new Error(`findByUser: ${error.message}`);
		return data ? toProgress(data as ProgressPublicRow) : null;
	}
}
