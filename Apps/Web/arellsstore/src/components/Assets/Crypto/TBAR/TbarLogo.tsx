import React from 'react';

type TbarLogoProps = {
  className?: string;
  title?: string;
};

/**
 * TBAR wordmark as SVG — continuous geometric strokes matching the title art.
 * Glossy orange via gradient + edge highlight (not a raster image).
 */
export default function TbarLogo({ className, title = 'TBAR' }: TbarLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 130"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="tbarStroke" x1="0" y1="0" x2="0" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffc56e" />
          <stop offset="35%" stopColor="#f89a22" />
          <stop offset="70%" stopColor="#f88d00" />
          <stop offset="100%" stopColor="#d96500" />
        </linearGradient>
        <linearGradient id="tbarHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6e8" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#ffd59a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="tbarGlow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#8c4300" floodOpacity="0.45" />
        </filter>
      </defs>

      <g
        filter="url(#tbarGlow)"
        fill="none"
        stroke="url(#tbarStroke)"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* T bar → into B top; T/B stem */}
        <path d="M28 34 H118" />
        <path d="M72 34 V108" />

        {/* B bowls (open to stem) */}
        <path d="M72 34 C128 34 128 62 72 62" />
        <path d="M72 62 C134 62 134 108 72 108" />

        {/* B mid bar → into A */}
        <path d="M72 62 H168" />

        {/* A — barless chevron */}
        <path d="M148 108 L178 34 L208 108" />

        {/* R — bowl from A peak + kick (stem is A’s right leg) */}
        <path d="M208 34 C262 34 262 66 208 66" />
        <path d="M208 66 L258 108" />
      </g>

      {/* Glass sheen on the upper strokes */}
      <g
        fill="none"
        stroke="url(#tbarHighlight)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        pointerEvents="none"
      >
        <path d="M32 30 H114" />
        <path d="M72 34 C118 34 118 54 80 58" />
        <path d="M156 96 L178 40 L198 90" />
        <path d="M208 34 C248 34 252 52 220 60" />
      </g>
    </svg>
  );
}
