import { BoardPage } from "~/ui/feature/board/BoardPage";
import { useBoardData } from "~/ui/feature/board/useBoardData";

export default function BoardRoute() {
	const { rows, isLoading } = useBoardData();
	return <BoardPage rows={rows} isLoading={isLoading} />;
}
