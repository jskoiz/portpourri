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

export const lightTheme: Theme = {
  // Backgrounds
  background: '#F8F7F4',
  backgroundSoft: '#F5F3EF',

  // Surfaces
  surface: '#FFFFFF',
  surfaceElevated: '#F5F3EF',
  surfaceGlass: 'rgba(255,255,255,0.92)',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderSoft: 'rgba(0,0,0,0.12)',
  borderFocus: '#7C6AF7',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Primary — electric violet
  primary: '#7C6AF7',
  primaryPressed: '#6B5CE7',
  primarySubtle: 'rgba(124,106,247,0.10)',

  // Accent — emerald
  accent: '#10B981',
  accentSoft: '#6EE7B7',
  accentSubtle: 'rgba(16,185,129,0.10)',

  // Energy — amber warmth
  energy: '#F59E0B',
  energySubtle: 'rgba(245,158,11,0.10)',

  // Semantic
  danger: '#EF4444',
  dangerSubtle: 'rgba(239,68,68,0.08)',
  success: '#10B981',
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
  appBg: ['#F8F7F4', '#F5F3EF'],
  appBgDark: ['#F5F3EF', '#FFFFFF'],
  cardChrome: ['rgba(255,255,255,0.95)', 'rgba(245,243,239,0.8)'],
  spotlight: ['rgba(124,106,247,0.08)', 'rgba(16,185,129,0.04)'],
  photoOverlay: ['transparent', 'rgba(0,0,0,0.52)'],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.50)'],
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
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#7C6AF7',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
};
