import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { getAvatarDataUri, randomSeed } from '../utils/avatar';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.space.md};
`;

const AvatarImg = styled.img`
  width: 64px;
  height: 64px;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.bgCard};
  border: 2px solid ${theme.colors.primary};
`;

const RandomBtn = styled.button`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  background: ${theme.colors.bgCard};
  color: ${theme.colors.text};
  font-size: 0.85rem;
  &:hover {
    background: ${theme.colors.primary};
  }
`;

interface Props {
  seed: string;
  onChange: (seed: string) => void;
}

export function AvatarPicker({ seed, onChange }: Props) {
  return (
    <Wrap>
      <AvatarImg src={getAvatarDataUri(seed || 'default')} alt="Avatar" />
      <RandomBtn onClick={() => onChange(randomSeed())}>Random</RandomBtn>
    </Wrap>
  );
}
