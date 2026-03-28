import { z } from 'zod';

export const createEventSchema = z.object({
  selectedActivity: z.string().trim().min(1, 'Pick an activity'),
  startsAt: z.date({ required_error: 'Pick a date and time' }),
  where: z.string().trim().min(1, 'Add a location'),
  title: z.string().trim().min(1, 'Add a title'),
  note: z.string().max(280, 'Keep the note under 280 characters.'),
  spots: z.number().min(1).max(10),
  inviteMatchIds: z.array(z.string()),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
