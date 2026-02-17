import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../styles/theme';
import { TOPICS } from '../data/topics';

const Card = styled.div`
  background: ${theme.colors.bgCard};
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

const CHARS_PER_SECOND = 30;

interface Props {
  topicId: string;
  text: string;
  typewriter?: boolean;
  /** Called by parent to push visible chars forward (e.g. from TTS boundary events) */
  revealUpTo?: number;
  onTypewriterDone?: () => void;
}

export function StoryCard({ topicId, text, typewriter, revealUpTo, onTypewriterDone }: Props) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const [visibleChars, setVisibleChars] = useState(typewriter ? 0 : text.length);
  const [done, setDone] = useState(!typewriter);
  const fallbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDoneRef = useRef(onTypewriterDone);
  onDoneRef.current = onTypewriterDone;
  // Track whether parent is driving reveal via revealUpTo
  const parentDriving = useRef(false);

  // When parent pushes revealUpTo, advance visible chars
  useEffect(() => {
    if (revealUpTo != null && revealUpTo > 0 && typewriter && !done) {
      parentDriving.current = true;
      setVisibleChars((prev) => Math.max(prev, revealUpTo));
      // Kill fallback since parent is driving
      if (fallbackTimer.current) {
        clearInterval(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    }
  }, [revealUpTo, typewriter, done]);

  // Main typewriter effect — only handles fallback timer (TTS-driven reveal comes from parent)
  useEffect(() => {
    if (!typewriter) {
      setVisibleChars(text.length);
      setDone(true);
      return;
    }

    setVisibleChars(0);
    setDone(false);
    parentDriving.current = false;

    // Fallback: character-by-character timer for when TTS doesn't fire boundary events
    const delay = 500; // give TTS a moment to start firing boundaries via parent
    const delayId = setTimeout(() => {
      if (parentDriving.current) return; // parent is driving, don't interfere
      fallbackTimer.current = setInterval(() => {
        if (parentDriving.current) {
          if (fallbackTimer.current) {
            clearInterval(fallbackTimer.current);
            fallbackTimer.current = null;
          }
          return;
        }
        setVisibleChars((prev) => {
          const next = prev + 1;
          if (next >= text.length) {
            if (fallbackTimer.current) {
              clearInterval(fallbackTimer.current);
              fallbackTimer.current = null;
            }
            setDone(true);
            onDoneRef.current?.();
            return text.length;
          }
          return next;
        });
      }, 1000 / CHARS_PER_SECOND);
    }, delay);

    return () => {
      clearTimeout(delayId);
      if (fallbackTimer.current) {
        clearInterval(fallbackTimer.current);
        fallbackTimer.current = null;
      }
    };
  }, [text, typewriter]);

  // Detect when revealUpTo reaches end of text (TTS finished)
  useEffect(() => {
    if (typewriter && !done && visibleChars >= text.length) {
      setDone(true);
      onDoneRef.current?.();
    }
  }, [visibleChars, text.length, typewriter, done]);

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
