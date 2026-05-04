import * as React from "react";
import { cn } from "~/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => (
		<input
			type={type}
			className={cn(
				"flex h-10 w-full border-[3px] border-foreground bg-background px-3 py-1 text-base text-foreground transition-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			ref={ref}
			{...props}
		/>
	),
);
Input.displayName = "Input";
