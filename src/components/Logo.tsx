/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react'
import { theme } from '../styles/theme'

export type LogoVariant = 'draw' | 'flicker' | 'sweep'

interface LogoProps {
  variant?: LogoVariant
}

// ── Variant A: Stroke Draw + Glow ──────────────────────────────────
// The outline draws itself on, then fills in and pulses with a neon glow.

const drawIn = keyframes`
  0% { stroke-dashoffset: 600; opacity: 0.6; }
  80% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
`

const fillIn = keyframes`
  0%, 70% { fill-opacity: 0; }
  100% { fill-opacity: 1; }
`

const glowPulse = keyframes`
  0%, 100% { filter: drop-shadow(0 0 6px ${theme.colors.primary}88) drop-shadow(0 0 20px ${theme.colors.primary}44); }
  50% { filter: drop-shadow(0 0 12px ${theme.colors.primary}cc) drop-shadow(0 0 35px ${theme.colors.primary}66); }
`

function DrawLogo() {
  return (
    <svg
      viewBox="0 0 340 50"
      css={css`
        width: 280px;
        height: auto;
        animation: ${glowPulse} 3s ease-in-out infinite;
        animation-delay: 1.8s;
      `}
    >
      <defs>
        <linearGradient id="neon-draw" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.colors.primary} />
          <stop offset="50%" stopColor={theme.colors.secondary} />
          <stop offset="100%" stopColor={theme.colors.primary} />
        </linearGradient>
      </defs>
      <text
        x="170"
        y="40"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontWeight="900"
        fontSize="46"
        letterSpacing="-1"
        fill="url(#neon-draw)"
        stroke={theme.colors.primary}
        strokeWidth="1.5"
        strokeDasharray="600"
        strokeDashoffset="600"
        css={css`
          animation:
            ${drawIn} 1.8s ease-out forwards,
            ${fillIn} 2s ease-out forwards;
        `}
      >
        Story Wars
      </text>
    </svg>
  )
}

// ── Variant B: Neon Flicker ────────────────────────────────────────
// Each letter "turns on" like a neon sign, with a brief flicker.

const flickerOn = keyframes`
  0% { opacity: 0; }
  10% { opacity: 0.7; }
  15% { opacity: 0.3; }
  25% { opacity: 0.9; }
  30% { opacity: 0.5; }
  40% { opacity: 1; }
  100% { opacity: 1; }
`

const subtleFlicker = keyframes`
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.8; }
  94% { opacity: 1; }
  97% { opacity: 0.9; }
  98% { opacity: 1; }
`

function FlickerLogo() {
  const letters = 'Story Wars'.split('')
  // Character x positions (manually tuned for the font)
  const positions = [24, 56, 86, 110, 136, 170, 202, 236, 262, 288]

  return (
    <svg
      viewBox="0 0 320 55"
      css={css`
        width: 280px;
        height: auto;
      `}
    >
      <defs>
        <filter id="neon-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="neon-flick" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.colors.primary} />
          <stop offset="60%" stopColor={theme.colors.secondary} />
          <stop offset="100%" stopColor={theme.colors.primary} />
        </linearGradient>
      </defs>
      {letters.map((letter, i) => (
        <text
          key={i}
          x={positions[i]}
          y="42"
          fontFamily="'Segoe UI', system-ui, sans-serif"
          fontWeight="900"
          fontSize="46"
          fill="url(#neon-flick)"
          filter="url(#neon-glow)"
          css={css`
            opacity: 0;
            animation:
              ${flickerOn} 0.5s ease-out ${i * 0.12}s forwards,
              ${subtleFlicker} ${6 + (i % 3)}s ease-in-out ${1.5 + i * 0.12}s infinite;
          `}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </text>
      ))}
    </svg>
  )
}

// ── Variant C: Glow Sweep ──────────────────────────────────────────
// Static text with a bright highlight that sweeps across continuously.

const sweepMove = keyframes`
  0% { x: -120; }
  100% { x: 380; }
`

function SweepLogo() {
  return (
    <svg
      viewBox="0 0 340 55"
      css={css`
        width: 280px;
        height: auto;
        filter: drop-shadow(0 0 8px ${theme.colors.primary}66)
          drop-shadow(0 0 25px ${theme.colors.primary}33);
      `}
    >
      <defs>
        <linearGradient id="neon-base" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={theme.colors.primary} />
          <stop offset="50%" stopColor={theme.colors.secondary} />
          <stop offset="100%" stopColor={theme.colors.primary} />
        </linearGradient>
        <linearGradient id="sweep-highlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id="text-clip">
          <text
            x="170"
            y="42"
            textAnchor="middle"
            fontFamily="'Segoe UI', system-ui, sans-serif"
            fontWeight="900"
            fontSize="46"
            letterSpacing="-1"
          >
            Story Wars
          </text>
        </clipPath>
      </defs>
      {/* Base gradient text */}
      <text
        x="170"
        y="42"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontWeight="900"
        fontSize="46"
        letterSpacing="-1"
        fill="url(#neon-base)"
      >
        Story Wars
      </text>
      {/* Sweeping highlight clipped to text shape */}
      <rect
        y="0"
        width="120"
        height="55"
        fill="url(#sweep-highlight)"
        clipPath="url(#text-clip)"
        css={css`
          animation: ${sweepMove} 3s ease-in-out infinite;
        `}
      />
    </svg>
  )
}

// ── Public component ───────────────────────────────────────────────

export function Logo({ variant = 'draw' }: LogoProps) {
  switch (variant) {
    case 'draw':
      return <DrawLogo />
    case 'flicker':
      return <FlickerLogo />
    case 'sweep':
      return <SweepLogo />
  }
}
