import { z } from 'zod';

export const onboardingSchema = z.object({
  intent: z.enum(['dating', 'workout', 'both']),
  activities: z.array(z.string()),
  frequencyLabel: z.string(),
  intensityLevel: z.string(),
  weeklyFrequencyBand: z.string(),
  environment: z.array(z.string()),
  schedule: z.array(z.string()),
  socialComfort: z.string(),
});
