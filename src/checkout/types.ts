export interface Order {
  id: string;
  amount: number;
  currency: string;
}

export interface Receipt {
  orderId: string;
  chargeId: string;
}

/** The upstream card processor Rewynd's incidents come from. */
export interface Gateway {
  charge(order: Order, idempotencyKey: string): Promise<Receipt>;
}
