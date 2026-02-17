import styled from '@emotion/styled';
import { theme } from '../styles/theme';
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
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.md};
  background: ${(p) => (p.voted ? theme.colors.primary : theme.colors.bgCard)};
  border: 1px solid ${(p) => (p.voted ? `${theme.colors.primaryLight}44` : `${theme.colors.textMuted}11`)};
  color: ${theme.colors.text};
  font-size: 0.95rem;
  transition: all 0.2s ease;
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  pointer-events: ${(p) => (p.disabled ? 'none' : 'auto')};
  &:hover {
    background: ${(p) => (p.voted ? theme.colors.primary : theme.colors.bgLight)};
    transform: translateY(-1px);
  }
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${theme.radii.full};
`;

const VoteRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
`;

const LockBtn = styled.button`
  padding: ${theme.space.xs} ${theme.space.md};
  border-radius: ${theme.radii.md};
  background: ${theme.colors.success};
  color: ${theme.colors.bg};
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.2px;
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
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
        <VoteRow key={p.id}>
          <VoteBtn
            voted={myVoteTargetId === p.id}
            disabled={finalized}
            onClick={() => onVote(p.id)}
          >
            <Avatar src={getAvatarDataUri(p.avatarSeed)} alt={p.name} />
            {p.name}
          </VoteBtn>
          {myVoteTargetId === p.id && !finalized && (
            <LockBtn onClick={onFinalize}>Lock In</LockBtn>
          )}
        </VoteRow>
      ))}
      {finalized && (
        <FinalizedLabel>Vote locked in! Waiting for others...</FinalizedLabel>
      )}
    </Panel>
  );
}
