import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium uppercase tracking-wider border-[3px] transition-none focus-visible:outline-none active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-destructive/90",
				outline:
					"bg-background text-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-secondary/80",
				ghost: "border-transparent hover:bg-accent hover:text-accent-foreground",
				link: "border-transparent text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-8 px-3 text-xs",
				lg: "h-12 px-8 text-base",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
		);
	},
);
Button.displayName = "Button";

export { buttonVariants };
