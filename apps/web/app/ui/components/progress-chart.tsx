import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export interface ProgressPoint {
	date: string;
	goalAchievementPct: number;
}

interface ProgressChartProps {
	data: ProgressPoint[];
	height?: number;
}

export function ProgressChart({ data, height = 200 }: ProgressChartProps) {
	if (data.length === 0) {
		return (
			<div
				className="flex items-center justify-center border-[3px] border-foreground bg-card text-xs text-muted-foreground"
				style={{ height }}
			>
				まだ記録がありません
			</div>
		);
	}

	return (
		<div className="border-[3px] border-foreground bg-card p-2">
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
						domain={[0, (max: number) => Math.max(100, Math.ceil(max / 10) * 10)]}
					/>
					<Tooltip
						contentStyle={{
							background: "hsl(var(--card))",
							border: "3px solid hsl(var(--foreground))",
							borderRadius: 0,
							fontSize: 12,
						}}
						labelStyle={{ color: "hsl(var(--foreground))" }}
						formatter={(v) => [`${Number(v).toFixed(1)}%`, "目標到達度"]}
					/>
					<ReferenceLine y={100} stroke="hsl(var(--olive-dark))" strokeDasharray="4 2" />
					<Line
						type="monotone"
						dataKey="goalAchievementPct"
						stroke="hsl(var(--olive-dark))"
						strokeWidth={3}
						dot={{ fill: "hsl(var(--olive-dark))", r: 3 }}
						activeDot={{ r: 5 }}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
