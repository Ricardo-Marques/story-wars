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

// SVG rounded rect helper — matches theme.radii.md (14px → ~8 at SVG scale)
const R = 8
const RS = 6 // smaller radius for inner elements

// ── Scene 1: Join ───────────────────────────────────────────────
// Shows: name input, avatar circle, "Create Room" button, room code badge

function JoinScene() {
  return (
    <svg viewBox="0 0 240 150" css={svgCss}>
      {/* Name input field */}
      <rect x="30" y="10" width="180" height="24" rx={RS} fill={c.bgLight}
        stroke={c.textMuted + '22'} strokeWidth="1" css={ani(slideUp, 0.4, 0)} />
      <text x="42" y="26" fontSize="8" fill={c.textMuted + '88'} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.1)}>Your name</text>
      <text x="42" y="26" fontSize="8" fill={c.text} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.3)}>Alice</text>

      {/* Avatar circle (lorelei-style placeholder) */}
      <circle cx="120" cy="54" r="16" fill={c.bgLight}
        stroke={c.primaryLight + '44'} strokeWidth="1.5" css={ani(popIn, 0.4, 0.2)} />
      <text x="120" y="58" textAnchor="middle" fontSize="14" css={ani(fadeIn, 0.3, 0.4)}>😊</text>

      {/* "Create Room" button */}
      <rect x="55" y="78" width="130" height="24" rx={RS} fill={c.primary}
        css={ani(slideUp, 0.4, 0.4)} />
      <text x="120" y="94" textAnchor="middle" fontSize="8" fontWeight="600"
        fill={c.text} fontFamily="inherit" css={ani(fadeIn, 0.3, 0.5)}>Create Room</text>

      {/* Arrow down to room code */}
      <line x1="120" y1="106" x2="120" y2="114" stroke={c.textMuted + '44'}
        strokeWidth="1" css={ani(fadeIn, 0.3, 0.7)} />

      {/* Room code badge */}
      <rect x="65" y="116" width="110" height="28" rx={R} fill={c.bgCard}
        stroke={c.primaryLight + '44'} strokeWidth="1" css={ani(fadeIn, 0.4, 0.6)} />
      <text x="120" y="128" textAnchor="middle" fontSize="6" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 0.8)}>ROOM CODE</text>
      <text x="120" y="139" textAnchor="middle" fontSize="13" fontWeight="800"
        letterSpacing="3" fill={c.primaryLight} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.9)}>XK4W</text>
    </svg>
  )
}

// ── Scene 2: Topics ─────────────────────────────────────────────
// Shows: 2×2 grid of topic buttons with emoji + label, matching TopicSelector

function TopicsScene() {
  const topics = [
    { x: 16, y: 14, emoji: '😱', label: 'Embarrassing' },
    { x: 126, y: 14, emoji: '🤥', label: 'Biggest lie' },
    { x: 16, y: 64, emoji: '🌙', label: 'Weird dream' },
    { x: 126, y: 64, emoji: '😂', label: 'Funniest' },
  ]
  const selected = [0, 3]

  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* Subtitle */}
      <text x="120" y="10" textAnchor="middle" fontSize="7" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 0)}>Pick topics for this round</text>

      {topics.map((t, i) => {
        const isSel = selected.includes(i)
        const d = 0.1 + i * 0.12
        return (
          <g key={i} css={ani(slideUp, 0.4, d)}>
            {/* Button background — matches TopicBtn */}
            <rect x={t.x} y={t.y} width="98" height="38" rx={R}
              fill={isSel ? c.primary : c.bgCard}
              stroke={isSel ? c.primaryLight + '44' : c.textMuted + '11'} strokeWidth="1" />
            {/* Emoji */}
            <text x={t.x + 14} y={t.y + 25} fontSize="14">{t.emoji}</text>
            {/* Label */}
            <text x={t.x + 32} y={t.y + 24} fontSize="7.5"
              fill={c.text} fontFamily="inherit">{t.label}</text>
            {/* Checkmark for selected */}
            {isSel && (
              <g css={css`
                opacity: 0;
                transform-box: fill-box;
                transform-origin: center;
                animation: ${popIn} 0.3s ease-out ${d + 0.5}s forwards;
              `}>
                <text x={t.x + 85} y={t.y + 14} fontSize="10" fill={c.success}>✓</text>
              </g>
            )}
          </g>
        )
      })}

      {/* "Start Writing!" button */}
      <rect x="55" y="112" width="130" height="22" rx={RS} fill={c.primary}
        css={ani(slideUp, 0.4, 0.8)} />
      <text x="120" y="127" textAnchor="middle" fontSize="7.5" fontWeight="600"
        fill={c.text} fontFamily="inherit" css={ani(fadeIn, 0.3, 0.9)}>Start Writing!</text>
    </svg>
  )
}

