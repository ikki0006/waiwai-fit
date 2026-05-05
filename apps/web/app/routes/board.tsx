import { useState } from "react";
import type { PeriodDays } from "~/ui/components/period-filter";
import { BoardPage } from "~/ui/feature/board/BoardPage";
import { useBoardData } from "~/ui/feature/board/useBoardData";

export default function BoardRoute() {
	const [period, setPeriod] = useState<PeriodDays>(30);
	const { rows, isLoading, history, historyLoading } = useBoardData(period);
	return (
		<BoardPage
			rows={rows}
			isLoading={isLoading}
			history={history}
			historyLoading={historyLoading}
			period={period}
			onPeriodChange={setPeriod}
		/>
	);
}
