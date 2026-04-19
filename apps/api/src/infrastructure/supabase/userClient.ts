import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "~/types/env";

/**
 * ユーザーJWTを転送するSupabaseクライアント。
 * RLSで auth.uid() を効かせるため、リクエスト経路では必ずこちらを使う。
 */
export function createUserClient(env: Env, jwt: string): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		},
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
