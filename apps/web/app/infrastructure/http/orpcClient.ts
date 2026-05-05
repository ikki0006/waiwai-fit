import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { getSupabase } from "~/infrastructure/supabase/client";
import type { AppRouterClient } from "~/rpc/client-type";

let redirectingToLogin = false;

async function handleUnauthorized() {
	if (redirectingToLogin) return;
	redirectingToLogin = true;
	try {
		await getSupabase().auth.signOut();
	} catch {
		// ignore — even if signOut fails we still want to redirect
	}
	if (typeof window !== "undefined" && window.location.pathname !== "/login") {
		window.location.replace("/login");
	}
}

const link = new RPCLink({
	url: `${import.meta.env.VITE_API_BASE_URL}/rpc`,
	async headers() {
		const { data } = await getSupabase().auth.getSession();
		const token = data.session?.access_token;
		return token ? { Authorization: `Bearer ${token}` } : {};
	},
	async fetch(request, init) {
		const response = await globalThis.fetch(request, init);
		if (response.status === 401) {
			await handleUnauthorized();
		}
		return response;
	},
});

export const api: AppRouterClient = createORPCClient(link);
