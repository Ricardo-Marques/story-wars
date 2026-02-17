export const theme = {
  colors: {
    primary: '#6c5ce7',
    primaryLight: '#a29bfe',
    secondary: '#00cec9',
    accent: '#fd79a8',
    bg: '#1a1a2e',
    bgLight: '#16213e',
    bgCard: '#0f3460',
    text: '#ffffff',
    textMuted: '#b2bec3',
    success: '#00b894',
    warning: '#fdcb6e',
    error: '#d63031',
  },
  fonts: {
    body: "'Segoe UI', system-ui, -apple-system, sans-serif",
    heading: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '20px',
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
