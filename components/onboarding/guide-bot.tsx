/**
 * Parcel, Relay's onboarding guide: a small open box with a face.
 *
 * Original artwork. Relay's mark is an open cardboard box, so the guide is one:
 * kraft body, flaps open, a strip of packing tape in the site accent. Pure SVG
 * with no hooks, so it renders in server components too. Parcel is a kraft box
 * in both themes, so the box and face colours are fixed; only the tape follows
 * the accent token, which is the same brand blue in light and dark.
 */

export type Mood = "hi" | "thinking" | "pointing" | "cheer";

const INK = "#2B2118"; // the face, drawn on kraft in both themes
const TAPE = "var(--accent)";
const EDGE = "#9C7443";
const KRAFT = "#D9B27D";
const CHEEK = "#E07A5F";

const REST_LEFT = "M26 80 Q14 86 16 97";
const REST_RIGHT = "M94 80 Q106 86 104 97";
const ARMS: Record<Mood, [string, string]> = {
  hi: [REST_LEFT, "M94 72 Q108 62 106 46"],
  thinking: [REST_LEFT, REST_RIGHT],
  pointing: [REST_LEFT, "M94 72 L115 64"],
  cheer: ["M26 72 Q12 60 14 45", "M94 72 Q108 60 106 45"],
};

function Arm({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={EDGE} strokeWidth="11" strokeLinecap="round" />
      <path d={d} fill="none" stroke={KRAFT} strokeWidth="6.5" strokeLinecap="round" />
    </>
  );
}

function Eye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r="5.2" fill={INK} />
      <circle cx={cx + 1.6} cy={cy - 1.8} r="1.7" fill="#FFFFFF" />
    </>
  );
}

function Face({ mood }: { mood: Mood }) {
  const cheeks = (
    <>
      <circle cx="36" cy="84" r="4.5" fill={CHEEK} opacity="0.45" />
      <circle cx="84" cy="84" r="4.5" fill={CHEEK} opacity="0.45" />
    </>
  );
  switch (mood) {
    case "thinking":
      return (
        <>
          {cheeks}
          <Eye cx={44} cy={68} />
          <Eye cx={72} cy={68} />
          <path d="M53 86 H67" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="98" cy="22" r="3" fill={INK} opacity="0.35" />
          <circle cx="107" cy="14" r="2.2" fill={INK} opacity="0.25" />
        </>
      );
    case "pointing":
      return (
        <>
          {cheeks}
          <Eye cx={50} cy={71} />
          <Eye cx={78} cy={71} />
          <path d="M53 83 Q62 90 71 83" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "cheer":
      return (
        <>
          {cheeks}
          <path d="M39 72 Q45 64 51 72" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M69 72 Q75 64 81 72" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M50 80 Q60 97 70 80 Z" fill={INK} strokeLinejoin="round" />
        </>
      );
    default:
      return (
        <>
          {cheeks}
          <Eye cx={46} cy={70} />
          <Eye cx={74} cy={70} />
          <path d="M51 82 Q60 91 69 82" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      );
  }
}

export function GuideBot({ mood = "hi", size = 72, className }: { mood?: Mood; size?: number; className?: string }) {
  const [left, right] = ARMS[mood];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="relay-guide-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDCFA2" />
          <stop offset="1" stopColor="#C49563" />
        </linearGradient>
        <linearGradient id="relay-guide-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5E2C0" />
          <stop offset="1" stopColor="#D9B27D" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="111" rx="30" ry="4.5" fill={INK} opacity="0.14" />
      <Arm d={left} />
      <Arm d={right} />
      <path
        d="M26 46 L12 31 Q10 27 15 27 L48 26 Q52 26 53 30 L57 42 Z"
        fill="url(#relay-guide-flap)"
        stroke={EDGE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M94 46 L108 31 Q110 27 105 27 L72 26 Q68 26 67 30 L63 42 Z"
        fill="url(#relay-guide-flap)"
        stroke={EDGE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="22" y="40" width="76" height="64" rx="16" fill="url(#relay-guide-body)" stroke={EDGE} strokeWidth="2" />
      <rect x="53" y="41" width="14" height="13" fill={TAPE} opacity="0.9" />
      <Face mood={mood} />
    </svg>
  );
}
