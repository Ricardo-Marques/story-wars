import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';

const TimerWrap = styled.div<{ urgent: boolean }>`
  font-size: 1.8rem;
  font-weight: 800;
  text-align: center;
  color: ${(p) => (p.urgent ? theme.colors.error : theme.colors.text)};
  transition: color 0.3s;
`;

interface Props {
  seconds: number;
  onExpire?: () => void;
  running: boolean;
}

export function Timer({ seconds, onExpire, running }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, seconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `0:${secs.toString().padStart(2, '0')}`;

  return <TimerWrap urgent={remaining <= 5}>{display}</TimerWrap>;
}
