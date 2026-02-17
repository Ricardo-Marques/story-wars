/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { theme } from '../styles/theme'

export function Logo({ variant }: { variant?: 'default' | 'splash' }) {
  const isSplash = variant === 'splash'

  return (
    <svg
      viewBox="0 0 340 50"
      css={css`
        width: 280px;
        height: auto;
        filter: drop-shadow(0 0 12px ${theme.colors.primaryLight}40);
      `}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isSplash ? '#D4C0F0' : theme.colors.primaryLight} />
          <stop offset="50%" stopColor={isSplash ? '#EAE0FF' : '#A87FE8'} />
          <stop offset="100%" stopColor={isSplash ? '#D4C0F0' : theme.colors.primaryLight} />
        </linearGradient>
      </defs>
      <text
        x="170"
        y="40"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontWeight="800"
        fontSize="44"
        letterSpacing="1"
        fill="url(#logo-grad)"
      >
        Story Wars
      </text>
    </svg>
  )
}
