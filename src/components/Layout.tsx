import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Logo } from './Logo';
import type { ReactNode } from 'react';



const Shell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: ${theme.space.md};
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
`;

const LogoWrap = styled.div`
  margin-bottom: ${theme.space.lg};
`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <LogoWrap>
        <Logo variant="default" />
      </LogoWrap>
      {children}
    </Shell>
  );
}
