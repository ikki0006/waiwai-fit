import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Mascot, type MascotState } from "./mascot";
import { SpeechBubble } from "./speech-bubble";

interface MascotMessageProps {
	state: MascotState;
	message: ReactNode;
	size?: number;
	bob?: boolean;
	className?: string;
}

export function MascotMessage({
	state,
	message,
	size = 88,
	bob = true,
	className,
}: MascotMessageProps) {
	return (
		<div className={cn("flex items-start gap-3", className)}>
			<Mascot state={state} bob={bob} size={size} />
			<SpeechBubble tail="left" className="mt-2">
				{message}
			</SpeechBubble>
		</div>
	);
}
