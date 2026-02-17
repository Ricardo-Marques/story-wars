import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, PageWrap, Subtitle } from '../components/Button';
import { Scoreboard } from '../components/Scoreboard';
import { gameStore } from '../stores/GameStore';
import { connectionStore } from '../stores/ConnectionStore';
import { clearGameState } from '../utils/storage';
import { hostPlayAgain } from '../engine/HostEngine';

const Info = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
`;

export const ResultsPage = observer(function ResultsPage() {
  const navigate = useNavigate();
  const { players, isLeader, phase } = gameStore;

  // If leader starts a new game, phase changes to SETUP — PhaseRouter handles navigation
  // But non-leaders need to react too
  useEffect(() => {
    if (phase === 'SETUP') navigate('/setup');
  }, [phase, navigate]);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter((p) => p.score === topScore);

  let headline = 'Game Over!';
  if (winners.length > 1) {
    headline = `It's a tie! ${winners.map((w) => w.name).join(' & ')}`;
  } else if (winners.length === 1) {
    headline = `${winners[0].name} wins!`;
  }

  function handlePlayAgain() {
    hostPlayAgain();
  }

  function handleExit() {
    clearGameState();
    connectionStore.disconnect();
    gameStore.reset();
    navigate('/');
  }

  return (
    <PageWrap>
      <Subtitle>{headline}</Subtitle>

      <Scoreboard players={players} />

      <Actions>
        {isLeader ? (
          <Button onClick={handlePlayAgain}>Play Again</Button>
        ) : (
          <Info>Waiting for leader to start a new game...</Info>
        )}
        <Button variant="ghost" onClick={handleExit}>
          Exit Game
        </Button>
      </Actions>
    </PageWrap>
  );
});
