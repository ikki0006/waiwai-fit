import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "~/rpc/client-type";
import { getSupabase } from "~/infrastructure/supabase/client";

const link = new RPCLink({
	url: `${import.meta.env.VITE_API_BASE_URL}/rpc`,
	async headers() {
		const { data } = await getSupabase().auth.getSession();
		const token = data.session?.access_token;
		return token ? { Authorization: `Bearer ${token}` } : {};
	},
});

export const api: AppRouterClient = createORPCClient(link);
