import { createClient } from "@supabase/supabase-js";
import type { Context, MiddlewareHandler } from "hono";
import type { AuthUser, Env } from "~/types/env";

/**
 * Authorization: Bearer <jwt> を検証し、c.set('user', ...) と c.set('jwt', ...) する。
 * 以降のハンドラはこれを使って createUserClient(env, jwt) でSupabaseを叩く。
 */
export const authHandler: MiddlewareHandler<{
	Bindings: Env;
	Variables: { user: AuthUser; jwt: string };
}> = async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ error: "unauthorized" }, 401);
	}
	const jwt = authHeader.slice(7);

	const sb = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	const { data, error } = await sb.auth.getUser(jwt);
	if (error || !data.user || !data.user.email) {
		return c.json({ error: "unauthorized" }, 401);
	}

	const allowed = (c.env.ALLOWED_EMAILS ?? "")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (allowed.length > 0 && !allowed.includes(data.user.email.toLowerCase())) {
		return c.json({ error: "forbidden", reason: "email not in allowlist" }, 403);
	}

	c.set("user", { id: data.user.id, email: data.user.email });
	c.set("jwt", jwt);
	await next();
};

export type AuthContext = Context<{
	Bindings: Env;
	Variables: { user: AuthUser; jwt: string };
}>;
