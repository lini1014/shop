import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface PaymentResponse {
  status: string;
  orderId: string;
  amount: number;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private calcAmount(order: any): number {
    if (typeof order?.totalAmount === 'number') return order.totalAmount;
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.reduce((sum: number, it: any) =>
      sum + (Number(it?.price) || 0) * (Number(it?.quantity) || 0), 0);
  }

  async handleOrder(order: any) {
    this.logger.log(`Neue Bestellung: ${order?.orderId}`);

    // 1) Inventory-Check per REST
    for (const item of order.items ?? []) {
      const { data } = await axios.post<{ available: boolean }>(
        'http://localhost:4000/inventory/check',
        { productId: String(item.productId), quantity: Number(item.quantity) || 0 },
        { timeout: 3000 },
      );
      if (!data.available) {
        this.logger.warn(`Out of stock: ${item.productId}`);
        return { status: 'canceled_out_of_stock', orderId: order.orderId };
      }
    }

    // 2) Payment aufrufen
    try {
      const amount = this.calcAmount(order);
      const { data } = await axios.post<PaymentResponse>(
        'http://localhost:3001/payment',
        { orderId: order.orderId, amount },
        { timeout: 4000 },
      );
      return data.status === 'success'
        ? { status: 'paid_ok', orderId: order.orderId }
        : { status: 'payment_failed', orderId: order.orderId };
    } catch (e: any) {
      this.logger.error('Payment error: ' + (e?.message || e));
      return { status: 'payment_error', orderId: order.orderId };
    }
  }
}
