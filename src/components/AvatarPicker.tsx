import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { getAvatarDataUri, randomSeed } from '../utils/avatar';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.space.md};
  padding: ${theme.space.sm} 0;
`;

const AvatarImg = styled.img`
  width: 96px;
  height: 96px;
  border-radius: ${theme.radii.full};
  background: ${theme.colors.bgLight};
  border: 2px solid ${theme.colors.primaryLight}44;
`;

const RandomBtn = styled.button`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.md};
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}22;
  color: ${theme.colors.text};
  font-size: 0.85rem;
  transition: all 0.2s ease;
  &:hover {
    background: ${theme.colors.primaryLight}22;
    border-color: ${theme.colors.primaryLight}44;
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