// ── Scene 3: Write ──────────────────────────────────────────────
// Shows: topic header (emoji + text), text area with story lines, cursor, submit button

function WriteScene() {
  const lines = [
    { y: 52, w: 140 },
    { y: 64, w: 155 },
    { y: 76, w: 120 },
    { y: 88, w: 85 },
  ]
  return (
    <svg viewBox="0 0 240 150" css={svgCss}>
      {/* Topic header */}
      <text x="120" y="12" textAnchor="middle" fontSize="14"
        css={ani(fadeIn, 0.3, 0)}>😱</text>
      <text x="120" y="24" textAnchor="middle" fontSize="8" fontWeight="600"
        fill={c.text} fontFamily="inherit"
        css={ani(fadeIn, 0.3, 0.1)}>Most embarrassing moment</text>

      {/* Text area — matches TextArea component */}
      <rect x="25" y="34" width="190" height="72" rx={R} fill={c.bgLight}
        stroke={c.textMuted + '22'} strokeWidth="1" css={ani(fadeIn, 0.3, 0.2)} />

      {/* Story text lines (appearing one by one) */}
      {lines.map((l, i) => (
        <rect key={i} x="38" y={l.y} width={l.w} height="5" rx="2.5"
          fill={c.text + '66'} css={ani(fadeIn, 0.3, 0.4 + i * 0.25)} />
      ))}

      {/* Blinking cursor */}
      <rect x={38 + lines[3].w + 3} y={lines[3].y - 2} width="2" height="9" rx="1"
        fill={c.primaryLight} css={css`
          opacity: 0;
          animation: ${fadeIn} 0.2s ease-out ${0.4 + lines.length * 0.25}s forwards,
                     ${blink} 0.8s step-end ${0.6 + lines.length * 0.25}s infinite;
        `} />

      {/* Submit button */}
      <rect x="55" y="118" width="130" height="22" rx={RS} fill={c.primary}
        css={ani(slideUp, 0.4, 1.4)} />
      <text x="120" y="133" textAnchor="middle" fontSize="7.5" fontWeight="600"
        fill={c.text} fontFamily="inherit" css={ani(fadeIn, 0.3, 1.5)}>Submit & Done</text>
    </svg>
  )
}

// ── Scene 4: Vote ───────────────────────────────────────────────
// Shows: story card, "Who wrote this?" label, vote buttons with avatar+name, "Lock In" button

