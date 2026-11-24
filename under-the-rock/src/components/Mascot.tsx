"use client";

/**
 * ANIMATION SLOT — "Pebble", the little critter who lives under the rock.
 *
 * This is a placeholder built with plain SVG + CSS so the app has personality today.
 * Later you can swap the inside of this component for a Lottie or Rive animation
 * (e.g. <DotLottieReact src="/animations/pebble-dig.lottie" autoplay loop />) and keep
 * the same `mood` prop, so the rest of the app doesn't need to change.
 *
 * Moods:
 *   idle      – peeks out and blinks now and then (header)
 *   dig       – digging for news (loading)
 *   sleep     – nothing new, snoozing (empty state)
 *   celebrate – fresh news arrived
 */
export type Mood = "idle" | "dig" | "sleep" | "celebrate";

export default function Mascot({ mood = "idle", size = 72, animate = true }: { mood?: Mood; size?: number; animate?: boolean }) {
  return (
    <div className={`mascot mood-${mood} ${animate ? "" : "still"}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* dirt specks (dig mood) */}
        <g className="dirt">
          <circle cx="22" cy="78" r="3" />
          <circle cx="78" cy="76" r="2.5" />
          <circle cx="30" cy="70" r="2" />
        </g>
        {/* the critter */}
        <g className="critter">
          <ellipse cx="50" cy="62" rx="20" ry="18" fill="#f2b8a2" />
          <ellipse cx="44" cy="70" rx="4" ry="2.5" fill="#e8907a" opacity=".6" />
          <ellipse cx="60" cy="70" rx="4" ry="2.5" fill="#e8907a" opacity=".6" />
          <g className="eyes">
            <ellipse cx="43" cy="60" rx="3" ry="3.6" fill="#3b2f2a" />
            <ellipse cx="57" cy="60" rx="3" ry="3.6" fill="#3b2f2a" />
            <circle cx="44" cy="58.8" r="1" fill="#fff" />
            <circle cx="58" cy="58.8" r="1" fill="#fff" />
          </g>
          <path className="sleepy-eyes" d="M39 61 q4 3 8 0 M53 61 q4 3 8 0" stroke="#3b2f2a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M47 67 q3 2.5 6 0" stroke="#3b2f2a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* the rock */}
        <g className="rock">
          <path d="M12 84 C10 70 22 58 38 60 C46 52 64 52 72 60 C86 60 94 72 90 84 Z" fill="#9aa39a" />
          <path d="M24 70 q6 -4 12 -2 M62 64 q8 0 12 6" stroke="#7f887f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="67" rx="6" ry="2" fill="#b7beb6" />
          <path d="M8 86 H92" stroke="#7a6a55" strokeWidth="3" strokeLinecap="round" />
        </g>
        <text className="zzz" x="70" y="34" fontSize="12" fill="#7f887f">z</text>
        <g className="sparkles" fill="#f4c95d">
          <path d="M20 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" />
          <path d="M80 24 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5z" />
        </g>
      </svg>
    </div>
  );
}
