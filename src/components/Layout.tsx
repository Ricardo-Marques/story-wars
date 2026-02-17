import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Logo } from './Logo';
import type { ReactNode } from 'react';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: ${theme.space.lg} ${theme.space.md} ${theme.space.md};
  width: 100%;
  max-width: 480px;
  margin: 0 auto;

  /* On taller viewports, push content down a bit so it's not glued to the top */
  @media (min-height: 700px) {
    padding-top: ${theme.space.xl};
  }
  @media (min-height: 900px) {
    padding-top: ${theme.space.xxl};
  }
`;

const LogoWrap = styled.div`
  margin-bottom: ${theme.space.xs};
`;

const Tagline = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.75rem;
  letter-spacing: 1.5px;
  font-weight: 300;
  margin-bottom: ${theme.space.lg};
`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <LogoWrap>
        <Logo />
      </LogoWrap>
      <Tagline>Write stories. Guess authors. Win glory.</Tagline>
      {children}
    </Shell>
  );
}
