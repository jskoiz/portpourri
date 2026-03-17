import { Injectable, Logger } from '@nestjs/common';
import Expo, {
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceiptId,
} from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(private readonly prisma: PrismaService) {
    this.expo = new Expo();
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid Expo push token: ${pushToken}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      await this.handleTickets(tickets, pushToken);
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to ${pushToken}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async handleTickets(
    tickets: ExpoPushTicket[],
    pushToken: string,
  ): Promise<void> {
    const receiptIds: ExpoPushReceiptId[] = [];

    for (const ticket of tickets) {
      if (ticket.status === 'ok' && 'id' in ticket) {
        receiptIds.push(ticket.id);
      } else if (ticket.status === 'error') {
        this.logger.error(
          `Push ticket error: ${ticket.message}`,
        );
        if (
          'details' in ticket &&
          ticket.details?.error === 'DeviceNotRegistered'
        ) {
          await this.clearPushToken(pushToken);
        }
      }
    }

    // Check receipts after a short delay in production;
    // for now we log receipt IDs for future receipt-checking jobs.
    if (receiptIds.length > 0) {
      this.logger.debug(`Push receipt IDs: ${receiptIds.join(', ')}`);
    }
  }

  private async clearPushToken(pushToken: string): Promise<void> {
    this.logger.warn(
      `Clearing invalid push token: ${pushToken}`,
    );

    try {
      await this.prisma.user.updateMany({
        where: { pushToken },
        data: { pushToken: null },
      });
    } catch (error) {
      this.logger.error(
        'Failed to clear push token',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
