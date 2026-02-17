/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react'
import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import { theme } from '../styles/theme'
import { Button } from './Button'

// ── Animations ──────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0 }
  to { opacity: 1 }
`
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(14px) }
  to { opacity: 1; transform: translateY(0) }
`
const popIn = keyframes`
  0% { opacity: 0; transform: scale(0.3) }
  80% { transform: scale(1.08) }
  100% { opacity: 1; transform: scale(1) }
`
const growUp = keyframes`
  from { transform: scaleY(0) }
  to { transform: scaleY(1) }
`
const blink = keyframes`
  0%, 100% { opacity: 1 }
  50% { opacity: 0 }
`
const bounceIn = keyframes`
  0% { opacity: 0; transform: translateY(-14px) }
  60% { transform: translateY(2px) }
  100% { opacity: 1; transform: translateY(0) }
`

// ── Styled components ───────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.space.md};
`

const Panel = styled.div`
  background: ${theme.colors.bgLight};
  border: 1px solid ${theme.colors.textMuted}22;
  border-radius: ${theme.radii.lg};
  padding: ${theme.space.lg} ${theme.space.lg} ${theme.space.md};
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.md};
`

const SceneBox = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: ${theme.space.sm};
  background: ${theme.colors.bg};
  border-radius: ${theme.radii.md};
`

const StepTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
`

const StepDesc = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  text-align: center;
  line-height: 1.5;
  margin: 0;
  min-height: 2.6em;
`

const NavRow = styled.div`
  display: flex;
  gap: ${theme.space.sm};
  width: 100%;
`

// ── Helpers ─────────────────────────────────────────────────────

const svgCss = css`width: 100%; max-width: 280px; height: auto;`
const c = theme.colors

function ani(kf: Parameters<typeof css>[0], dur: number, del: number) {
  return css`opacity: 0; animation: ${kf} ${dur}s ease-out ${del}s forwards;`
}

// ── Scene 1: Join ───────────────────────────────────────────────

function JoinScene() {
  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* Avatar 1 */}
      <circle cx="40" cy="38" r="18" fill={c.primaryLight + '33'} stroke={c.primaryLight}
        strokeWidth="1.5" css={ani(slideUp, 0.5, 0)} />
      {/* Avatar 2 */}
      <circle cx="200" cy="38" r="18" fill={c.secondary + '33'} stroke={c.secondary}
        strokeWidth="1.5" css={ani(slideUp, 0.5, 0.15)} />
      {/* Avatar 3 */}
      <circle cx="120" cy="118" r="18" fill={c.warning + '33'} stroke={c.warning}
        strokeWidth="1.5" css={ani(slideUp, 0.5, 0.3)} />

      {/* Connecting lines */}
      <line x1="56" y1="44" x2="78" y2="58" stroke={c.textMuted + '33'} strokeWidth="1" css={ani(fadeIn, 0.3, 0.6)} />
      <line x1="184" y1="44" x2="162" y2="58" stroke={c.textMuted + '33'} strokeWidth="1" css={ani(fadeIn, 0.3, 0.65)} />
      <line x1="120" y1="100" x2="120" y2="86" stroke={c.textMuted + '33'} strokeWidth="1" css={ani(fadeIn, 0.3, 0.7)} />

      {/* Room code badge */}
      <rect x="78" y="52" width="84" height="36" rx="10" fill={c.bgCard}
        stroke={c.primaryLight + '66'} strokeWidth="1" css={ani(fadeIn, 0.4, 0.5)} />
      <text x="120" y="66" textAnchor="middle" fontSize="7" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 0.75)}>ROOM CODE</text>
      <text x="120" y="81" textAnchor="middle" fontSize="14" fontWeight="800"
        letterSpacing="3" fill={c.primaryLight} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.85)}>XK4W</text>
    </svg>
  )
}

// ── Scene 2: Topics ─────────────────────────────────────────────

