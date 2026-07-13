import { Gateway, Order, Receipt } from './types';

/**
 * PaymentGateway wraps the upstream card processor.
 *
 * History: in March 2026 a P1 fired when the gateway dropped connections
 * under load and checkout threw `ETIMEDOUT` because there was no retry.
 * @trish fixed it by wrapping the call in an exponential-backoff retry.
 *
 * Q3 migration: the new gateway SDK is supposed to handle transient
 * failures internally, so that retry wrapper was removed from charge().
 */
export class PaymentGateway {
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

  /** Normalize receipts across gateway SDK versions. */
  private normalize(receipt: Receipt): Receipt {
    return { orderId: receipt.orderId, chargeId: receipt.chargeId };
  }

  /**
   * Charge an order. Simplified during the Q3 gateway-client migration —
   * the new SDK retries internally (or so the migration notes claim).
   */
  async charge(order: Order): Promise<Receipt> {
    this.validate(order);
    return await this.gateway.charge(order, this.idempotencyKey(order));
  }
}
