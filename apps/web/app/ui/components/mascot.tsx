import { cn } from "~/lib/utils";

/**
 * Retro Buddy mascot — pixel-art companion character.
 *
 * Drawing rules (from design system):
 *  - Low-resolution pixel art on a 16×20 grid
 *  - Thick outline using olive-shadow
 *  - Two small ear bumps on top of the head
 *  - Cream face area on the head front, with dark rectangular eyes
 *  - No mouth
 *  - Cream necktie centered on the body
 *  - Holds a cream briefcase in front (arms visible on the sides)
 *  - Two short legs / feet at the bottom
 */
export type MascotState =
	| "default"
	| "searching"
	| "suggesting"
	| "complete"
	| "waiting"
	| "error";

interface MascotProps {
	state?: MascotState;
	/** rendered width in CSS px (height scales by aspect ratio) */
	size?: number;
	className?: string;
	/** idle bob animation */
	bob?: boolean;
}

const GRID_W = 16;
const GRID_H = 20;

// Each char represents one pixel:
//   . = transparent
//   s = olive-shadow (outline / eye)
//   m = olive          (main body)
//   l = olive-light    (cheek / shading)
//   c = cream          (face / necktie / briefcase — pops against body)
//   e = eye (rendered same as olive-shadow, kept distinct for variant overrides)
//   h = highlight cream (used for sparkle accents)
const BASE_ROWS: readonly string[] = [
	"...ss......ss...", //  0  ear tips
	"..smms....smms..", //  1  ears
	".smmmmmmmmmmmms.", //  2  head crown
	"smmmmmmmmmmmmmms", //  3  head top
	"smmccccccccccmms", //  4  face starts (cream face cols 3–12)
	"smccccccccccccms", //  5  face wide
	"smcceeccccceecms", //  6  eye row 1 (eyes at cols 4–5 and 11–12)
	"smcceeccccceecms", //  7  eye row 2
	"smcceeccccceecms", //  8  eye row 3
	"smccccccccccccms", //  9  face bottom
	"smmmmmmmmmmmmmms", // 10  body shoulders (no cream — separates face from briefcase)
	".smmmmmccmmmmms.", // 11  necktie knot peeks (cols 7–8)
	"smmsccccccccsmms", // 12  briefcase top with handle nubs and arms
	"smmmccccccccmmms", // 13  briefcase body
	"smmmccccccccmmms", // 14  briefcase body
	"smmmccccccccmmms", // 15  briefcase body
	"smmmsccccccsmmms", // 16  briefcase bottom narrows
	".smmmsssssssmms.", // 17  body / briefcase base
	"....ss....ss....", // 18  legs
	"...ssss..ssss...", // 19  feet
];

const COLORS: Record<string, string> = {
	".": "transparent",
	s: "hsl(var(--olive-shadow))",
	m: "hsl(var(--olive))",
	l: "hsl(var(--olive-light))",
	c: "hsl(var(--cream))",
	e: "hsl(var(--olive-shadow))",
	h: "hsl(var(--cream))",
};

type Override = Record<string, string>;

const EYE_COLS = [4, 5, 11, 12] as const;
const EYE_ROWS = [6, 7, 8] as const;

function buildOverrides(state: MascotState): Override {
	const o: Override = {};

	switch (state) {
		case "default":
			break;
		case "searching":
			// Squinting / scanning — only middle row visible (mid eye line)
			for (const c of EYE_COLS) {
				o[`6,${c}`] = "c";
				o[`8,${c}`] = "c";
			}
			break;
		case "suggesting":
			// Wide, sparkling eyes — sparkle pixels alongside the face
			o["5,2"] = "h";
			o["5,13"] = "h";
			break;
		case "complete":
			// Closed happy eyes (^_^) — bottom row only
			for (const c of EYE_COLS) {
				o[`6,${c}`] = "c";
				o[`7,${c}`] = "c";
			}
			break;
		case "waiting":
			// Sleepy eyelid — top row only
			for (const c of EYE_COLS) {
				o[`7,${c}`] = "c";
				o[`8,${c}`] = "c";
			}
			break;
		case "error":
			// Zigzag / dazed eyes
			o["6,4"] = "e";
			o["6,5"] = "c";
			o["7,4"] = "c";
			o["7,5"] = "e";
			o["8,4"] = "e";
			o["8,5"] = "c";
			o["6,11"] = "c";
			o["6,12"] = "e";
			o["7,11"] = "e";
			o["7,12"] = "c";
			o["8,11"] = "c";
			o["8,12"] = "e";
			break;
	}

	// Suppress unused EYE_ROWS warning while keeping it documented
	void EYE_ROWS;

	return o;
}

export function Mascot({
	state = "default",
	size = 96,
	className,
	bob = false,
}: MascotProps) {
	const overrides = buildOverrides(state);
	const rects: React.ReactNode[] = [];

	for (let y = 0; y < GRID_H; y++) {
		const row = BASE_ROWS[y]!;
		for (let x = 0; x < GRID_W; x++) {
			const ch = overrides[`${y},${x}`] ?? row[x]!;
			if (ch === ".") continue;
			rects.push(
				<rect
					key={`${x}-${y}`}
					x={x}
					y={y}
					width={1}
					height={1}
					fill={COLORS[ch]}
				/>,
			);
		}
	}

	const height = Math.round((size * GRID_H) / GRID_W);

	return (
		<svg
			viewBox={`0 0 ${GRID_W} ${GRID_H}`}
			width={size}
			height={height}
			shapeRendering="crispEdges"
			className={cn(bob && "mascot-bob", className)}
			role="img"
			aria-label={`mascot ${state}`}
		>
			{rects}
		</svg>
	);
}
