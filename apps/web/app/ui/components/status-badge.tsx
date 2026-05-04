import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type StatusVariant = "match" | "checking" | "waiting" | "info" | "error";

const VARIANT_STYLES: Record<StatusVariant, { className: string; label: string }> = {
	match: {
		className: "bg-olive text-cream",
		label: "MATCH",
	},
	checking: {
		className: "bg-olive-light text-olive-shadow",
		label: "CHECKING",
	},
	waiting: {
		className: "bg-cream text-olive-shadow",
		label: "WAITING",
	},
	info: {
		className: "bg-olive-dark text-cream",
		label: "INFO",
	},
	error: {
		className: "bg-destructive text-destructive-foreground",
		label: "ERROR",
	},
};

interface StatusBadgeProps {
	variant: StatusVariant;
	children?: ReactNode;
	className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
	const v = VARIANT_STYLES[variant];
	return (
		<span
			className={cn(
				"inline-flex items-center border-[3px] border-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
				v.className,
				className,
			)}
		>
			{children ?? v.label}
		</span>
	);
}
