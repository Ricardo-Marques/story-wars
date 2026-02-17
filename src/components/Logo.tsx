/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { theme } from '../styles/theme'

export function Logo() {
  return (
    <svg
      viewBox="0 0 340 50"
      css={css`
        width: 280px;
        height: auto;
        filter: drop-shadow(0 2px 8px ${theme.colors.primaryLight}30);
      `}
    >
      <text
        x="170"
        y="40"
        textAnchor="middle"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontWeight="800"
        fontSize="44"
        letterSpacing="1"
        fill={theme.colors.primaryLight}
      >
        Story Wars
      </text>
    </svg>
  )
}
