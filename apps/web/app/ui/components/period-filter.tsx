import { cn } from "~/lib/utils";

export type PeriodDays = 7 | 30 | 90;

const OPTIONS: { value: PeriodDays; label: string }[] = [
	{ value: 7, label: "7日" },
	{ value: 30, label: "30日" },
	{ value: 90, label: "90日" },
];

interface PeriodFilterProps {
	value: PeriodDays;
	onChange: (value: PeriodDays) => void;
	className?: string;
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
	return (
		<div className={cn("inline-flex border-[3px] border-foreground", className)}>
			{OPTIONS.map((opt) => {
				const active = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(opt.value)}
						className={cn(
							"px-3 py-1 text-xs tabular-nums transition-colors",
							active ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted",
						)}
					>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}
