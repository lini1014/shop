import { Injectable, BadRequestException } from '@nestjs/common';
import { ItemDto } from 'libs/dto/ItemDTO';
import { CreateOrderDto } from 'libs/dto/CreateOrderDTO';
export interface PaymentResult {
  orderId: number;
  success: boolean;
  totalAmount: number;
  accountBalance: number;
  reason?: string;
  lineItems: Array<{ productId: number; unitPrice: number; quantity: number; lineTotal: number }>;
}

type Catalog = Record<number, number>;

@Injectable()
export class PaymentService {
  private readonly catalog: Catalog = {
    101: 7.0,
    102: 60.0,
    103: 9.77,
  };

  getPrice(productId: number): number {
    const price = this.catalog[productId];
    if (price === undefined) {
      throw new BadRequestException(`Unknown productId ${productId}`);
    }
    return price;
  }

  priceItems(items: ItemDto[]) {
    return items.map((it) => {
      const unitPrice = this.getPrice(it.productId);
      const lineTotal = +(unitPrice * it.quantity).toFixed(2);
      return { productId: it.productId, unitPrice, quantity: it.quantity, lineTotal };
    });
  }

  computeTotal(items: ItemDto[]): number {
    const priced = this.priceItems(items);
    const total = priced.reduce((sum, li) => sum + li.lineTotal, 0);
    return +total.toFixed(2);
  }

  /**
   * Prüft, ob das Konto-Guthaben reicht und gibt das Ergebnis zurück.
   */
  authorize(create: CreateOrderDto): PaymentResult {
    const lineItems = this.priceItems(create.items);
    const totalAmount = lineItems.reduce((s, li) => s + li.lineTotal, 0);
    const total = +totalAmount.toFixed(2);

    const success = create.accountBalance >= total;

    const res: PaymentResult = {
      orderId: create.orderId,
      success,
      totalAmount: total,
      accountBalance: create.accountBalance,
      lineItems,
      reason: success ? undefined : 'INSUFFICIENT_FUNDS',
    };
    return res;
  }
}
