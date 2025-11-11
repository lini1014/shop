// apps/oms/OmsService.ts
/**
 * OMS-Orchestrierung:
 * 1) Inventory RESERVE → reservationId
 * 2) Payment CHARGE
 * 3) WMS anstoßen (hier: Statuswechsel)
 *    - Bei Payment-Fehler: Inventory RELEASE (Kompensation)
 */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { ItemDto } from '../../libs/dto/ItemDTO';
import { OrderDto, OrderStatus } from '../../libs/dto/OrderDTO';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';

// ---- Antwort-Interfaces der Upstream-Services (statisch typisiert) ----
interface InventoryReserveRes {
  ok: boolean;
  reservationId?: string;
  reason?: string;
}
interface InventoryReleaseRes {
  ok: boolean;
}
interface PaymentChargeRes {
  ok: boolean;
  transactionId?: string;
  reason?: string;
}

@Injectable()
export class OmsService {
  private readonly logger = new Logger(OmsService.name);

  // In-Memory Orders (Demo)
  private orders = new Map<number, OrderDto>();
  private nextOrderId = 0;

  private generateOrderId(): number {
    return this.nextOrderId++;
  }

  // Basis-URLs via ENV konfigurierbar
  private readonly inventoryBaseUrl = process.env.INVENTORY_URL ?? 'http://localhost:3001';
  private readonly paymentBaseUrl = process.env.PAYMENT_URL ?? 'http://localhost:3002';

  /**
   * Hauptablauf: Reserve → Charge → Commit → WMS
   */
  async createOrderFromSelection(body: CreateOrderRequestDto): Promise<OrderDto> {
    // 0) Order anlegen (ID intern generieren)
    const newId = this.generateOrderId();
    const order: OrderDto = {
      id: newId,
      items: body.items,
      status: OrderStatus.RECEIVED,
    };
    this.orders.set(order.id, order);

    // 1) INVENTORY: RESERVE
    const reserveRes = await this.inventoryReserve(order.id, body.items);
    if (!reserveRes.ok || !reserveRes.reservationId) {
      order.status = OrderStatus.CANCELLED;
      order.reason = 'OUT_OF_STOCK';
      this.orders.set(order.id, order);
      throw new HttpException(
        { message: 'Reservierung im Inventory fehlgeschlagen', reason: 'OUT_OF_STOCK' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const reservationId = reserveRes.reservationId;
    order.status = OrderStatus.RESERVED;
    this.orders.set(order.id, order);

    // 2) PAYMENT: CHARGE
    const payRes = await this.paymentCharge(order.id, body.items, body.firstName, body.lastName);
    if (!payRes.ok) {
      // Kompensation: Reservierung freigeben
      await this.inventoryRelease(reservationId);
      order.status = OrderStatus.CANCELLED;
      order.reason = payRes.reason ?? 'PAYMENT_FAILED';
      this.orders.set(order.id, order);
      throw new HttpException(
        { message: 'Zahlung im Payment-Service fehlgeschlagen', reason: order.reason },
        HttpStatus.BAD_REQUEST,
      );
    }
    order.status = OrderStatus.PAID;
    this.orders.set(order.id, order);

    // 3) WMS anstoßen (hier simuliert)
    order.status = OrderStatus.FULFILLMENT_REQUESTED;
    this.orders.set(order.id, order);
    return order;
  }

  // Get methode: Order nach ID holen, 404 wenn nicht vorhanden
  getOrderById(id: number): OrderDto {
    const order = this.orders.get(id);
    if (!order) {
      throw new HttpException(
        { message: 'Order nicht gefunden', reason: 'NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    }
    return order;
  }

  // ---------------- Inventory Calls ----------------

  private async inventoryReserve(
    orderId: number,
    items: ItemDto[],
  ): Promise<{ ok: boolean; reservationId?: string }> {
    try {
      const { data } = await axios.post<InventoryReserveRes>(
        `${this.inventoryBaseUrl}/inventory/reservations`,
        { orderId, items },
      );
      this.logger.log(
        `Inventory RESERVE -> ok=${data.ok} reservationId=${data.reservationId ?? '-'}`,
      );
      return { ok: data.ok, reservationId: data.reservationId };
    } catch (e) {
      this.logger.error('Inventory RESERVE unreachable', e instanceof Error ? e.message : e);
      throw new HttpException(
        { message: 'Inventory-Service nicht erreichbar' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async inventoryRelease(reservationId: string): Promise<{ ok: boolean }> {
    try {
      const { data } = await axios.post<InventoryReleaseRes>(
        `${this.inventoryBaseUrl}/inventory/reservations/release`,
        { reservationId },
      );
      this.logger.warn(`Inventory RELEASE -> ok=${data.ok}`);
      return { ok: data.ok };
    } catch (e) {
      // Release-Fehler nicht eskalieren (Order bleibt ohnehin CANCELLED), nur loggen
      this.logger.error('Inventory RELEASE unreachable', e instanceof Error ? e.message : e);
      return { ok: false };
    }
  }

  // ---------------- Payment Call ----------------

  private async paymentCharge(
    orderId: number,
    items: ItemDto[],
    firstName: string,
    lastName: string,
  ): Promise<{ ok: boolean; transactionId?: string; totalAmount?: number; reason?: string }> {
    try {
      const { data } = await axios.post<PaymentChargeRes>(`${this.paymentBaseUrl}/payments/`, {
        orderId,
        items,
        firstName,
        lastName,
      });
      this.logger.log(`Payment CHARGE -> ok=${data.ok} tx=${data.transactionId ?? '-'}`);
      return {
        ok: data.ok,
        transactionId: data.transactionId,
        reason: data.reason,
      };
    } catch (e) {
      this.logger.error('Payment CHARGE unreachable', e instanceof Error ? e.message : e);
      throw new HttpException(
        { message: 'Payment-Service nicht erreichbar' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
