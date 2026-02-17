import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import type { ReactNode } from 'react';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: ${theme.space.md};
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${theme.space.lg};
  letter-spacing: -0.5px;
`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <Title>Story Wars</Title>
      {children}
    </Shell>
  );
}
