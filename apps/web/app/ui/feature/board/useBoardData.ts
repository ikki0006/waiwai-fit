import { useQuery } from "@tanstack/react-query";
import { api } from "~/infrastructure/http/orpcClient";

export function useBoardData() {
	const query = useQuery({
		queryKey: ["board.today"],
		queryFn: () => api.board.today({}),
	});

	return {
		rows: query.data ?? null,
		isLoading: query.isLoading,
	};
}
