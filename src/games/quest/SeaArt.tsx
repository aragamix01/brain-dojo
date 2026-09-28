/** Hand-drawn sea decorations for the treasure map (ink outline, manga style). */

const INK = "#1e2a3a";

export type Sprite = "kraken" | "serpent" | "wave" | "fin" | "bottle" | "gulls" | "storm" | "whirl";

/** Big signature creature per island + small filler sprites along the trail. */
export const ISLAND_ART: Record<string, { hero: Sprite; small: Sprite[] }> = {
  beach: { hero: "wave", small: ["gulls", "bottle", "fin"] },
  jungle: { hero: "serpent", small: ["gulls", "whirl", "bottle"] },
  lagoon: { hero: "kraken", small: ["whirl", "fin", "bottle"] },
  volcano: { hero: "storm", small: ["fin", "wave", "gulls"] },
  dunes: { hero: "serpent", small: ["bottle", "gulls", "whirl"] },
  castle: { hero: "kraken", small: ["storm", "fin", "whirl"] },
};

export function SeaSprite({ kind, ...rest }: { kind: Sprite } & React.SVGProps<SVGSVGElement>) {
  const common = { fill: "none", stroke: INK, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, "aria-hidden": true, ...rest };
  switch (kind) {
    case "kraken":
      return (
        <svg viewBox="0 0 140 152" {...common}>
          <g strokeWidth="13">
            <path d="M42 68C18 76 6 98 18 112c8 8 17-1 11-8" />
            <path d="M98 68c24 8 36 30 24 44-8 8-17-1-11-8" />
            <path d="M58 72c-4 18-12 28-8 42" />
            <path d="M82 72c4 18 12 28 8 42" />
          </g>
          <g stroke="#ff7a9a" strokeWidth="7.5">
            <path d="M42 68C18 76 6 98 18 112c8 8 17-1 11-8" />
            <path d="M98 68c24 8 36 30 24 44-8 8-17-1-11-8" />
            <path d="M58 72c-4 18-12 28-8 42" />
            <path d="M82 72c4 18 12 28 8 42" />
          </g>
          <path d="M70 6c30 0 42 34 38 66H32C28 40 40 6 70 6z" fill="#ff7a9a" strokeWidth="2.8" />
          <path d="M52 12L40 2l6 18M88 12l12-10-6 18" fill="#ff7a9a" strokeWidth="2.6" />
          <circle cx="56" cy="48" r="10" fill="#fff" strokeWidth="2.6" />
          <circle cx="84" cy="48" r="10" fill="#fff" strokeWidth="2.6" />
          <circle cx="58" cy="50" r="4.5" fill={INK} stroke="none" />
          <circle cx="82" cy="50" r="4.5" fill={INK} stroke="none" />
          <path d="M44 34l18 6M96 34l-18 6" strokeWidth="3.2" />
          <path d="M62 64q8 6 16 0" strokeWidth="2.6" />
          <circle cx="46" cy="24" r="3" fill="#ffb3c4" stroke="none" />
          <circle cx="70" cy="18" r="3.5" fill="#ffb3c4" stroke="none" />
          <path d="M0 118q10-10 20 0t20 0 20 0 20 0 20 0 20 0 20 0V152H0z" fill="#1fa2e0" strokeWidth="2.6" />
          <path d="M12 132q7-5 14 0M60 138q7-5 14 0M108 132q7-5 14 0" stroke="#fff" strokeWidth="2.4" />
        </svg>
      );
    case "serpent":
      return (
        <svg viewBox="0 0 156 92" strokeWidth="2.6" {...common}>
          <path d="M12 68c3-30 36-30 38 0z" fill="#2ec4b6" />
          <path d="M22 50l4-8 4 6M34 46l4-8 3 8" fill="#ffc93c" />
          <path d="M62 68c3-34 38-34 40 0z" fill="#2ec4b6" />
          <path d="M72 46l4-9 4 7M86 42l4-9 3 9" fill="#ffc93c" />
          <path d="M110 68c-2-26 4-46 22-48 14-1 18 12 10 18l-16 3c-3 10 0 20 2 27z" fill="#2ec4b6" />
          <path d="M124 20l-2-10 8 6 4-10 3 10" fill="#ffc93c" />
          <circle cx="134" cy="28" r="4.5" fill="#fff" />
          <circle cx="135" cy="28" r="2" fill={INK} stroke="none" />
          <path d="M142 38l6 4" stroke="#ff5a5f" strokeWidth="2.4" />
          <path d="M2 70q9-9 18 0t18 0 18 0 18 0 18 0 18 0 18 0 18 0 10-4V90H2z" fill="#1fa2e0" />
          <path d="M10 80q6-5 12 0M60 82q6-5 12 0M112 80q6-5 12 0" stroke="#fff" strokeWidth="2.2" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 140 100" strokeWidth="2.8" {...common}>
          <path d="M4 96C10 60 40 20 84 16c34-2 54 18 50 38-4 16-24 18-30 6-4-10 6-16 12-12-6-14-26-16-40-8-20 12-24 40-16 56z" fill="#1fa2e0" />
          <path d="M20 88c6-26 28-50 56-54" stroke="#fff" strokeWidth="3" />
          <path d="M84 16c6-8 14-8 18 0 4-6 12-6 16 2" stroke="#fff" strokeWidth="3" />
          <circle cx="128" cy="30" r="3" fill="#fff" />
          <circle cx="120" cy="20" r="2" fill="#fff" />
        </svg>
      );
    case "storm":
      return (
        <svg viewBox="0 0 92 76" strokeWidth="2.4" {...common}>
          <path d="M18 42a12 12 0 014-23 16 16 0 0130-6 13 13 0 0120 14 10 10 0 01-2 15z" fill="#d6deea" />
          <path d="M46 40l-9 16h9l-6 16 17-22h-9l6-10z" fill="#ffc93c" />
          <path d="M24 50l-3 8M70 48l-3 8" stroke="#1fa2e0" />
        </svg>
      );
    case "fin":
      return (
        <svg viewBox="0 0 76 40" strokeWidth="2.4" {...common}>
          <path d="M22 30c6-12 14-22 26-26-2 10 0 18 8 26z" fill="#7c8ca6" />
          <path d="M30 26c4-6 8-10 12-12" stroke="#fff" strokeWidth="2" />
          <path d="M4 32q8-6 16 0t16 0 16 0 16 0" stroke="#fff" strokeWidth="2.6" />
        </svg>
      );
    case "bottle":
      return (
        <svg viewBox="0 0 46 30" strokeWidth="2.2" {...common}>
          <path d="M6 10h22l6 3h6v6h-6l-6 3H6a3 3 0 01-3-3v-6a3 3 0 013-3z" fill="#b8f0e8" />
          <path d="M9 13h14v6H9z" fill="#fbe7b8" />
          <path d="M40 13h4v6h-4z" fill="#c8773a" />
          <path d="M2 27q5-3 10 0t10 0" stroke="#fff" />
        </svg>
      );
    case "gulls":
      return (
        <svg viewBox="0 0 80 40" strokeWidth="2.4" {...common}>
          <path d="M4 18c5-6 10-6 13 0 3-6 8-6 13 0" />
          <path d="M44 30c4-5 8-5 10 0 2-5 6-5 10 0" />
          <path d="M52 10c3-4 6-4 8 0 2-4 5-4 8 0" />
        </svg>
      );
    case "whirl":
      return (
        <svg viewBox="0 0 40 40" strokeWidth="2.6" {...common} stroke="#fff">
          <path d="M20 20m-4 0a4 4 0 118 0 8 8 0 01-16 0 12 12 0 0124 0 16 16 0 01-32 0" />
        </svg>
      );
  }
}

/** Little ship that marks the player's current stage. */
export function ShipMarker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 54" fill="none" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M26 6v32" />
      <path d="M28 9c10 3 15 10 16 20H28z" fill="#fff" />
      <path d="M24 14c-8 3-12 8-13 15h13z" fill="#ffe27a" />
      <path d="M6 38h42l-6 10H12z" fill="#ff5a5f" />
      <path d="M26 6l9 3-9 3" fill={INK} />
    </svg>
  );
}
