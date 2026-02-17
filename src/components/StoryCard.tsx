import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../styles/theme';
import { TOPICS } from '../data/topics';

const Card = styled.div`
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
  border-radius: ${theme.radii.md};
  padding: ${theme.space.lg};
  width: 100%;
`;

const TopicLabel = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
  margin-bottom: ${theme.space.sm};
`;

const StoryText = styled.p`
  font-size: 1.05rem;
  line-height: 1.6;
  white-space: pre-wrap;
  min-height: 3.2em;
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: ${theme.colors.primaryLight};
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 0.7s step-end infinite;
`;

interface Props {
  topicId: string;
  text: string;
  typewriter?: boolean;
  /** Parent drives visible character count (e.g. from TTS boundary events or fallback timer) */
  revealUpTo?: number;
  onTypewriterDone?: () => void;
}

export function StoryCard({ topicId, text, typewriter, revealUpTo = 0, onTypewriterDone }: Props) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const visibleChars = typewriter ? Math.min(revealUpTo, text.length) : text.length;
  const done = !typewriter || visibleChars >= text.length;
  const firedDone = useRef(false);
  const onDoneRef = useRef(onTypewriterDone);
  onDoneRef.current = onTypewriterDone;

  // Reset when text changes (new story)
  useEffect(() => {
    firedDone.current = false;
  }, [text]);

  // Fire done callback once when all text is revealed
  useEffect(() => {
    if (typewriter && done && !firedDone.current) {
      firedDone.current = true;
      onDoneRef.current?.();
    }
  }, [done, typewriter]);

  const displayedText = text.slice(0, visibleChars);

  return (
    <Card>
      {topic && (
        <TopicLabel>
          {topic.emoji} {topic.text}
        </TopicLabel>
      )}
      <StoryText>
        {displayedText}
        {typewriter && !done && <Cursor />}
      </StoryText>
    </Card>
  );
}
