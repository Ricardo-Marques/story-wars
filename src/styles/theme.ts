export const theme = {
  colors: {
    primary: '#7C5CFF',
    primaryLight: '#9D85FF',
    secondary: '#00E5FF',
    accent: '#FF4D6D',
    bg: '#0F1221',
    bgLight: '#1A1E35',
    bgCard: '#171A2E',
    text: '#FFFFFF',
    textMuted: '#AAB0D6',
    success: '#2BFF88',
    warning: '#fdcb6e',
    error: '#FF4D6D',
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
