import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, PageWrap, Subtitle } from '../components/Button';
import { PlayerList } from '../components/PlayerList';
import { gameStore } from '../stores/GameStore';
import { hostAdvanceToSetup } from '../engine/HostEngine';
import { LeaveGameButton } from '../components/LeaveGameButton';
import { useReaction } from '../utils/mobx';

const CodeBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space.md};
  background: ${theme.colors.bgCard};
  border: 2px solid ${theme.colors.secondary}33;
  padding: ${theme.space.md} ${theme.space.lg};
  border-radius: ${theme.radii.md};
`;

const Code = styled.span`
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 4px;
  color: ${theme.colors.secondary};
`;

const ShareRow = styled.div`
  display: flex;
  gap: ${theme.space.sm};
  flex-wrap: wrap;
  justify-content: center;
`;

const CopyBtn = styled.button`
  padding: ${theme.space.sm} ${theme.space.lg};
  border-radius: ${theme.radii.md};
  color: ${theme.colors.bg};
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${theme.colors.secondary};
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
`;

const NativeShareBtn = styled.button`
  padding: ${theme.space.sm} ${theme.space.lg};
  border-radius: ${theme.radii.md};
  color: ${theme.colors.text};
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${theme.colors.primaryLight};
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
`;

const PlayerCount = styled.p`
  color: ${theme.colors.warning};
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
`;

const Info = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`;

const CopiedBanner = styled.div`
  background: ${theme.colors.success}22;
  border: 1px solid ${theme.colors.success}44;
  border-radius: ${theme.radii.md};
  padding: ${theme.space.sm} ${theme.space.md};
  color: ${theme.colors.success};
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
`;

function getJoinUrl(roomCode: string, hostName?: string) {
  const base = `${window.location.origin}${window.location.pathname}#/join/${roomCode}`;
  if (hostName) return `${base}?host=${encodeURIComponent(hostName)}`;
  return base;
}

export const LobbyPage = observer(function LobbyPage() {
  const navigate = useNavigate();
  const { roomCode, players, isLeader, isHost } = gameStore;
  const leaderName = players.find((p) => p.isLeader)?.name;
  const [copied, setCopied] = useState(false);

  useReaction(
    () => gameStore.phase,
    (p) => { if (p === 'SETUP') navigate('/setup'); },
  );

  // Auto-copy link when lobby first loads (host created the room)
  useEffect(() => {
    if (isHost && roomCode) {
      navigator.clipboard
        .writeText(getJoinUrl(roomCode, leaderName))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch(() => {});
    }
  }, [isHost, roomCode]);

  function copyLink() {
    navigator.clipboard
      .writeText(getJoinUrl(roomCode, leaderName))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: 'Join my Story Wars game!',
        text: `Join my Story Wars room: ${roomCode}`,
        url: getJoinUrl(roomCode, leaderName),
      });
    } catch {
      // User cancelled or share failed — fall back to copy
      copyLink();
    }
  }

  function handleStart() {
    if (!isHost) return;
    hostAdvanceToSetup();
  }

  return (
    <PageWrap>
      <Subtitle>Waiting for players...</Subtitle>

      <CodeBox>
        <Code>{roomCode}</Code>
      </CodeBox>

      {copied && <CopiedBanner>Invite link copied to clipboard!</CopiedBanner>}

      <ShareRow>
        <CopyBtn onClick={copyLink}>
          {copied ? '✓ Copied!' : 'Copy Link'}
        </CopyBtn>
        {typeof navigator.share === 'function' && (
          <NativeShareBtn onClick={nativeShare}>
            Share Link
          </NativeShareBtn>
        )}
      </ShareRow>

      <PlayerCount>{players.length} player{players.length !== 1 ? 's' : ''} in room</PlayerCount>

      <PlayerList players={players} />

      {isLeader && (
        <Button
          onClick={handleStart}
          disabled={players.length < 3}
        >
          {players.length < 3 ? 'Need at least 3 players' : 'Next: Pick Topics'}
        </Button>
      )}

      {!isLeader && <Info>Waiting for the leader to start...</Info>}

      <LeaveGameButton />
    </PageWrap>
  );
});
