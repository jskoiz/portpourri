import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationPreferencesData {
  matches?: boolean;
  messages?: boolean;
  likes?: boolean;
  eventReminders?: boolean;
  eventRsvps?: boolean;
  system?: boolean;
}

/** Default preferences when no row exists yet. */
const DEFAULTS: Required<NotificationPreferencesData> = {
  matches: true,
  messages: true,
  likes: true,
  eventReminders: true,
  eventRsvps: true,
  system: true,
};

/** Extract only the preference booleans from a Prisma row. */
function toPreferencesData(
  row: { matches: boolean; messages: boolean; likes: boolean; eventReminders: boolean; eventRsvps: boolean; system: boolean },
): Required<NotificationPreferencesData> {
  return {
    matches: row.matches,
    messages: row.messages,
    likes: row.likes,
    eventReminders: row.eventReminders,
    eventRsvps: row.eventRsvps,
    system: row.system,
  };
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<Required<NotificationPreferencesData>> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) return { ...DEFAULTS };

    return toPreferencesData(prefs);
  }

  async upsert(
    userId: string,
    data: NotificationPreferencesData,
  ): Promise<Required<NotificationPreferencesData>> {
    const prefs = await this.prisma.notificationPreferences.upsert({
      where: { userId },
      create: { userId, ...DEFAULTS, ...data },
      update: data,
    });

    return toPreferencesData(prefs);
  }
}
