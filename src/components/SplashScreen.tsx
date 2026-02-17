/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react'
import { css, keyframes } from '@emotion/react'
import { theme } from '../styles/theme'
import { Logo } from './Logo'

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
        gap: 12px;
        animation: ${phase === 'fade' ? fadeOut : 'none'} ${FADE_MS}ms ease-out forwards;
      `}
    >
      <div
        css={css`
          animation: ${fadeInUp} 0.7s ease-out both;
        `}
      >
        <Logo variant="splash" />
      </div>
      <span
        css={css`
          font-size: 0.85rem;
          color: ${theme.colors.primaryLight};
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
