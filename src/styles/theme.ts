export const theme = {
  colors: {
    primary: '#3e08a3',
    primaryLight: '#7B2FDB',
    secondary: '#00E5FF',
    accent: '#FF4D6D',
    bg: '#0F1221',
    bgLight: '#1A1E35',
    bgCard: '#171A2E',
    text: '#FFFFFF',
    textMuted: '#AAB0D6',
    success: '#2BFF88',
    warning: '#6BC4B0',
    error: '#FF4D6D',
  },
  fonts: {
    body: "'Segoe UI', system-ui, -apple-system, sans-serif",
    heading: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  radii: {
    sm: '10px',
    md: '14px',
    lg: '22px',
    full: '9999px',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
} as const;

export type Theme = typeof theme;
