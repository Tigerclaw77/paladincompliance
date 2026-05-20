import type { CSSProperties } from "react";

type AnimatedPaladinShieldProps = {
  animated?: boolean;
  ariaLabel?: string;
  className?: string;
  showBackground?: boolean;
};

export default function AnimatedPaladinShield({
  animated = true,
  ariaLabel = "Animated Paladin Compliance shield mark",
  className = "",
  showBackground = true,
}: AnimatedPaladinShieldProps) {
  const motionClass = animated ? "paladin-shield-animated" : "paladin-shield-static";

  return (
    <div
      className={`relative aspect-[0.78] w-full max-w-[360px] overflow-hidden rounded-[28px] ${className}`}
    >
      <svg
        aria-label={ariaLabel}
        className={`h-full w-full ${motionClass}`}
        role="img"
        viewBox="0 0 360 460"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="paladin-shield-bg" cx="50%" cy="47%" r="72%">
            <stop offset="0%" stopColor="#13243a" />
            <stop offset="54%" stopColor="#071526" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>
          <radialGradient id="paladin-shield-haze" cx="50%" cy="44%" r="58%">
            <stop offset="0%" stopColor="#f0d28a" stopOpacity="0.18" />
            <stop offset="42%" stopColor="#d8b66d" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#d8b66d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="paladin-shield-depth-haze" cx="50%" cy="48%" r="64%">
            <stop offset="0%" stopColor="#f6dda2" stopOpacity="0.11" />
            <stop offset="46%" stopColor="#527092" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#071526" stopOpacity="0" />
          </radialGradient>
          <filter
            id="paladin-shield-soft-glow"
            colorInterpolationFilters="sRGB"
            height="150%"
            width="150%"
            x="-25%"
            y="-25%"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter
            id="paladin-shield-line-glow"
            colorInterpolationFilters="sRGB"
            height="140%"
            width="140%"
            x="-20%"
            y="-20%"
          >
            <feGaussianBlur stdDeviation="1.7" />
          </filter>
          <filter
            id="paladin-shield-particle-glow"
            colorInterpolationFilters="sRGB"
            height="500%"
            width="500%"
            x="-200%"
            y="-200%"
          >
            <feGaussianBlur stdDeviation="1.25" />
          </filter>
          <linearGradient id="paladin-shield-line" x1="80" x2="282" y1="56" y2="424">
            <stop offset="0%" stopColor="#f3d996" />
            <stop offset="48%" stopColor="#c8a45d" />
            <stop offset="100%" stopColor="#f2d690" />
          </linearGradient>
          <linearGradient id="paladin-shield-faint-line" x1="180" x2="180" y1="64" y2="394">
            <stop offset="0%" stopColor="#f6dd9b" stopOpacity="0.28" />
            <stop offset="52%" stopColor="#d2ad63" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#f3d892" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        <style>
          {`
            .paladin-shield-animated .paladin-shield-glow {
              animation: paladinShieldPulse 14s ease-in-out infinite;
              transform-origin: 180px 238px;
              will-change: opacity, transform;
            }

            .paladin-shield-animated .paladin-shield-edge-breath {
              animation: paladinShieldEdgeBreath 14s ease-in-out infinite;
              will-change: opacity;
            }

            .paladin-shield-animated .paladin-shield-shimmer {
              animation: paladinShieldShimmer 14s linear infinite;
              stroke-dasharray: 0.11 0.89;
              will-change: stroke-dashoffset, opacity;
            }

            .paladin-shield-animated .paladin-shield-inner-shimmer {
              animation: paladinShieldInnerShimmer 18s linear infinite;
              stroke-dasharray: 0.08 0.92;
              will-change: stroke-dashoffset, opacity;
            }

            .paladin-shield-animated .paladin-shield-haze {
              animation: paladinShieldHaze 16s ease-in-out infinite;
              transform-origin: 180px 244px;
              will-change: opacity, transform;
            }

            .paladin-shield-animated .paladin-shield-depth-haze {
              animation: paladinShieldDepthHaze 20s ease-in-out infinite;
              transform-origin: 180px 234px;
              will-change: opacity, transform;
            }

            .paladin-shield-animated .paladin-shield-particle {
              animation: paladinShieldParticle 12s ease-in-out infinite;
              opacity: var(--particle-opacity, 0.24);
              transform-origin: center;
              will-change: opacity, transform;
            }

            .paladin-shield-animated .paladin-shield-twinkle {
              animation: paladinShieldTwinkle 17s ease-in-out infinite;
              opacity: 0.08;
              transform-origin: center;
              will-change: opacity, transform;
            }

            .paladin-shield-animated .paladin-shield-particle:nth-of-type(2n) {
              animation-duration: 14s;
            }

            .paladin-shield-animated .paladin-shield-particle:nth-of-type(3n) {
              animation-duration: 16s;
            }

            .paladin-shield-animated .paladin-shield-particle-delay-1 {
              animation-delay: -3s;
            }

            .paladin-shield-animated .paladin-shield-particle-delay-2 {
              animation-delay: -6s;
            }

            .paladin-shield-animated .paladin-shield-particle-delay-3 {
              animation-delay: -9s;
            }

            .paladin-shield-animated .paladin-shield-twinkle-delay-1 {
              animation-delay: -4s;
            }

            .paladin-shield-animated .paladin-shield-twinkle-delay-2 {
              animation-delay: -9s;
            }

            .paladin-shield-animated .paladin-shield-twinkle-delay-3 {
              animation-delay: -13s;
            }

            @keyframes paladinShieldPulse {
              0%, 100% {
                opacity: 0.26;
                transform: scale(0.992);
              }
              50% {
                opacity: 0.46;
                transform: scale(1.011);
              }
            }

            @keyframes paladinShieldEdgeBreath {
              0%, 100% {
                opacity: 0.32;
              }
              50% {
                opacity: 0.52;
              }
            }

            @keyframes paladinShieldShimmer {
              0% {
                opacity: 0.08;
                stroke-dashoffset: 0;
              }
              45% {
                opacity: 0.34;
              }
              100% {
                opacity: 0.08;
                stroke-dashoffset: -1;
              }
            }

            @keyframes paladinShieldInnerShimmer {
              0% {
                opacity: 0.04;
                stroke-dashoffset: -0.35;
              }
              52% {
                opacity: 0.18;
              }
              100% {
                opacity: 0.04;
                stroke-dashoffset: -1.35;
              }
            }

            @keyframes paladinShieldHaze {
              0%, 100% {
                opacity: 0.5;
                transform: translateY(0);
              }
              50% {
                opacity: 0.72;
                transform: translateY(-6px) scale(1.02);
              }
            }

            @keyframes paladinShieldDepthHaze {
              0%, 100% {
                opacity: 0.34;
                transform: translate3d(0, 0, 0) scale(0.99);
              }
              50% {
                opacity: 0.58;
                transform: translate3d(4px, -8px, 0) scale(1.035);
              }
            }

            @keyframes paladinShieldParticle {
              0%, 100% {
                opacity: var(--particle-dim-opacity, 0.12);
                transform: translateY(0) scale(0.9);
              }
              50% {
                opacity: var(--particle-opacity, 0.24);
                transform: translateY(-5px) scale(1.08);
              }
            }

            @keyframes paladinShieldTwinkle {
              0%, 18%, 24%, 100% {
                opacity: 0.08;
                transform: scale(0.82);
              }
              20.5% {
                opacity: 0.58;
                transform: scale(1.16);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .paladin-shield-animated .paladin-shield-glow,
              .paladin-shield-animated .paladin-shield-edge-breath,
              .paladin-shield-animated .paladin-shield-shimmer,
              .paladin-shield-animated .paladin-shield-inner-shimmer,
              .paladin-shield-animated .paladin-shield-haze,
              .paladin-shield-animated .paladin-shield-depth-haze,
              .paladin-shield-animated .paladin-shield-particle,
              .paladin-shield-animated .paladin-shield-twinkle {
                animation: none;
              }
            }
          `}
        </style>

        {showBackground && <rect fill="url(#paladin-shield-bg)" height="460" width="360" />}
        <ellipse
          className="paladin-shield-haze"
          cx="180"
          cy="234"
          fill="url(#paladin-shield-haze)"
          rx="138"
          ry="174"
        />
        <ellipse
          className="paladin-shield-depth-haze"
          cx="180"
          cy="238"
          fill="url(#paladin-shield-depth-haze)"
          rx="126"
          ry="186"
        />
        <ellipse
          className="paladin-shield-haze"
          cx="180"
          cy="405"
          fill="#d7b36b"
          opacity="0.1"
          rx="92"
          ry="11"
        />

        <g
          className="paladin-shield-glow"
          fill="none"
          filter="url(#paladin-shield-soft-glow)"
          stroke="#d8b66d"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M180 35C217 75 262 96 311 100C311 221 266 335 180 421C94 335 49 221 49 100C98 96 143 75 180 35Z"
            opacity="0.62"
            strokeWidth="9"
          />
          <path
            d="M180 58C211 90 250 108 292 112C290 222 251 318 180 391C109 318 70 222 68 112C110 108 149 90 180 58Z"
            opacity="0.38"
            strokeWidth="5"
          />
        </g>

        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="paladin-shield-edge-breath"
            d="M180 35C217 75 262 96 311 100C311 221 266 335 180 421C94 335 49 221 49 100C98 96 143 75 180 35Z"
            filter="url(#paladin-shield-line-glow)"
            stroke="#f2d690"
            strokeWidth="3.6"
          />
          <path
            d="M180 35C217 75 262 96 311 100C311 221 266 335 180 421C94 335 49 221 49 100C98 96 143 75 180 35Z"
            pathLength="1"
            stroke="url(#paladin-shield-line)"
            strokeWidth="2.4"
          />
          <path
            d="M180 58C211 90 250 108 292 112C290 222 251 318 180 391C109 318 70 222 68 112C110 108 149 90 180 58Z"
            opacity="0.74"
            stroke="url(#paladin-shield-line)"
            strokeWidth="1.45"
          />
          <path
            d="M180 72L180 376"
            opacity="0.64"
            stroke="url(#paladin-shield-faint-line)"
            strokeWidth="0.85"
          />
          <path
            className="paladin-shield-shimmer"
            d="M180 35C217 75 262 96 311 100C311 221 266 335 180 421C94 335 49 221 49 100C98 96 143 75 180 35Z"
            pathLength="1"
            stroke="#fff2c6"
            strokeWidth="3"
          />
          <path
            className="paladin-shield-inner-shimmer"
            d="M180 58C211 90 250 108 292 112C290 222 251 318 180 391C109 318 70 222 68 112C110 108 149 90 180 58Z"
            pathLength="1"
            stroke="#fff2c6"
            strokeWidth="1.7"
          />
        </g>

        <g fill="#f0d28a" filter="url(#paladin-shield-particle-glow)">
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-1"
            cx="106"
            cy="122"
            r="1.35"
            style={
              {
                "--particle-dim-opacity": 0.16,
                "--particle-opacity": 0.34,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-2"
            cx="255"
            cy="142"
            r="1.2"
            style={
              {
                "--particle-dim-opacity": 0.14,
                "--particle-opacity": 0.3,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-3"
            cx="132"
            cy="264"
            r="0.9"
            style={
              {
                "--particle-dim-opacity": 0.12,
                "--particle-opacity": 0.24,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-1"
            cx="232"
            cy="304"
            r="1.25"
            style={
              {
                "--particle-dim-opacity": 0.14,
                "--particle-opacity": 0.3,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-2"
            cx="291"
            cy="257"
            r="0.8"
            style={
              {
                "--particle-dim-opacity": 0.12,
                "--particle-opacity": 0.24,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-3"
            cx="70"
            cy="318"
            r="0.75"
            style={
              {
                "--particle-dim-opacity": 0.11,
                "--particle-opacity": 0.22,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-1"
            cx="267"
            cy="85"
            r="0.85"
            style={
              {
                "--particle-dim-opacity": 0.12,
                "--particle-opacity": 0.24,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-2"
            cx="91"
            cy="207"
            r="0.85"
            style={
              {
                "--particle-dim-opacity": 0.11,
                "--particle-opacity": 0.22,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-3"
            cx="302"
            cy="188"
            r="0.7"
            style={
              {
                "--particle-dim-opacity": 0.1,
                "--particle-opacity": 0.2,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-particle paladin-shield-particle-delay-2"
            cx="58"
            cy="154"
            r="0.72"
            style={
              {
                "--particle-dim-opacity": 0.1,
                "--particle-opacity": 0.2,
              } as CSSProperties
            }
          />
          <circle
            className="paladin-shield-twinkle paladin-shield-twinkle-delay-1"
            cx="180"
            cy="71"
            r="1.1"
          />
          <circle
            className="paladin-shield-twinkle paladin-shield-twinkle-delay-2"
            cx="275"
            cy="116"
            r="0.95"
          />
          <circle
            className="paladin-shield-twinkle paladin-shield-twinkle-delay-3"
            cx="84"
            cy="107"
            r="0.95"
          />
          <circle
            className="paladin-shield-twinkle paladin-shield-twinkle-delay-1"
            cx="180"
            cy="391"
            r="0.9"
          />
        </g>
      </svg>
    </div>
  );
}
