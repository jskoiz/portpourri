export const darkTheme = {
  // Backgrounds
  background: '#F8F7F4',
  backgroundSoft: '#F1EFE9',

  // Surfaces
  surface: '#FFFFFF',
  surfaceElevated: '#F5F3EF',
  surfaceGlass: 'rgba(255,255,255,0.75)',

  // Borders
  border: 'rgba(0,0,0,0.06)',
  borderSoft: 'rgba(0,0,0,0.04)',
  borderFocus: '#7C6AF7',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Primary — electric violet
  primary: '#7C6AF7',
  primaryPressed: '#6B5CE7',
  primarySubtle: 'rgba(124,106,247,0.08)',

  // Accent — emerald green
  accent: '#10B981',
  accentSoft: '#34D399',
  accentSubtle: 'rgba(16,185,129,0.08)',

  // Energy — amber warmth
  energy: '#F59E0B',
  energySubtle: 'rgba(245,158,11,0.08)',

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
  appBg: ['#F8F7F4', '#F1EFE9'],
  appBgDark: ['#F8F7F4', '#EDE9E0'],
  cardChrome: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.7)'],
  spotlight: ['rgba(124,106,247,0.06)', 'rgba(16,185,129,0.04)'],
  photoOverlay: ['transparent', 'rgba(0,0,0,0.5)'],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)'],
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#7C6AF7',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};
