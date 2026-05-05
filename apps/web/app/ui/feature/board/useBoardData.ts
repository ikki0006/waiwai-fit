import { useQuery } from "@tanstack/react-query";
import { api } from "~/infrastructure/http/orpcClient";

export function useBoardData(historyDays: number) {
	const todayQuery = useQuery({
		queryKey: ["board.today"],
		queryFn: () => api.board.today({}),
	});
	const historyQuery = useQuery({
		queryKey: ["board.history", historyDays],
		queryFn: () => api.board.history({ days: historyDays }),
	});

	return {
		rows: todayQuery.data ?? null,
		isLoading: todayQuery.isLoading,
		history: historyQuery.data ?? [],
		historyLoading: historyQuery.isLoading,
	};
}
