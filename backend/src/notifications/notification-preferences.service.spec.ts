import { NotificationPreferencesService } from './notification-preferences.service';
import { PrismaService } from '../prisma/prisma.service';

function makeMockPrisma() {
  return {
    notificationPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let prisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new NotificationPreferencesService(prisma);
  });

  describe('get', () => {
    it('returns all-true defaults when no preferences row exists', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.get('user-1');

      expect(result).toEqual({
        matches: true,
        messages: true,
        likes: true,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      });
    });

    it('returns stored preferences when row exists', async () => {
      const prefs = {
        matches: false,
        messages: true,
        likes: true,
        eventReminders: false,
        eventRsvps: true,
        system: true,
      };
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(prefs);

      const result = await service.get('user-1');

      expect(result).toEqual(prefs);
    });
  });

  describe('upsert', () => {
    it('creates preferences when none exist', async () => {
      const created = {
        matches: false,
        messages: true,
        likes: true,
        eventReminders: true,
        eventRsvps: true,
        system: true,
      };
      (prisma.notificationPreferences.upsert as jest.Mock).mockResolvedValue(created);

      const result = await service.upsert('user-1', { matches: false });

      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          matches: false,
          messages: true,
          likes: true,
          eventReminders: true,
          eventRsvps: true,
          system: true,
        },
        update: { matches: false },
      });
      expect(result.matches).toBe(false);
    });

    it('updates only the provided fields', async () => {
      const updated = {
        matches: true,
        messages: false,
        likes: true,
        eventReminders: true,
        eventRsvps: false,
        system: true,
      };
      (prisma.notificationPreferences.upsert as jest.Mock).mockResolvedValue(updated);

      const result = await service.upsert('user-1', {
        messages: false,
        eventRsvps: false,
      });

      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: expect.objectContaining({
          messages: false,
          eventRsvps: false,
        }),
        update: { messages: false, eventRsvps: false },
      });
      expect(result.messages).toBe(false);
      expect(result.eventRsvps).toBe(false);
    });
  });
});
