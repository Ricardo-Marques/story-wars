import { Global, css } from '@emotion/react';
import { theme } from './theme';

export function GlobalStyles() {
  return (
    <Global
      styles={css`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          font-size: 16px;
          -webkit-text-size-adjust: 100%;
        }

        body {
          font-family: ${theme.fonts.body};
          background: ${theme.colors.bg};
          color: ${theme.colors.text};
          min-height: 100dvh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        #root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        button {
          cursor: pointer;
          border: none;
          font-family: inherit;
        }

        input,
        textarea {
          font-family: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }
      `}
    />
  );
}
