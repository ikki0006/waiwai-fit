import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export interface UserSeries {
	userId: string;
	displayName: string;
	points: { date: string; value: number | null }[];
}

interface BoardOverlayChartProps {
	series: UserSeries[];
	height?: number;
}

const PALETTE = [
	"#2F3A1F",
	"#4D5F2A",
	"#788A3A",
	"#A8B65A",
	"#5B7A1F",
	"#8B6914",
	"#3F5F1F",
	"#9B8C2A",
	"#6B4F2A",
	"#3A5F4A",
];

export function BoardOverlayChart({ series, height = 240 }: BoardOverlayChartProps) {
	if (series.length === 0) {
		return (
			<div
				className="flex items-center justify-center border-[3px] border-foreground bg-card text-xs text-muted-foreground"
				style={{ height }}
			>
				データがありません
			</div>
		);
	}

	const dateSet = new Set<string>();
	for (const s of series) {
		for (const p of s.points) dateSet.add(p.date);
	}
	const dates = [...dateSet].sort();

	const merged = dates.map((date) => {
		const row: Record<string, string | number | null> = { date };
		for (const s of series) {
			const point = s.points.find((p) => p.date === date);
			row[s.userId] = point?.value ?? null;
		}
		return row;
	});

	return (
		<div className="border-[3px] border-foreground bg-card p-2">
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={merged} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
					<CartesianGrid stroke="hsl(var(--olive-shadow) / 0.2)" strokeDasharray="2 2" />
					<XAxis
						dataKey="date"
						tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
						stroke="hsl(var(--foreground))"
						tickFormatter={(d: string) => d.slice(5)}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
						stroke="hsl(var(--foreground))"
						tickFormatter={(v: number) => `${Math.round(v)}%`}
					/>
					<Tooltip
						contentStyle={{
							background: "hsl(var(--card))",
							border: "3px solid hsl(var(--foreground))",
							borderRadius: 0,
							fontSize: 12,
						}}
						labelStyle={{ color: "hsl(var(--foreground))" }}
						formatter={(v, name) => {
							const id = String(name);
							const s = series.find((x) => x.userId === id);
							return [`${Number(v).toFixed(1)}%`, s?.displayName ?? id];
						}}
					/>
					<ReferenceLine y={100} stroke="hsl(var(--olive-dark))" strokeDasharray="4 2" />
					<Legend
						wrapperStyle={{ fontSize: 10 }}
						formatter={(v) => series.find((s) => s.userId === v)?.displayName ?? v}
					/>
					{series.map((s, i) => (
						<Line
							key={s.userId}
							type="monotone"
							dataKey={s.userId}
							stroke={PALETTE[i % PALETTE.length]}
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
							connectNulls
							isAnimationActive={false}
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
