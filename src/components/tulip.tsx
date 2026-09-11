import type { TulipStage } from "@/lib/tulip";
import { cn } from "@/lib/utils";

function Spark({ x, y, delay, size = 10 }: { x: number; y: number; delay: number; size?: number }) {
  return (
    <path
      d={`M${x} ${y - size} L${x + size * 0.28} ${y - size * 0.28} L${x + size} ${y} L${x + size * 0.28} ${y + size * 0.28} L${x} ${y + size} L${x - size * 0.28} ${y + size * 0.28} L${x - size} ${y} L${x - size * 0.28} ${y - size * 0.28} Z`}
      fill="#fbbf24"
      className="animate-sparkle"
      style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}
    />
  );
}

function Leaves({ y1, y2, scale }: { y1: number; y2: number; scale: number }) {
  return (
    <g transform={`translate(110 ${y1}) scale(${scale}) translate(-110 -${y1})`}>
      <path
        d={`M110 ${y1} C 94 ${y1 - 2} 82 ${y1 - 10} 78 ${y1 - 26} C 94 ${y1 - 22} 106 ${y1 - 12} 110 ${y1}`}
        fill="url(#leafGrad)"
      />
      <path
        d={`M110 ${y2} C 126 ${y2 - 2} 138 ${y2 - 10} 142 ${y2 - 26} C 126 ${y2 - 22} 114 ${y2 - 12} 110 ${y2}`}
        fill="url(#leafGrad)"
      />
    </g>
  );
}

export function Tulip({
  stage,
  className,
}: {
  stage: TulipStage;
  className?: string;
}) {
  const hasHead = stage === "bud" || stage === "opening" || stage === "bloom";
  const sway = stage !== "seed";

  return (
    <svg
      viewBox="0 0 220 270"
      className={cn("select-none", className)}
      role="img"
      aria-label={`Daily tulip stage: ${stage}`}
    >
      <defs>
        <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="potRimGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="petalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="petalInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff0f6" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
        <radialGradient id="bloomGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {stage === "bloom" && (
        <circle cx="110" cy="96" r="82" fill="url(#bloomGlow)" className="animate-pulse-soft" style={{ transformOrigin: "110px 96px" }} />
      )}

      {/* Pot */}
      <g>
        <ellipse cx="110" cy="258" rx="52" ry="7" fill="#f9a8d4" opacity="0.35" />
        <rect x="64" y="196" width="92" height="18" rx="8" fill="url(#potRimGrad)" />
        <path
          d="M71 214 L149 214 L140 254 Q139 259 133 259 L87 259 Q81 259 80 254 Z"
          fill="url(#potGrad)"
        />
        <path d="M84 224 L92 252" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        <ellipse cx="110" cy="205" rx="38" ry="6.5" fill="#b0768a" />
      </g>

      {/* Plant */}
      <g
        className={sway ? "animate-sway" : undefined}
        style={{ transformOrigin: "110px 258px" }}
      >
        {stage === "seed" && (
          <g>
            <ellipse cx="110" cy="198" rx="7" ry="4.5" fill="#8d5a4a" transform="rotate(-18 110 198)" />
            <ellipse cx="108" cy="196.5" rx="2" ry="1.2" fill="#c98f7c" transform="rotate(-18 108 196.5)" />
            <Spark x={132} y={184} delay={0.4} size={6} />
          </g>
        )}

        {stage === "sprout" && (
          <g>
            <path d="M110 198 C110 186 108 178 110 168" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M110 184 C99 181 91 175 89 164 C100 167 108 174 110 184" fill="url(#leafGrad)" />
            <path d="M110 174 C121 171 129 165 131 154 C120 157 112 164 110 174" fill="url(#leafGrad)" />
          </g>
        )}

        {hasHead && (
          <g>
            <path
              d={stage === "bud" ? "M110 198 C112 172 108 150 110 126" : "M110 198 C112 168 108 148 110 134"}
              stroke="url(#stemGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <Leaves y1={158} y2={146} scale={stage === "bud" ? 0.9 : 1.05} />
            {/* sepals */}
            <path d="M110 128 C101 133 96 141 95 151 C103 147 108 139 110 128" fill="url(#leafGrad)" />
            <path d="M110 128 C119 133 124 141 125 151 C117 147 112 139 110 128" fill="url(#leafGrad)" />
          </g>
        )}

        {stage === "bud" && (
          <g key="bud" className="animate-fade-up">
            <path
              d="M110 62 C96 70 91 88 95 105 C98 118 104 124 110 124 C116 124 122 118 125 105 C129 88 124 70 110 62 Z"
              fill="url(#petalGrad)"
            />
            <path d="M110 64 C110 84 110 104 110 122" stroke="#be185d" strokeWidth="1.4" opacity="0.4" />
            <path d="M100 70 C97 84 97 100 100 114" stroke="#be185d" strokeWidth="1.2" opacity="0.3" fill="none" />
            <path d="M120 70 C123 84 123 100 120 114" stroke="#be185d" strokeWidth="1.2" opacity="0.3" fill="none" />
          </g>
        )}

        {stage === "opening" && (
          <g key="opening" className="animate-fade-up">
            <path d="M110 68 C94 72 84 88 86 106 C88 118 96 126 105 125 C99 110 101 82 110 68 Z" fill="url(#petalGrad)" />
            <path d="M110 68 C126 72 136 88 134 106 C132 118 124 126 115 125 C121 110 119 82 110 68 Z" fill="url(#petalGrad)" />
            <path d="M110 60 C102 66 99 82 101 100 C103 114 106 122 110 125 C114 122 117 114 119 100 C121 82 118 66 110 60 Z" fill="url(#petalInner)" />
          </g>
        )}

        {stage === "bloom" && (
          <g key="bloom" className="animate-fade-up">
            <path d="M110 62 C88 64 70 82 68 104 C67 122 78 134 94 132 C87 112 93 76 110 62 Z" fill="url(#petalGrad)" />
            <path d="M110 62 C132 64 150 82 152 104 C153 122 142 134 126 132 C133 112 127 76 110 62 Z" fill="url(#petalGrad)" />
            <path d="M110 54 C100 60 96 80 98 102 C100 118 105 128 110 131 C115 128 120 118 122 102 C124 80 120 60 110 54 Z" fill="url(#petalInner)" />
            <path d="M110 70 C106 86 106 106 110 126 M96 84 C94 98 95 114 100 126 M124 84 C126 98 125 114 120 126" stroke="#db2777" strokeWidth="1.2" opacity="0.35" fill="none" />
            <Spark x={62} y={66} delay={0} size={9} />
            <Spark x={160} y={52} delay={0.9} size={7} />
            <Spark x={150} y={120} delay={1.6} size={8} />
            <Spark x={54} y={122} delay={2.2} size={6} />
            <g className="animate-float" style={{ animationDelay: "0.6s" }}>
              <path d="M170 88 C176 84 182 86 183 92 C177 95 171 94 170 88 Z" fill="#f9a8d4" opacity="0.85" />
            </g>
            <g className="animate-float" style={{ animationDelay: "1.8s" }}>
              <path d="M42 74 C48 70 54 72 55 78 C49 81 43 80 42 74 Z" fill="#fbcfe8" opacity="0.9" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}
