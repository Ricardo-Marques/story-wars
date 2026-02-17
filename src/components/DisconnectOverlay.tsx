import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button } from './Button';
import { gameStore } from '../stores/GameStore';
import { connectionStore } from '../stores/ConnectionStore';
import { hostAction, hostEndGame } from '../engine/HostEngine';
import { sendAction } from '../engine/ClientEngine';
import { clearGameState } from '../utils/storage';
import { getAvatarDataUri } from '../utils/avatar';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.space.lg};
`;

const Panel = styled.div`
  background: ${theme.colors.bgLight};
  border: 1px solid ${theme.colors.textMuted}22;
  border-radius: ${theme.radii.lg};
  padding: ${theme.space.lg};
  max-width: 380px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.md};
`;

const Title = styled.h2`
  font-size: 1.1rem;
  color: ${theme.colors.warning};
  font-weight: 700;
  text-align: center;
  margin: 0;
`;

const StatusText = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  text-align: center;
  margin: 0;
`;

const PlayerRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  width: 100%;
  padding: ${theme.space.sm} ${theme.space.md};
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
  border-radius: ${theme.radii.md};
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${theme.radii.full};
  opacity: 0.5;
`;

const PlayerName = styled.span`
  flex: 1;
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
`;

const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${theme.colors.error};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
`;

export const DisconnectOverlay = observer(function DisconnectOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { players, roomCode, isHost, isLeader, phase } = gameStore;
  const isClient = !isHost;
  const excluded = gameStore.state.excludedPlayers || [];

  // For clients: host connection lost
  const hostLost =
    isClient &&
    roomCode &&
    (connectionStore.status === 'reconnecting' || connectionStore.status === 'disconnected') &&
    phase !== 'LOBBY';

  // For everyone: disconnected players that haven't been excluded
  const disconnectedPlayers = players.filter(
    (p) => !p.connected && !excluded.includes(p.id),
  );

  // Don't show on entry points (user may be joining a new game)
  const isEntryPoint =
    location.pathname === '/' || location.pathname.startsWith('/join/');
  if (isEntryPoint) return null;

  // Don't show during lobby or when no active game
  if (!roomCode || phase === 'LOBBY') return null;

  // Nothing to show
  if (!hostLost && disconnectedPlayers.length === 0) return null;

  function dispatch(msg: Parameters<typeof hostAction>[0]) {
    if (isHost) hostAction(msg);
    else sendAction(msg);
  }

  function handleContinueWithout() {
    disconnectedPlayers.forEach((p) => {
      dispatch({ type: 'CONTINUE_WITHOUT', targetPlayerId: p.id });
    });
  }

  function handleLeave() {
    if (isHost) {
      // Notify all clients that the host is ending the game
      hostEndGame();
      // Navigate after a brief delay to let the broadcast send
      setTimeout(() => navigate('/'), 400);
    } else {
      clearGameState();
      connectionStore.disconnect();
      gameStore.reset();
      navigate('/');
    }
  }

  return (
    <Overlay>
      <Panel>
        {hostLost && (
          <>
            <Title>Connection Lost</Title>
            <StatusText>
              {connectionStore.status === 'reconnecting'
                ? 'Trying to reconnect...'
                : 'Disconnected from host.'}
            </StatusText>
          </>
        )}

        {!hostLost && disconnectedPlayers.length > 0 && (
          <Title>Player Disconnected</Title>
        )}

        {disconnectedPlayers.map((p) => (
          <PlayerRow key={p.id}>
            <Dot />
            <Avatar src={getAvatarDataUri(p.avatarSeed)} alt={p.name} />
            <PlayerName>{p.name}</PlayerName>
          </PlayerRow>
        ))}

        <Actions>
          {isLeader && disconnectedPlayers.length > 0 && (
            <Button onClick={handleContinueWithout}>
              Continue Without {disconnectedPlayers.length === 1
                ? disconnectedPlayers[0].name
                : 'Them'}
            </Button>
          )}

          {!isLeader && !hostLost && disconnectedPlayers.length > 0 && (
            <StatusText>Waiting for leader to decide...</StatusText>
          )}

          <Button variant="ghost" onClick={handleLeave}>
            Leave Game
          </Button>
        </Actions>
      </Panel>
    </Overlay>
  );
});
