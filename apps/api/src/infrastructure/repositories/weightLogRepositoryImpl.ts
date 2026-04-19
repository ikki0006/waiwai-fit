import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeightLogRepository } from "~/domain/repositories/weightLogRepository";
import type { WeightLog } from "~/domain/schemas/weightLog";

type WeightLogRow = {
	id: string;
	user_id: string;
	logged_at: string;
	weight_kg: number;
	created_at: string;
	updated_at: string;
};

function toWeightLog(row: WeightLogRow): WeightLog {
	return {
		id: row.id,
		userId: row.user_id,
		loggedAt: row.logged_at,
		weightKg: Number(row.weight_kg),
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export class WeightLogRepositoryImpl implements WeightLogRepository {
	constructor(private readonly sb: SupabaseClient) {}

	async record(userId: string, weightKg: number, loggedAt?: string): Promise<WeightLog> {
		// created_atを維持するため、「存在すれば UPDATE / なければ INSERT」に分ける。
		// supabase-js の upsert は全カラム上書きしてしまい created_at が更新されるため使わない。
		const targetDate = loggedAt ?? new Date().toISOString().slice(0, 10);

		const existing = await this.sb
			.from("weight_logs")
			.select("id")
			.eq("user_id", userId)
			.eq("logged_at", targetDate)
			.maybeSingle();
		if (existing.error) throw new Error(`record weight (lookup): ${existing.error.message}`);

		if (existing.data) {
			const { data, error } = await this.sb
				.from("weight_logs")
				.update({ weight_kg: weightKg })
				.eq("id", existing.data.id)
				.select("*")
				.single();
			if (error) throw new Error(`record weight (update): ${error.message}`);
			return toWeightLog(data as WeightLogRow);
		}

		const { data, error } = await this.sb
			.from("weight_logs")
			.insert({ user_id: userId, weight_kg: weightKg, logged_at: targetDate })
			.select("*")
			.single();
		if (error) throw new Error(`record weight (insert): ${error.message}`);
		return toWeightLog(data as WeightLogRow);
	}

	async listByUser(userId: string, limit = 90): Promise<WeightLog[]> {
		const { data, error } = await this.sb
			.from("weight_logs")
			.select("*")
			.eq("user_id", userId)
			.order("logged_at", { ascending: false })
			.limit(limit);
		if (error) throw new Error(`listByUser: ${error.message}`);
		return (data as WeightLogRow[]).map(toWeightLog);
	}

	async latest(userId: string): Promise<WeightLog | null> {
		const { data, error } = await this.sb
			.from("weight_logs")
			.select("*")
			.eq("user_id", userId)
			.order("logged_at", { ascending: false })
			.limit(1)
			.maybeSingle();
		if (error) throw new Error(`latest: ${error.message}`);
		return data ? toWeightLog(data as WeightLogRow) : null;
	}
}
