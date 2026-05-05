import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Env } from "~/types/env";

/**
 * Service Role Keyを使うクライアント。RLSをバイパスする。
 *
 * ⚠️ 重要: これを使っていいのは scheduled/ 以下のCronバッチのみ。
 * リクエスト経路(router/usecase)からは絶対に呼び出さない。
 */
export function createServiceClient(env: Env): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
