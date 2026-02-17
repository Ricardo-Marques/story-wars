import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { getAvatarDataUri } from '../utils/avatar';
import type { Player } from '../types/game';

const Board = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
`;

const Row = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.md};
  padding: ${theme.space.md};
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
  border-radius: ${theme.radii.md};
  border-left: 4px solid
    ${(p) =>
      p.rank === 1
        ? theme.colors.warning
        : p.rank === 2
          ? theme.colors.textMuted
          : p.rank === 3
            ? '#cd7f32'
            : 'transparent'};
`;

const Rank = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  width: 32px;
  text-align: center;
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.bgLight};
`;

const Name = styled.span`
  flex: 1;
  font-weight: 600;
  font-size: 1.05rem;
`;

const Score = styled.span`
  font-size: 1.3rem;
  font-weight: 800;
  color: ${theme.colors.warning};
`;

interface Props {
  players: Player[];
}

export function Scoreboard({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  // Compute rank with ties (players with same score share a rank)
  const ranks: number[] = [];
  sorted.forEach((p, i) => {
    if (i === 0 || p.score < sorted[i - 1].score) {
      ranks.push(i + 1);
    } else {
      ranks.push(ranks[i - 1]);
    }
  });

  return (
    <Board>
      {sorted.map((p, i) => (
        <Row key={p.id} rank={ranks[i]}>
          <Rank>{ranks[i]}</Rank>
          <Avatar src={getAvatarDataUri(p.avatarSeed)} alt={p.name} />
          <Name>{p.name}</Name>
          <Score>{p.score} pts</Score>
        </Row>
      ))}
    </Board>
  );
}
