import { useQuery } from "@tanstack/react-query";
import { api } from "~/infrastructure/http/orpcClient";

export function useSettingsData() {
	const query = useQuery({
		queryKey: ["profile.me"],
		queryFn: () => api.profile.me({}),
	});

	return {
		profile: query.data ?? null,
		isLoading: query.isLoading,
	};
}
