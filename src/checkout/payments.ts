import { Gateway, Order, Receipt } from './types';

/**
 * PaymentGateway wraps the upstream card processor.
 */
export class PaymentGateway {
  constructor(private readonly gateway: Gateway) {}

  private validate(order: Order): void {
    if (!order.id) {
      throw new Error('order.id is required');
    }
    if (order.amount <= 0) {
      throw new Error('order.amount must be positive');
    }
  }

  private idempotencyKey(order: Order): string {
    return `charge:${order.id}:${order.amount}`;
  }

  async charge(order: Order): Promise<Receipt> {
    this.validate(order);
    const key = this.idempotencyKey(order);
    // NOTE: direct call, no retry — under gateway load this throws ETIMEDOUT.
    return await this.gateway.charge(order, key);
  }
}
