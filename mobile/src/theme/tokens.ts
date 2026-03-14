export const darkTheme = {
  // Backgrounds
  background: '#0D1117',
  backgroundSoft: '#161B22',

  // Surfaces
  surface: '#1C2330',
  surfaceElevated: '#242D3D',
  surfaceGlass: 'rgba(28,35,48,0.92)',

  // Borders
  border: '#2D3748',
  borderSoft: '#374151',
  borderFocus: '#7C6AF7',

  // Text
  textPrimary: '#F0F6FF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0D1117',

  // Primary — electric violet
  primary: '#7C6AF7',
  primaryPressed: '#6B5CE7',
  primarySubtle: 'rgba(124,106,247,0.15)',

  // Accent — electric mint/green
  accent: '#34D399',
  accentSoft: '#6EE7B7',
  accentSubtle: 'rgba(52,211,153,0.15)',

  // Energy — amber warmth
  energy: '#F59E0B',
  energySubtle: 'rgba(245,158,11,0.15)',

  // Semantic
  danger: '#F87171',
  dangerSubtle: 'rgba(248,113,113,0.12)',
  success: '#34D399',
  warning: '#F59E0B',

  // Fixed
  white: '#FFFFFF',
  black: '#000000',

  // Shadows
  shadowColor: '#000000',
  shadowColorDark: '#000000',
};

export type Theme = typeof darkTheme;

// Legacy flat colors export (dark values for backward compat)
export const colors = darkTheme;

export const gradients = {
  appBg: ['#0D1117', '#161B22'],
  appBgDark: ['#0D1117', '#1C2330'],
  cardChrome: ['rgba(28,35,48,0.9)', 'rgba(36,45,61,0.6)'],
  spotlight: ['rgba(124,106,247,0.18)', 'rgba(52,211,153,0.08)'],
  photoOverlay: ['transparent', 'rgba(0,0,0,0.82)'],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.80)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
};

export const typography = {
  display: 42,
  h1: 30,
  h2: 24,
  h3: 20,
  body: 16,
  bodySmall: 14,
  caption: 12,
};

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glow: {
    shadowColor: '#7C6AF7',
    shadowOpacity: 0.40,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.50,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};
