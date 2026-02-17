import styled from '@emotion/styled';
import { theme } from '../styles/theme';

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  padding: ${theme.space.sm} ${theme.space.lg};
  border-radius: ${theme.radii.md};
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: all 0.2s ease;
  background: ${(p) =>
    p.variant === 'secondary'
      ? theme.colors.secondary
      : p.variant === 'ghost'
        ? 'transparent'
        : theme.colors.primary};
  color: ${theme.colors.text};
  border: 1px solid ${(p) =>
    p.variant === 'ghost'
      ? `${theme.colors.textMuted}33`
      : 'transparent'};
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Input = styled.input`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  border: 1px solid ${theme.colors.textMuted}22;
  background: ${theme.colors.bgLight};
  color: ${theme.colors.text};
  font-size: 1rem;
  width: 100%;
  outline: none;
  transition: border-color 0.2s ease;
  &:focus {
    border-color: ${theme.colors.primaryLight};
  }
`;

export const TextArea = styled.textarea`
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  border: 1px solid ${theme.colors.textMuted}22;
  background: ${theme.colors.bgLight};
  color: ${theme.colors.text};
  font-size: 1rem;
  width: 100%;
  min-height: 120px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s ease;
  &:focus {
    border-color: ${theme.colors.primaryLight};
  }
`;

export const Card = styled.div`
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
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
  padding-bottom: ${theme.space.xxl};
`;

export const Subtitle = styled.h2`
  font-size: 1.15rem;
  color: ${theme.colors.textMuted};
  font-weight: 300;
  text-align: center;
  letter-spacing: 0.3px;
`;
