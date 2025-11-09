/// OMS Orchestrierung: keine Preis-/Bestandslogik – nur Weiterleitung
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CreateOrderDto } from '../dto/CreateOrderDTO';
import { ItemDto } from '../dto/ItemDTO';
import { OrderDto, OrderStatus } from '../dto/OrderDTO';

@Injectable()
export class OmsService {
  private orders = new Map<number, OrderDto>();

  private readonly inventoryBaseUrl = process.env.INVENTORY_URL || 'http://localhost:3001';
  private readonly paymentBaseUrl = process.env.PAYMENT_URL || 'http://localhost:3002';

  async createOrderFromSelection(body: CreateOrderDto): Promise<OrderDto> {
    const order: OrderDto = {
      id: body.orderId,
      items: body.items,
      status: OrderStatus.RECEIVED,
    };
    this.orders.set(order.id, order);

    // 1) Inventory reservieren
    const reserved = await this.inventoryReserve(body.items);
    if (!reserved.ok) {
      order.status = OrderStatus.CANCELLED;
      order.reason = 'OUT_OF_STOCK';
      this.orders.set(order.id, order);
      return order;
    }
    order.status = OrderStatus.RESERVED;
    this.orders.set(order.id, order);

    // 2) Payment ausführen
    const paid = await this.paymentCharge(order.id, body.items, body.accountBalance);
    if (!paid.ok) {
      order.status = OrderStatus.CANCELLED;
      order.reason = 'PAYMENT_FAILED';
      this.orders.set(order.id, order);
      return order;
    }
    order.status = OrderStatus.PAID;

    // 3) WMS anstoßen (nur Status markieren)
    order.status = OrderStatus.FULFILLMENT_REQUESTED;
    this.orders.set(order.id, order);
    return order;
  }

  async getOrderById(id: number): Promise<OrderDto | null> {
    return this.orders.get(id) ?? null;
  }

  private async inventoryReserve(items: ItemDto[]): Promise<{ ok: boolean }> {
    try {
      const res = await axios.post(`${this.inventoryBaseUrl}/inventory/reservations`, { items });
      return { ok: !!res.data?.ok };
    } catch {
      return { ok: false };
    }
  }

  private async paymentCharge(orderId: number, items: ItemDto[], accountBalance: number): Promise<{ ok: boolean }> {
    try {
      const res = await axios.post(`${this.paymentBaseUrl}/payment/charges`, { orderId, items, accountBalance });
      return { ok: !!res.data?.ok };
    } catch {
      return { ok: false };
    }
  }
}
