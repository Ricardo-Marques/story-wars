/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react'
import { css, keyframes } from '@emotion/react'
import { theme } from '../styles/theme'

const fadeInUp = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

const fadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`

const taglineIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`

const SHOW_MS = 1800
const FADE_MS = 500

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'show' | 'fade' | 'done'>('show')

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('fade'), SHOW_MS)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (phase === 'fade') {
      const fadeTimer = setTimeout(() => {
        setPhase('done')
        onDone()
      }, FADE_MS)
      return () => clearTimeout(fadeTimer)
    }
  }, [phase, onDone])

  if (phase === 'done') return null

  return (
    <div
      css={css`
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: ${theme.colors.primary};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        animation: ${phase === 'fade' ? fadeOut : 'none'} ${FADE_MS}ms ease-out forwards;
      `}
    >
      <svg
        viewBox="0 0 340 50"
        css={css`
          width: 280px;
          height: auto;
          animation: ${fadeInUp} 0.7s ease-out both;
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
          fill="#FFFFFF"
        >
          Story Wars
        </text>
      </svg>
      <span
        css={css`
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 1.5px;
          font-weight: 300;
          opacity: 0;
          animation: ${taglineIn} 0.5s ease-out 0.4s forwards;
        `}
      >
        Write stories. Guess authors. Win glory.
      </span>
    </div>
  )
}
