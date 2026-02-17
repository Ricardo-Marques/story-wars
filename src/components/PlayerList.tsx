import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { getAvatarDataUri } from '../utils/avatar';
import type { Player } from '../types/game';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
`;

const PlayerRow = styled.div<{ dimmed?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
  border-radius: ${theme.radii.md};
  opacity: ${(p) => (p.dimmed ? 0.5 : 1)};
  transition: opacity 0.2s ease;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.bgLight};
`;

const Name = styled.span`
  flex: 1;
  font-weight: 600;
`;

const Badge = styled.span`
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.text};
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const Score = styled.span`
  font-weight: 700;
  color: ${theme.colors.warning};
  min-width: 28px;
  text-align: right;
`;

interface Props {
  players: Player[];
  showScores?: boolean;
}

export function PlayerList({ players, showScores }: Props) {
  return (
    <List>
      {players.map((p) => (
        <PlayerRow key={p.id} dimmed={!p.connected}>
          <Avatar src={getAvatarDataUri(p.avatarSeed)} alt={p.name} />
          <Name>{p.name}</Name>
          {p.isLeader && <Badge>Leader</Badge>}
          {showScores && <Score>{p.score}</Score>}
        </PlayerRow>
      ))}
    </List>
  );
}
