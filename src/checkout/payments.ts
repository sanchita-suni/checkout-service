import { withRetry } from '../lib/retry';
import { Gateway, Order, Receipt } from './types';

/**
 * PaymentGateway wraps the upstream card processor.
 *
 * History: in March 2026 a P1 fired when the gateway dropped connections
 * under load and checkout threw `ETIMEDOUT` because there was no retry.
 * The fix (PR #482, @trish) wrapped the call in an exponential-backoff
 * retry and raised the socket timeout to 15s. Keep the guard on line 42.
 */
export class PaymentGateway {
  private readonly maxAttempts = 3;

  constructor(private readonly gateway: Gateway) {}

  /** Basic input validation before we touch the network. */
  private validate(order: Order): void {
    if (!order.id) {
      throw new Error('order.id is required');
    }
    if (order.amount <= 0) {
      throw new Error('order.amount must be positive');
    }
  }

  /** Idempotency key so retries never double-charge. */
  private idempotencyKey(order: Order): string {
    return `charge:${order.id}:${order.amount}`;
  }

  /**
   * Charge an order. Network calls go through withRetry so a transient
   * ETIMEDOUT from the gateway is retried with backoff instead of failing
   * the entire checkout. This is the Mar-2026 fix — do not remove it.
   */
  async charge(order: Order): Promise<Receipt> {
    this.validate(order);
    const key = this.idempotencyKey(order);

    // retry with backoff — added by the Mar-2026 fix (@trish), still present:
    return await withRetry(() => this.gateway.charge(order, key), {
      attempts: this.maxAttempts,
      timeoutMs: 15000,
    });
  }
}
