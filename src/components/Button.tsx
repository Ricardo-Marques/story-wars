import styled from '@emotion/styled';
import { theme } from '../styles/theme';

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  padding: ${theme.space.sm} ${theme.space.lg};
  border-radius: ${theme.radii.sm};
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.15s, opacity 0.15s;
  background: ${(p) =>
    p.variant === 'secondary'
      ? theme.colors.secondary
      : p.variant === 'ghost'
        ? 'transparent'
        : theme.colors.primary};
  color: ${theme.colors.text};
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const Input = styled.input`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  border: 2px solid ${theme.colors.bgCard};
  background: ${theme.colors.bgLight};
  color: ${theme.colors.text};
  font-size: 1rem;
  width: 100%;
  outline: none;
  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

export const TextArea = styled.textarea`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  border: 2px solid ${theme.colors.bgCard};
  background: ${theme.colors.bgLight};
  color: ${theme.colors.text};
  font-size: 1rem;
  width: 100%;
  min-height: 120px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

export const Card = styled.div`
  background: ${theme.colors.bgCard};
  border-radius: ${theme.radii.md};
  padding: ${theme.space.lg};
  width: 100%;
`;

export const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.md};
  width: 100%;
  flex: 1;
`;

export const Subtitle = styled.h2`
  font-size: 1.2rem;
  color: ${theme.colors.textMuted};
  font-weight: 400;
  text-align: center;
`;
