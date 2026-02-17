import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button } from './Button';
import { getAvatarDataUri } from '../utils/avatar';
import type { Player } from '../types/game';

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
`;

const Label = styled.div`
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
  text-align: center;
`;

const VoteBtn = styled.button<{ voted?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  background: ${(p) => (p.voted ? theme.colors.primary : theme.colors.bgCard)};
  color: ${theme.colors.text};
  font-size: 0.95rem;
  transition: background 0.15s;
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  pointer-events: ${(p) => (p.disabled ? 'none' : 'auto')};
  &:hover {
    background: ${(p) => (p.voted ? theme.colors.primary : theme.colors.bgLight)};
  }
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${theme.radii.full};
`;

const FinalizedLabel = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.success};
  text-align: center;
  font-weight: 600;
`;

interface Props {
  players: Player[];
  myVoteTargetId: string | null;
  finalized: boolean;
  onVote: (playerId: string) => void;
  onFinalize: () => void;
}

export function VotePanel({ players, myVoteTargetId, finalized, onVote, onFinalize }: Props) {
  return (
    <Panel>
      <Label>Who wrote this?</Label>
      {players.map((p) => (
        <VoteBtn
          key={p.id}
          voted={myVoteTargetId === p.id}
          disabled={finalized}
          onClick={() => onVote(p.id)}
        >
          <Avatar src={getAvatarDataUri(p.avatarSeed)} alt={p.name} />
          {p.name}
        </VoteBtn>
      ))}
      {myVoteTargetId && !finalized && (
        <Button onClick={onFinalize}>Lock In</Button>
      )}
      {finalized && (
        <FinalizedLabel>Vote locked in! Waiting for others...</FinalizedLabel>
      )}
    </Panel>
  );
}
