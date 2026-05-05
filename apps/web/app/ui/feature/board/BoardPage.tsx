import { Link } from "react-router";
import type { api } from "~/infrastructure/http/orpcClient";
import { Mascot } from "~/ui/components/mascot";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/components/shadcn/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/components/shadcn/card";
import { Progress } from "~/ui/components/shadcn/progress";

type BoardRow = Awaited<ReturnType<typeof api.board.today>>[number];

interface BoardPageProps {
	rows: BoardRow[] | null;
	isLoading: boolean;
}

export function BoardPage({ rows, isLoading }: BoardPageProps) {
	const headerState = isLoading ? "searching" : (rows?.length ?? 0) > 0 ? "suggesting" : "waiting";

	return (
		<main className="mx-auto max-w-xl p-6 space-y-4">
			<header className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Mascot state={headerState} size={40} />
					<h1 className="text-xl font-bold">みんなの進捗</h1>
				</div>
				<Link to="/" className="text-sm text-muted-foreground underline">
					← 自分の画面
				</Link>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>ランキング</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading && <p className="text-muted-foreground text-sm">読み込み中…</p>}
					{rows?.length === 0 && (
						<p className="text-muted-foreground text-sm">まだ誰も記録していません</p>
					)}
					{rows?.map((row, i) => {
						const medal = ["🥇", "🥈", "🥉"][i] ?? "";
						return (
							<div key={row.userId} className="flex items-center gap-3">
								<div className="w-6 text-center">{medal}</div>
								<Avatar>
									{row.avatarUrl && <AvatarImage src={row.avatarUrl} alt={row.displayName} />}
									<AvatarFallback>{row.displayName.slice(0, 2)}</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<div className="flex justify-between items-baseline">
										<span className="font-medium truncate">{row.displayName}</span>
										<span
											className={`tabular-nums font-bold ${
												row.progressFromStartPct < 0 ? "text-green-600" : "text-rose-600"
											}`}
										>
											{row.progressFromStartPct > 0 ? "+" : ""}
											{row.progressFromStartPct.toFixed(1)}%
										</span>
									</div>
									<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
										<Progress
											value={Math.max(0, Math.min(100, row.goalAchievementPct))}
											className="flex-1"
										/>
										<span className="w-10 text-right">{Math.round(row.goalAchievementPct)}%</span>
										{row.streakDays >= 3 && <span>🔥{row.streakDays}</span>}
									</div>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</main>
	);
}
