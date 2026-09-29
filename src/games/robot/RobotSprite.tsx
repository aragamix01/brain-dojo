import { skin as skinOf } from "@/lib/shop";

/** The robot arrow in the chosen shop skin; the badge stays upright while the body turns. */
export function RobotSprite({
  skinId,
  angle = 0,
  transitionMs = 0,
  className = "h-full w-full",
}: {
  skinId?: string;
  angle?: number;
  transitionMs?: number;
  className?: string;
}) {
  const sk = skinOf(skinId);
  return (
    <span className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-full w-full drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        style={{ transform: `rotate(${angle}deg)`, transition: `transform ${transitionMs}ms` }}
        aria-hidden="true"
      >
        <path d="M20 3 L35 33 L20 26 L5 33 Z" fill={sk.fill} stroke="#1E2A3A" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      {sk.badge && (
        <span className="pointer-events-none absolute -right-1 -top-1 text-[min(4vw,16px)] leading-none">{sk.badge}</span>
      )}
    </span>
  );
}
