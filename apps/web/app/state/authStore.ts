import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { getSupabase } from "~/infrastructure/supabase/client";

type AuthState = {
	session: Session | null;
	user: User | null;
	initialized: boolean;
	init: () => Promise<void>;
	signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
	session: null,
	user: null,
	initialized: false,
	init: async () => {
		const sb = getSupabase();
		const { data } = await sb.auth.getSession();
		set({ session: data.session, user: data.session?.user ?? null, initialized: true });
		sb.auth.onAuthStateChange((_event, session) => {
			set({ session, user: session?.user ?? null });
		});
	},
	signOut: async () => {
		await getSupabase().auth.signOut();
		set({ session: null, user: null });
	},
}));
