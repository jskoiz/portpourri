export const lightTheme = {
  // Backgrounds
  background: '#FDFBF8',
  backgroundSoft: '#F7F4F0',

  // Surfaces
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',

  // Borders
  border: '#E8E2DA',
  borderSoft: '#F0EBE4',
  borderFocus: '#C4A882',

  // Text
  textPrimary: '#2C2420',
  textSecondary: '#5C544C',
  textMuted: '#6B6159',
  textInverse: '#FDFBF8',

  // Primary — warm gold
  primary: '#C4A882',
  primaryPressed: '#B09672',
  primarySubtle: 'rgba(196,168,130,0.12)',

  // Accent — muted lavender
  accent: '#8B7A9C',
  accentSoft: '#D4C9DB',
  accentSubtle: 'rgba(184,169,196,0.12)',

  // Energy — soft blush
  energy: '#D4A59A',
  energySubtle: 'rgba(212,165,154,0.10)',

  // Semantic
  danger: '#C97070',
  dangerSubtle: 'rgba(201,112,112,0.08)',
  success: '#8BAA7A',
  warning: '#C4A882',

  // Button
  buttonPrimary: '#1A1A1A',

  // Fixed
  white: '#FFFFFF',
  black: '#000000',

  // Shadows
  shadowColor: '#000000',
  shadowColorDark: '#000000',
};

export type Theme = typeof lightTheme;

export const gradients = {
  appBg: ['#FDFBF8', '#F7F4F0'],
  appBgDark: ['#FDFBF8', '#F0EBE4'],
  cardChrome: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.80)'],
  spotlight: ['rgba(196,168,130,0.06)', 'rgba(184,169,196,0.04)'],
  photoOverlay: ['transparent', 'rgba(255,255,255,0.92)'],
  cardOverlay: ['transparent', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.94)'],
};

export const editorialColors = {
  background: lightTheme.background,
  surface: lightTheme.surface,
  border: lightTheme.border,
  textPrimary: lightTheme.textPrimary,
  textSecondary: lightTheme.textSecondary,
  textMuted: lightTheme.textMuted,
  textOnImage: '#3D352E',
  success: lightTheme.success,
  danger: lightTheme.danger,
  badgeBg: 'rgba(255,255,255,0.78)',
  matchBadgeBg: '#F0E8D8',
  matchBadgeText: '#6B5A40',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  rowPadding: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  sheet: 38,
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
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#C4A882',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 3,
  },
};
