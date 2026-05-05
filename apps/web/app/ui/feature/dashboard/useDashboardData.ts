import { useQuery } from "@tanstack/react-query";
import { api } from "~/infrastructure/http/orpcClient";
import { useAuthStore } from "~/state/authStore";

export type DashboardData = ReturnType<typeof useDashboardData>;

export function useDashboardData() {
	const session = useAuthStore((s) => s.session);
	const initialized = useAuthStore((s) => s.initialized);

	const profileQuery = useQuery({
		queryKey: ["profile.me"],
		queryFn: () => api.profile.me({}),
		enabled: !!session,
	});

	const historyQuery = useQuery({
		queryKey: ["weight.history"],
		queryFn: () => api.weight.myHistory({ limit: 30 }),
		enabled: !!profileQuery.data,
	});

	return {
		initialized,
		session,
		profile: profileQuery.data ?? null,
		profileLoaded: profileQuery.isSuccess,
		history: historyQuery.data ?? [],
	};
}
