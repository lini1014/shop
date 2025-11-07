/// kernlogik
import { Injectable } from '@nestjs/common';

export interface ItemDto { productId: string; quantity: number }
export interface CreateOrderDto { orderId: string; totalAmount: number; items: ItemDto[] }
export interface Order {
  id: string;
  totalAmount: number;
  items: ItemDto[];
  status: 'RECEIVED' | 'RESERVED' | 'PAID' | 'FULFILLMENT_REQUESTED' | 'CANCELLED';
  reason?: string;
}

@Injectable()
export class OmsService {
  private orders = new Map<string, Order>();

  async createOrder(body: CreateOrderDto): Promise<Order> {
    const order: Order = {
      id: body.orderId,
      totalAmount: body.totalAmount,
      items: body.items,
      status: 'RECEIVED',
    };
    this.orders.set(order.id, order);

    // --- Orchestrierung (minimal, später echte Calls einhängen) ---
    try {
      // Inventory
      order.status = 'RESERVED';
      // Payment
      order.status = 'PAID';
      // WMS anstoßen
      order.status = 'FULFILLMENT_REQUESTED';
    } catch (e: unknown) {
      order.status = 'CANCELLED';
      order.reason = e instanceof Error ? e.message : 'UNKNOWN';
    }
    this.orders.set(order.id, order);
    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  // Demo-Szenarien optional
  async processScenario(mode: 'happy' | 'oos' | 'payfail'): Promise<{ status: string; orderId: string; reason?: string }> {
    const order = await this.createOrder({
      orderId: `ORD-${mode.toUpperCase()}`,
      totalAmount: 123.45,
      items: [{ productId: 'SKU-1', quantity: 1 }],
    });
    if (mode === 'oos') {
      order.status = 'CANCELLED';
      order.reason = 'OUT_OF_STOCK';
    } else if (mode === 'payfail') {
      order.status = 'CANCELLED';
      order.reason = 'PAYMENT_FAILED';
    }
    this.orders.set(order.id, order);
    return { status: order.status, orderId: order.id, reason: order.reason };
  }
}
