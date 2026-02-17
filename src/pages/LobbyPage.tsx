import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, PageWrap, Subtitle } from '../components/Button';
import { PlayerList } from '../components/PlayerList';
import { gameStore } from '../stores/GameStore';
import { hostAdvanceToSetup } from '../engine/HostEngine';

const CodeBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space.md};
  background: ${theme.colors.bgCard};
  padding: ${theme.space.md} ${theme.space.lg};
  border-radius: ${theme.radii.sm};
`;

const Code = styled.span`
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 4px;
  color: ${theme.colors.primaryLight};
`;

const ShareRow = styled.div`
  display: flex;
  gap: ${theme.space.sm};
  flex-wrap: wrap;
  justify-content: center;
`;

const ShareBtn = styled.button`
  padding: ${theme.space.sm} ${theme.space.lg};
  border-radius: ${theme.radii.sm};
  color: ${theme.colors.text};
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${theme.colors.primary};
  &:hover {
    opacity: 0.85;
  }
`;

const Info = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`;

const CopiedFeedback = styled.span`
  color: ${theme.colors.success};
`;

const CopiedBanner = styled.div`
  background: ${theme.colors.success}22;
  border: 1px solid ${theme.colors.success};
  border-radius: ${theme.radii.sm};
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
  const { phase, roomCode, players, isLeader, isHost } = gameStore;
  const leaderName = players.find((p) => p.isLeader)?.name;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (phase === 'SETUP') navigate('/setup');
  }, [phase, navigate]);

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
        <ShareBtn onClick={copyLink}>
          {copied ? <CopiedFeedback>Copied!</CopiedFeedback> : 'Copy Link'}
        </ShareBtn>
        <ShareBtn onClick={nativeShare}>
          Share Link
        </ShareBtn>
      </ShareRow>

      <Info>{players.length} player{players.length !== 1 ? 's' : ''} in room</Info>

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
    </PageWrap>
  );
});
