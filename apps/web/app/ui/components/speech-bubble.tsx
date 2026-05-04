import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface SpeechBubbleProps {
	children: ReactNode;
	/** which side the tail points toward */
	tail?: "left" | "right" | "bottom" | "none";
	className?: string;
}

/**
 * Chunky pixel-style speech bubble with a stepped tail.
 * Sits next to the Mascot to deliver short messages.
 */
export function SpeechBubble({ children, tail = "left", className }: SpeechBubbleProps) {
	return (
		<div
			className={cn(
				"relative inline-block border-[3px] border-foreground bg-cream px-3 py-2 text-sm text-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]",
				className,
			)}
		>
			{children}
			{tail === "left" && (
				<>
					<span className="absolute left-[-9px] top-3 block h-2 w-2 bg-cream" aria-hidden />
					<span className="absolute left-[-12px] top-5 block h-2 w-2 bg-cream" aria-hidden />
					<span
						className="absolute left-[-12px] top-3 block h-2 w-[3px] bg-foreground"
						aria-hidden
					/>
					<span
						className="absolute left-[-12px] top-5 block h-[3px] w-3 bg-foreground"
						aria-hidden
					/>
					<span
						className="absolute left-[-9px] top-7 block h-[3px] w-[3px] bg-foreground"
						aria-hidden
					/>
				</>
			)}
			{tail === "right" && (
				<>
					<span className="absolute right-[-9px] top-3 block h-2 w-2 bg-cream" aria-hidden />
					<span className="absolute right-[-12px] top-5 block h-2 w-2 bg-cream" aria-hidden />
					<span
						className="absolute right-[-12px] top-3 block h-2 w-[3px] bg-foreground"
						aria-hidden
					/>
					<span
						className="absolute right-[-12px] top-5 block h-[3px] w-3 bg-foreground"
						aria-hidden
					/>
					<span
						className="absolute right-[-9px] top-7 block h-[3px] w-[3px] bg-foreground"
						aria-hidden
					/>
				</>
			)}
			{tail === "bottom" && (
				<>
					<span className="absolute bottom-[-9px] left-4 block h-2 w-2 bg-cream" aria-hidden />
					<span className="absolute bottom-[-12px] left-6 block h-2 w-2 bg-cream" aria-hidden />
					<span
						className="absolute bottom-[-12px] left-4 block h-[3px] w-2 bg-foreground"
						aria-hidden
					/>
					<span
						className="absolute bottom-[-12px] left-8 block h-2 w-[3px] bg-foreground"
						aria-hidden
					/>
				</>
			)}
		</div>
	);
}