function TopicsScene() {
  const topics = [
    { x: 18, y: 18, emoji: '\uD83D\uDE31', label: 'Embarrassing' },
    { x: 128, y: 18, emoji: '\uD83E\uDD25', label: 'Biggest lie' },
    { x: 18, y: 74, emoji: '\uD83C\uDF19', label: 'Weird dream' },
    { x: 128, y: 74, emoji: '\uD83D\uDE02', label: 'Funniest' },
  ]
  const sel = [0, 3]

  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {topics.map((t, i) => {
        const isSel = sel.includes(i)
        const d = 0.1 + i * 0.12
        return (
          <g key={i} css={ani(slideUp, 0.4, d)}>
            <rect x={t.x} y={t.y} width="94" height="44" rx="10"
              fill={c.bgCard} stroke={c.textMuted + '22'} strokeWidth="1" />
            {isSel && (
              <rect x={t.x} y={t.y} width="94" height="44" rx="10"
                fill={c.primaryLight + '22'} stroke={c.primaryLight} strokeWidth="1.5"
                css={ani(fadeIn, 0.3, d + 0.5)} />
            )}
            <text x={t.x + 14} y={t.y + 28} fontSize="16">{t.emoji}</text>
            <text x={t.x + 34} y={t.y + 26} fontSize="8" fill={c.textMuted}
              fontFamily="inherit">{t.label}</text>
            {isSel && (
              <g css={css`
                opacity: 0;
                transform-box: fill-box;
                transform-origin: center;
                animation: ${popIn} 0.3s ease-out ${d + 0.7}s forwards;
              `}>
                <text x={t.x + 80} y={t.y + 16} fontSize="12" fill={c.success}>✓</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Scene 3: Write ──────────────────────────────────────────────

function WriteScene() {
  const lines = [
    { y: 40, w: 140 },
    { y: 56, w: 160 },
    { y: 72, w: 120 },
    { y: 88, w: 85 },
  ]
  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* Paper */}
      <rect x="30" y="14" width="180" height="112" rx="12" fill={c.bgCard}
        stroke={c.textMuted + '22'} strokeWidth="1" />
      {/* Topic */}
      <text x="50" y="32" fontSize="7.5" fill={c.textMuted} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.2)}>😱 Most embarrassing moment</text>
      {/* Text lines */}
      {lines.map((l, i) => (
        <rect key={i} x="50" y={l.y} width={l.w} height="6" rx="3"
          fill={c.textMuted + '44'} css={ani(fadeIn, 0.3, 0.4 + i * 0.3)} />
      ))}
      {/* Cursor */}
      <rect x={50 + lines[3].w + 4} y={lines[3].y - 1} width="2" height="10" rx="1"
        fill={c.primaryLight} css={css`
          opacity: 0;
          animation: ${fadeIn} 0.2s ease-out ${0.4 + lines.length * 0.3}s forwards,
                     ${blink} 0.8s step-end ${0.6 + lines.length * 0.3}s infinite;
        `} />
    </svg>
  )
}

// ── Scene 4: Vote ───────────────────────────────────────────────

function VoteScene() {
  const avatars = [
    { cx: 70, fill: c.primaryLight },
    { cx: 120, fill: c.secondary },
    { cx: 170, fill: c.warning },
  ]
  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* Story card */}
      <rect x="40" y="8" width="160" height="48" rx="10" fill={c.bgCard}
        stroke={c.textMuted + '22'} strokeWidth="1" />
      <rect x="56" y="22" width="100" height="5" rx="2.5" fill={c.textMuted + '44'} />
      <rect x="56" y="33" width="80" height="5" rx="2.5" fill={c.textMuted + '44'} />
      <rect x="56" y="44" width="60" height="5" rx="2.5" fill={c.textMuted + '33'} />

      {/* Label */}
      <text x="120" y="76" textAnchor="middle" fontSize="8" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 0.3)}>Who wrote this?</text>

      {/* Avatar choices */}
      {avatars.map((a, i) => (
        <circle key={i} cx={a.cx} cy="100" r="16" fill={a.fill + '33'}
          stroke={a.fill} strokeWidth="1.5" css={ani(slideUp, 0.4, 0.4 + i * 0.1)} />
      ))}

      {/* Selection ring */}
      <circle cx="120" cy="100" r="20" fill="none" stroke={c.success} strokeWidth="2"
        css={css`
          opacity: 0;
          transform-origin: 120px 100px;
          animation: ${popIn} 0.4s ease-out 1s forwards;
        `} />

      {/* Result */}
      <text x="120" y="132" textAnchor="middle" fontSize="9" fontWeight="600"
        fill={c.success} fontFamily="inherit" css={ani(bounceIn, 0.4, 1.3)}>
        ✓ Correct! +2 pts
      </text>
    </svg>
  )
}

