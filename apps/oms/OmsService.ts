// apps/oms/OmsService.ts
/**
 * OMS-Orchestrierung:
 * 1) Inventory RESERVE → reservationId
 * 2) Payment CHARGE
 * 3) WMS anstoßen (hier: Statuswechsel)
 * - Bei Payment-Fehler: Inventory RELEASE (Kompensation)
 */
import { Injectable, HttpException, HttpStatus, Inject, OnModuleInit, ConflictException } from '@nestjs/common';
import axios from 'axios';
import { ItemDto } from '../../libs/dto/ItemDTO';
import { OrderDto, OrderStatus } from '../../libs/dto/OrderDTO';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';
import { ClientProxy } from '@nestjs/microservices';

// ---- Antwort-Interfaces der Upstream-Services (statisch typisiert) ----
interface InventoryReserveRes {
  ok: boolean;
  reservationId?: string;
  reason?: string;
}
interface InventoryReleaseRes {
  ok: boolean;
}
interface PaymentCharge {
  ok: boolean;
  reason?: string;
}

@Injectable()
export class OmsService implements OnModuleInit {
  constructor(
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
    @Inject('WMS_CLIENT') private readonly wmsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.logClient.connect();
    await this.wmsClient.connect();
    this.log('info', 'OMS Service verbunden mit Log-Service und WMS-Service');
  }

  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'OMS',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  } // In-Memory Orders (Demo)
  private orders = new Map<number, OrderDto>();
  private nextOrderId = 0;

  private generateOrderId(): number {
    return this.nextOrderId++;
  } // Basis-URLs via ENV konfigurierbar

  private readonly inventoryBaseUrl = process.env.INVENTORY_URL ?? 'http://localhost:3001';
  private readonly paymentBaseUrl = process.env.PAYMENT_URL ?? 'http://localhost:3002';
  /**
   * Hauptablauf: Reserve → Charge → Commit → WMS
   */

  async createOrderFromSelection(body: CreateOrderRequestDto): Promise<OrderDto> {
    // 0) Order anlegen (ID wird intern generiert)
    const newId = this.generateOrderId();
    const order: OrderDto = {
      id: newId,
      items: body.items,
      status: OrderStatus.RECEIVED,
    };
    this.orders.set(order.id, order);
    this.log('info', `Bestellung ${newId} ERHALTEN.`); // 1) INVENTORY: RESERVE

    const reserveRes = await this.inventoryReserve(order.id, body.items);
    if (!reserveRes.ok || !reserveRes.reservationId) {
      order.status = OrderStatus.CANCELLED;
      order.reason = 'OUT_OF_STOCK';
      this.orders.set(order.id, order);
      this.log('warn', `Bestellung ${order.id} storniert. Grund: OUT_OF_STOCK.`);
      throw new ConflictException({
        message: 'Reservierung im Inventory fehlgeschlagen',
        reason: 'OUT_OF_STOCK',
      });
    }
    const reservationId = reserveRes.reservationId;
    order.status = OrderStatus.RESERVED;
    this.orders.set(order.id, order);

    // 2) PAYMENT: AUTHORIZE (Payment-Service erwartet firstName/lastName)

    const payRes = await this.paymentCharge(order.id, body.items, body.firstName, body.lastName);
    if (!payRes.ok) {
      // Kompensation: Reservierung freigeben
      await this.inventoryRelease(reservationId);
      order.status = OrderStatus.CANCELLED;
      order.reason = payRes.reason ?? 'PAYMENT_FAILED';
      this.orders.set(order.id, order);
      this.log('warn', `Bestellung ${order.id} storniert. Grund: ${order.reason}.`);
      throw new HttpException(
        { message: 'Zahlung im Payment-Service fehlgeschlagen', reason: order.reason },
        HttpStatus.BAD_REQUEST,
      );
    }
    order.status = OrderStatus.PAID;
    this.orders.set(order.id, order);
    this.log('info', `Bestellung ${order.id} erfolgreich bezahlt.`); // 3) WMS anstoßen (hier simuliert)

    order.status = OrderStatus.FULFILLMENT_REQUESTED;

    const wmsPayload = {
      orderId: `ORD-${order.id}`,
      items: order.items,
      customer: {
        firstName: body.firstName,
        lastName: body.lastName,
      },
      // ... (evtl. mehr Daten aus dem PDF-Beispiel)
    };
    this.wmsClient.emit('order_received', wmsPayload);
    this.log('info', `Bestellung ${order.id} an WMS (Queue: wms_queue) weitergeleitet.`);

    this.orders.set(order.id, order);
    return order;
  }

  // Get methode: Order nach ID holen, 404 wenn nicht vorhanden

  getOrderById(id: number): OrderDto {
    const order = this.orders.get(id);
    if (!order) {
      this.log('warn', `Versuch, nicht existierende Order ${id} abzurufen.`);
      throw new HttpException(
        { message: 'Order nicht gefunden', reason: 'NOT_FOUND' },
        HttpStatus.NOT_FOUND,
      );
    }
    return order;
  } // ---------------- Inventory Calls ----------------

  private async inventoryReserve(
    orderId: number,
    items: ItemDto[],
  ): Promise<{ ok: boolean; reservationId?: string }> {
    try {
      const { data } = await axios.post<InventoryReserveRes>(
        `${this.inventoryBaseUrl}/inventory/reservations`,
        { orderId, items },
      );
      this.log(
        'info',
        `Inventory RESERVE -> ok=${data.ok} reservationId=${data.reservationId ?? '-'}`,
      );
      return { ok: data.ok, reservationId: data.reservationId };
    } catch (e) {
      const errorDetails = e instanceof Error ? e.message : String(e);
      this.log('error', `Inventory RESERVE unreachable: ${errorDetails}`);
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
      this.log('warn', `Inventory RELEASE (Kompensation) -> ok=${data.ok}`);
      return { ok: data.ok };
    } catch (e) {
      // Release-Fehler nicht eskalieren (Order bleibt ohnehin CANCELLED), nur loggen
      const errorDetails = e instanceof Error ? e.message : String(e);
      this.log('error', `Inventory RELEASE unreachable: ${errorDetails}`);
      return { ok: false };
    }
  } // ---------------- Payment Call ----------------

  private async paymentCharge(
    orderId: number,
    items: ItemDto[],
    firstName: string,
    lastName: string,
  ): Promise<PaymentCharge> {
    try {
      const { data } = await axios.post<{
        success: boolean;
        reason?: string;
      }>(`${this.paymentBaseUrl}/payments/authorize`, {
        orderId,
        items,
        firstName,
        lastName,
      });
      this.log(
        'info',
        `Payment AUTHORIZE -> success=${data.success} reason=${data.reason ?? '-'} `,
      );
      return {
        ok: data.success,
        reason: data.reason,
      };
    } catch (e) {
      const errorDetails = e instanceof Error ? e.message : String(e);
      this.log('error', `Payment CHARGE unreachable: ${errorDetails}`);
      throw new HttpException(
        { message: 'Payment-Service nicht erreichbar' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
