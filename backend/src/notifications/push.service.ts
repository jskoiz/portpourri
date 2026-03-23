import { Injectable, Logger } from '@nestjs/common';
import Expo, {
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceiptId,
} from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

/** Outcome categories for structured logging. */
export type PushOutcome =
  | 'delivered'
  | 'token_invalid'
  | 'device_not_registered'
  | 'delivery_failed'
  | 'send_error';

export interface PushDeliveryResult {
  outcome: PushOutcome;
  pushToken: string;
  error?: string;
  attempt?: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

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
  ): Promise<PushDeliveryResult> {
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(
        `Invalid Expo push token — outcome=token_invalid token=${pushToken}`,
      );
      return { outcome: 'token_invalid', pushToken };
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    };

    return this.sendWithRetry(message, pushToken);
  }

  private async sendWithRetry(
    message: ExpoPushMessage,
    pushToken: string,
  ): Promise<PushDeliveryResult> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync([message]);
        const result = await this.handleTickets(tickets, pushToken, attempt);
        if (result) return result;

        // Ticket had status 'ok'
        this.logger.debug(
          `Push delivered — outcome=delivered token=${pushToken} attempt=${attempt}`,
        );
        return { outcome: 'delivered', pushToken, attempt };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.warn(
            `Push send failed, retrying — attempt=${attempt}/${MAX_RETRIES} token=${pushToken} delay=${delay}ms error="${errMsg}"`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `Push send failed after ${MAX_RETRIES} attempts — outcome=send_error token=${pushToken} error="${errMsg}"`,
          error instanceof Error ? error.stack : undefined,
        );
        return { outcome: 'send_error', pushToken, error: errMsg, attempt };
      }
    }

    // Unreachable, but satisfies the compiler
    return { outcome: 'send_error', pushToken };
  }

  /**
   * Handle ticket responses. Returns a PushDeliveryResult if the ticket
   * indicates a terminal error (device not registered, etc.), or null
   * if the ticket was successful and the caller should report 'delivered'.
   */
  private async handleTickets(
    tickets: ExpoPushTicket[],
    pushToken: string,
    attempt: number,
  ): Promise<PushDeliveryResult | null> {
    const receiptIds: ExpoPushReceiptId[] = [];

    for (const ticket of tickets) {
      if (ticket.status === 'ok' && 'id' in ticket) {
        receiptIds.push(ticket.id);
      } else if (ticket.status === 'error') {
        this.logger.error(
          `Push ticket error — token=${pushToken} message="${ticket.message}" attempt=${attempt}`,
        );

        if (
          'details' in ticket &&
          ticket.details?.error === 'DeviceNotRegistered'
        ) {
          await this.clearPushToken(pushToken);
          return {
            outcome: 'device_not_registered',
            pushToken,
            error: ticket.message,
            attempt,
          };
        }

        return {
          outcome: 'delivery_failed',
          pushToken,
          error: ticket.message,
          attempt,
        };
      }
    }

    if (receiptIds.length > 0) {
      this.logger.debug(`Push receipt IDs: ${receiptIds.join(', ')}`);
    }

    return null;
  }

  private async clearPushToken(pushToken: string): Promise<void> {
    this.logger.warn(
      `Clearing invalid push token — outcome=device_not_registered token=${pushToken}`,
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
