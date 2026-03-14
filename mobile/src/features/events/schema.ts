import { z } from 'zod';

export const createEventSchema = z.object({
  selectedActivity: z.string().trim().min(1, 'Pick an activity'),
  selectedWhen: z.string().trim().min(1, 'Choose a day'),
  selectedTime: z.string().trim().min(1, 'Choose a time window'),
  where: z.string().trim().min(1, 'Add a location'),
  skillLevel: z.string(),
  spots: z.number().min(1).max(10),
  note: z.string().max(280, 'Keep the note under 280 characters.'),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
