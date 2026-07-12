import { Checkout } from '../checkout';
import { Order, Receipt } from '../checkout/types';

/** Top-level order submission — the entry point in the incident stack trace. */
export class OrderService {
  constructor(private readonly checkout: Checkout) {}

  async submit(order: Order): Promise<Receipt> {
    return await this.checkout.process(order);
  }
}
