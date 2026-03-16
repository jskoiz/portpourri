/**
 * Liquid Glass material definitions.
 *
 * Tiered presets mirror Apple's Liquid Glass hierarchy:
 *   controls → bars → sheets
 *
 * Each tier specifies a background tint, blur intensity, and border color.
 * The GlassView primitive consumes these values to render the material.
 */

export type GlassTier = 'thin' | 'light' | 'medium' | 'thick' | 'frosted';
export type GlassTintKey = 'tintedPrimary' | 'tintedAccent';

export interface GlassMaterial {
  background: string;
  blur: number;
  border: string;
}

export const glass: Record<GlassTier | GlassTintKey, GlassMaterial> = {
  // Standard tiers — white-based glass
  thin:    { background: 'rgba(255,255,255,0.12)', blur: 8,  border: 'rgba(255,255,255,0.15)' },
  light:   { background: 'rgba(255,255,255,0.20)', blur: 20, border: 'rgba(255,255,255,0.18)' },
  medium:  { background: 'rgba(255,255,255,0.35)', blur: 24, border: 'rgba(255,255,255,0.22)' },
  thick:   { background: 'rgba(255,255,255,0.55)', blur: 32, border: 'rgba(255,255,255,0.25)' },
  frosted: { background: 'rgba(255,255,255,0.72)', blur: 40, border: 'rgba(255,255,255,0.30)' },

  // Warm tint variants matching BRDG palette
  tintedPrimary: { background: 'rgba(196,168,130,0.10)', blur: 20, border: 'rgba(196,168,130,0.15)' },
  tintedAccent:  { background: 'rgba(184,169,196,0.10)', blur: 20, border: 'rgba(184,169,196,0.15)' },
};

/** Shadows tuned for glass elements — softer and more diffused than standard card shadows. */
export const glassShadows = {
  standard: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

/** Solid fallback backgrounds used when Reduce Transparency is enabled. */
export const glassFallbacks: Record<GlassTier, string> = {
  thin:    '#F7F4F0',
  light:   '#F5F2EE',
  medium:  '#F0EDE8',
  thick:   '#EBE7E2',
  frosted: '#E8E4DF',
};
