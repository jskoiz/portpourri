const UI_TO_API_INTENSITY: Record<string, string> = {
  low: "BEGINNER",
  moderate: "INTERMEDIATE",
  high: "ADVANCED",
};

const API_TO_UI_INTENSITY: Record<string, string> = {
  BEGINNER: "low",
  INTERMEDIATE: "moderate",
  ADVANCED: "high",
};

export function normalizeIntensityLevelForApi(intensityLevel: string) {
  const normalized = intensityLevel.trim();
  if (!normalized) return normalized;

  return UI_TO_API_INTENSITY[normalized.toLowerCase()] ?? normalized.toUpperCase();
}

export function normalizeIntensityLevelForForm(
  intensityLevel?: string | null,
) {
  const normalized = intensityLevel?.trim();
  if (!normalized) return "";

  return API_TO_UI_INTENSITY[normalized.toUpperCase()] ?? normalized.toLowerCase();
}
