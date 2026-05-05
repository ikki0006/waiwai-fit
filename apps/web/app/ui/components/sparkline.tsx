import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
	values: number[];
	width?: number;
	height?: number;
	color?: string;
}

export function Sparkline({
	values,
	width = 80,
	height = 24,
	color = "hsl(var(--olive-dark))",
}: SparklineProps) {
	if (values.length < 2) {
		return <div style={{ width, height }} />;
	}
	const data = values.map((v, i) => ({ i, v }));
	return (
		<div style={{ width, height }}>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
					<YAxis hide domain={["dataMin", "dataMax"]} />
					<Line
						type="monotone"
						dataKey="v"
						stroke={color}
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
