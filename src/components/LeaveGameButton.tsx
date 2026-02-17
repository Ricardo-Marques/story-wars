import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button } from './Button';
import { gameStore } from '../stores/GameStore';
import { connectionStore } from '../stores/ConnectionStore';
import { hostEndGame } from '../engine/HostEngine';
import { sendAction } from '../engine/ClientEngine';
import { clearGameState } from '../utils/storage';

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.sm};
  margin-top: auto;
  padding-top: ${theme.space.md};
`;

const ConfirmRow = styled.div`
  display: flex;
  gap: ${theme.space.sm};
  align-items: center;
`;

const ConfirmText = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
`;

export function LeaveGameButton() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { isHost, phase } = gameStore;

  // In lobby, leaving is simpler — no confirmation needed
  const isLobby = phase === 'LOBBY';

  function handleLeave() {
    if (isHost) {
      hostEndGame();
      setTimeout(() => navigate('/'), 400);
    } else {
      // Tell host we're leaving voluntarily
      sendAction({ type: 'LEAVE' });
      clearGameState();
      connectionStore.disconnect();
      gameStore.reset();
      navigate('/');
    }
  }

  if (isLobby) {
    return (
      <Wrapper>
        <Button variant="ghost" onClick={handleLeave}>
          Leave Room
        </Button>
      </Wrapper>
    );
  }

  if (confirming) {
    return (
      <Wrapper>
        <ConfirmText>
          {isHost ? 'This will end the game for everyone.' : 'Leave the current game?'}
        </ConfirmText>
        <ConfirmRow>
          <Button variant="ghost" onClick={handleLeave}>
            {isHost ? 'End Game' : 'Leave'}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </ConfirmRow>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        Leave Game
      </Button>
    </Wrapper>
  );
}
