import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRepository } from "~/domain/repositories/profileRepository";
import type { OnboardingInput, Profile, UpdateGoalsInput } from "~/domain/schemas/profile";

type ProfileRow = {
	user_id: string;
	email: string;
	display_name: string;
	avatar_url: string | null;
	slack_user_id: string | null;
	start_weight: number;
	goal_weight: number;
	started_at: string;
	created_at: string;
	updated_at: string;
};

function toProfile(row: ProfileRow): Profile {
	return {
		userId: row.user_id,
		email: row.email,
		displayName: row.display_name,
		avatarUrl: row.avatar_url,
		slackUserId: row.slack_user_id,
		startWeight: Number(row.start_weight),
		goalWeight: Number(row.goal_weight),
		startedAt: row.started_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export class ProfileRepositoryImpl implements ProfileRepository {
	constructor(private readonly sb: SupabaseClient) {}

	async findByUserId(userId: string): Promise<Profile | null> {
		const { data, error } = await this.sb
			.from("profiles")
			.select("*")
			.eq("user_id", userId)
			.maybeSingle();
		if (error) throw new Error(`findByUserId: ${error.message}`);
		return data ? toProfile(data as ProfileRow) : null;
	}

	async create(userId: string, email: string, input: OnboardingInput): Promise<Profile> {
		const { data, error } = await this.sb
			.from("profiles")
			.insert({
				user_id: userId,
				email,
				display_name: input.displayName,
				avatar_url: input.avatarUrl ?? null,
				start_weight: input.startWeight,
				goal_weight: input.goalWeight,
			})
			.select("*")
			.single();
		if (error) throw new Error(`create profile: ${error.message}`);
		return toProfile(data as ProfileRow);
	}

	async updateGoals(userId: string, input: UpdateGoalsInput): Promise<Profile> {
		const patch: Record<string, number> = {};
		if (input.startWeight !== undefined) patch.start_weight = input.startWeight;
		if (input.goalWeight !== undefined) patch.goal_weight = input.goalWeight;
		const { data, error } = await this.sb
			.from("profiles")
			.update(patch)
			.eq("user_id", userId)
			.select("*")
			.single();
		if (error) throw new Error(`updateGoals: ${error.message}`);
		return toProfile(data as ProfileRow);
	}

	async updateSlackUserId(userId: string, slackUserId: string): Promise<void> {
		const { error } = await this.sb
			.from("profiles")
			.update({ slack_user_id: slackUserId })
			.eq("user_id", userId);
		if (error) throw new Error(`updateSlackUserId: ${error.message}`);
	}
}