// ── Scene 5: Score ──────────────────────────────────────────────

function ScoreScene() {
  const baseY = 116
  const bars = [
    { x: 55, h: 50, score: '8', color: c.textMuted, rank: '2nd' },
    { x: 105, h: 75, score: '12', color: c.warning, rank: '1st' },
    { x: 155, h: 32, score: '5', color: c.textMuted + 'aa', rank: '3rd' },
  ]

  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* Title */}
      <text x="120" y="16" textAnchor="middle" fontSize="10" fontWeight="600"
        fill={c.text} fontFamily="inherit" css={ani(fadeIn, 0.3, 0)}>Game Over!</text>

      {/* Bars */}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={baseY - b.h} width="30" height={b.h} rx="6"
            fill={b.color + '33'} stroke={b.color} strokeWidth="1"
            css={css`
              transform-origin: ${b.x + 15}px ${baseY}px;
              animation: ${growUp} 0.5s ease-out ${0.2 + i * 0.15}s both;
            `} />
          {/* Score */}
          <text x={b.x + 15} y={baseY - b.h - 6} textAnchor="middle" fontSize="11"
            fontWeight="700" fill={b.color} fontFamily="inherit"
            css={ani(fadeIn, 0.3, 0.7 + i * 0.1)}>{b.score}</text>
          {/* Rank */}
          <text x={b.x + 15} y={baseY + 12} textAnchor="middle" fontSize="7"
            fill={c.textMuted} fontFamily="inherit"
            css={ani(fadeIn, 0.3, 0.8 + i * 0.1)}>{b.rank}</text>
        </g>
      ))}

      {/* Crown */}
      <text x="120" y={baseY - bars[1].h - 18} textAnchor="middle" fontSize="16"
        css={ani(bounceIn, 0.5, 1.1)}>👑</text>
    </svg>
  )
}

// ── Step data ───────────────────────────────────────────────────

const steps = [
  {
    title: 'Create & Join',
    desc: 'One player creates a room and shares the code or link. Friends join in — at least 3 players needed.',
    Scene: JoinScene,
  },
  {
    title: 'Pick Topics',
    desc: 'The leader picks fun prompts for the round — like "most embarrassing moment" or "the biggest lie you told."',
    Scene: TopicsScene,
  },
  {
    title: 'Write Stories',
    desc: 'Everyone writes a short story for each topic. Be creative — try to disguise your writing style!',
    Scene: WriteScene,
  },
  {
    title: 'Guess the Author',
    desc: 'Stories are read aloud one by one. After each, everyone votes on who they think wrote it.',
    Scene: VoteScene,
  },
  {
    title: 'Score & Win',
    desc: 'Correct guess: +2 pts. Nobody guesses you: +3 pts. Most points at the end wins!',
    Scene: ScoreScene,
  },
]

// ── Main component ──────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
}

export function HowToPlay({ open, onClose }: Props) {
  const [step, setStep] = useState(0)

  // Reset to first step when opening
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  if (!open) return null

  const { title, desc, Scene } = steps[step]

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={e => e.stopPropagation()}>
        {/* Step dots */}
        <div css={css`display: flex; gap: 6px;`}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              css={css`
                width: ${i === step ? '24px' : '8px'};
                height: 8px;
                border-radius: 4px;
                background: ${i === step ? c.primaryLight : c.textMuted + '33'};
                transition: all 0.3s ease;
                cursor: pointer;
              `}
            />
          ))}
        </div>

        {/* Animated scene — key forces remount to replay animations */}
        <SceneBox key={step}>
          <Scene />
        </SceneBox>

        <StepTitle>{title}</StepTitle>
        <StepDesc>{desc}</StepDesc>

        {/* Navigation */}
        <NavRow>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}
              css={css`flex: 1;`}>Back</Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}
              css={css`flex: 1;`}>Next</Button>
          ) : (
            <Button onClick={onClose}
              css={css`flex: 1;`}>Got it!</Button>
          )}
        </NavRow>
      </Panel>
    </Overlay>
  )
}
