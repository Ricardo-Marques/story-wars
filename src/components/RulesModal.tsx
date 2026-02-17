import styled from '@emotion/styled'
import { theme } from '../styles/theme'
import { Button } from './Button'

const RulesOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.space.lg};
`

const RulesPanel = styled.div`
  background: ${theme.colors.bgLight};
  border-radius: ${theme.radii.md};
  padding: ${theme.space.lg};
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${theme.space.md};
`

const RulesTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
`

const RulesSection = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  line-height: 1.5;

  strong {
    color: ${theme.colors.text};
    display: block;
    margin-bottom: ${theme.space.xs};
  }

  ol,
  ul {
    margin: 0;
    padding-left: 1.2em;
  }

  li {
    margin-bottom: ${theme.space.xs};
  }
`

interface RulesModalProps {
  open: boolean
  onClose: () => void
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  if (!open) return null

  return (
    <RulesOverlay onClick={onClose}>
      <RulesPanel onClick={(e) => e.stopPropagation()}>
        <RulesTitle>How to Play</RulesTitle>

        <RulesSection>
          <strong>1. Create or Join</strong>
          One player creates a room and shares the invite link. Others join
          using the link or room code. You need at least 3 players.
        </RulesSection>

        <RulesSection>
          <strong>2. Pick Topics</strong>
          The leader selects topics for the round (e.g. "Your most
          embarrassing moment") and chooses how many stories will be played
          for each topic.
        </RulesSection>

        <RulesSection>
          <strong>3. Write Stories</strong>
          Everyone writes a short story for each topic. Be creative — the
          goal is to make your writing style hard to identify!
        </RulesSection>

        <RulesSection>
          <strong>4. Guess the Author</strong>
          Stories are read aloud one at a time. After each story, everyone
          votes on who they think wrote it.
        </RulesSection>

        <RulesSection>
          <strong>Scoring</strong>
          <ul>
            <li>
              Someone correctly guesses the author:{' '}
              <strong>+2 points</strong>
            </li>
            <li>
              You are the author and nobody guesses you:{' '}
              <strong>+3 points</strong>
            </li>
          </ul>
        </RulesSection>

        <Button onClick={onClose}>Got it!</Button>
      </RulesPanel>
    </RulesOverlay>
  )
}