function VoteScene() {
  const players = [
    { name: 'Alice', color: c.primaryLight },
    { name: 'Bob', color: c.secondary },
    { name: 'Charlie', color: c.warning },
  ]

  return (
    <svg viewBox="0 0 240 155" css={svgCss}>
      {/* Story card — matches StoryCard */}
      <rect x="25" y="4" width="190" height="38" rx={R} fill={c.bgCard}
        stroke={c.textMuted + '11'} strokeWidth="1" />
      <text x="37" y="16" fontSize="6" fill={c.textMuted} fontFamily="inherit">
        😱 Most embarrassing moment
      </text>
      <rect x="37" y="22" width="120" height="4" rx="2" fill={c.text + '44'} />
      <rect x="37" y="30" width="90" height="4" rx="2" fill={c.text + '33'} />

      {/* "Who wrote this?" label */}
      <text x="120" y="56" textAnchor="middle" fontSize="8" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 0.3)}>Who wrote this?</text>

      {/* Vote buttons — rows matching VotePanel */}
      {players.map((p, i) => {
        const y = 66 + i * 28
        const isSelected = i === 1 // Bob is selected
        const d = 0.4 + i * 0.12
        return (
          <g key={i} css={ani(slideUp, 0.4, d)}>
            {/* Vote button row */}
            <rect x="25" y={y} width="155" height="22" rx={RS}
              fill={isSelected ? c.primary : c.bgCard}
              stroke={isSelected ? c.primaryLight + '44' : c.textMuted + '11'}
              strokeWidth="1" />
            {/* Avatar circle */}
            <circle cx={40} cy={y + 11} r="7" fill={p.color + '33'}
              stroke={p.color} strokeWidth="1" />
            {/* Player name */}
            <text x="52" y={y + 14} fontSize="7.5" fill={c.text}
              fontFamily="inherit">{p.name}</text>

            {/* "Lock In" button for selected */}
            {isSelected && (
              <g css={css`
                opacity: 0;
                transform-box: fill-box;
                transform-origin: center;
                animation: ${popIn} 0.3s ease-out ${d + 0.4}s forwards;
              `}>
                <rect x="185" y={y + 1} width="40" height="20" rx="5" fill={c.success} />
                <text x="205" y={y + 14} textAnchor="middle" fontSize="6" fontWeight="600"
                  fill={c.bg} fontFamily="inherit">Lock In</text>
              </g>
            )}
          </g>
        )
      })}

      {/* Result - "Vote locked in!" */}
      <text x="120" y="148" textAnchor="middle" fontSize="7" fontWeight="600"
        fill={c.success} fontFamily="inherit" css={ani(bounceIn, 0.4, 1.2)}>
        ✓ Vote locked in!
      </text>
    </svg>
  )
}

// ── Scene 5: Score ──────────────────────────────────────────────
// Shows: scoreboard rows with rank, avatar, name, score — matches Scoreboard component

function ScoreScene() {
  const players = [
    { rank: 1, name: 'Bob', score: 12, color: c.warning },
    { rank: 2, name: 'Alice', score: 8, color: c.textMuted },
    { rank: 3, name: 'Charlie', score: 5, color: '#cd7f32' },
  ]

  return (
    <svg viewBox="0 0 240 140" css={svgCss}>
      {/* "Game Over!" title */}
      <text x="120" y="14" textAnchor="middle" fontSize="10" fontWeight="700"
        fill={c.text} fontFamily="inherit" css={ani(fadeIn, 0.3, 0)}>Game Over!</text>

      {/* Crown */}
      <text x="120" y="30" textAnchor="middle" fontSize="14"
        css={ani(bounceIn, 0.5, 0.8)}>👑</text>

      {/* Scoreboard rows — matching Scoreboard component */}
      {players.map((p, i) => {
        const y = 40 + i * 32
        const d = 0.2 + i * 0.15
        return (
          <g key={i} css={ani(slideUp, 0.4, d)}>
            {/* Row background */}
            <rect x="20" y={y} width="200" height="26" rx={RS} fill={c.bgCard}
              stroke={c.textMuted + '11'} strokeWidth="1" />
            {/* Left border accent (rank color) */}
            <rect x="20" y={y + 3} width="3" height="20" rx="1.5" fill={p.color} />
            {/* Rank number */}
            <text x="36" y={y + 17} textAnchor="middle" fontSize="10" fontWeight="800"
              fill={c.text} fontFamily="inherit">{p.rank}</text>
            {/* Avatar circle */}
            <circle cx="52" cy={y + 13} r="8" fill={c.bgLight}
              stroke={c.textMuted + '22'} strokeWidth="0.5" />
            <text x="52" y={y + 16} textAnchor="middle" fontSize="8">
              {i === 0 ? '😎' : i === 1 ? '😊' : '🙃'}
            </text>
            {/* Player name */}
            <text x="66" y={y + 17} fontSize="8" fontWeight="600"
              fill={c.text} fontFamily="inherit">{p.name}</text>
            {/* Score */}
            <text x="200" y={y + 17} textAnchor="end" fontSize="9" fontWeight="800"
              fill={c.warning} fontFamily="inherit"
              css={ani(fadeIn, 0.3, d + 0.4)}>{p.score} pts</text>
          </g>
        )
      })}

      {/* Scoring info */}
      <text x="120" y="138" textAnchor="middle" fontSize="6.5" fill={c.textMuted}
        fontFamily="inherit" css={ani(fadeIn, 0.3, 1)}>
        Correct guess: +2 pts · Nobody guesses you: +3 pts
      </text>
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
