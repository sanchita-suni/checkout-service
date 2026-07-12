import { PaymentGateway } from './payments';
import { Order, Receipt } from './types';

/** Orchestrates a single checkout: validate → charge → receipt. */
export class Checkout {
  constructor(private readonly payments: PaymentGateway) {}

  async process(order: Order): Promise<Receipt> {
    // The charge is where transient gateway failures surface as ETIMEDOUT.
    return await this.payments.charge(order);
  }
}
