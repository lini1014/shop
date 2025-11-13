/**
 * OMS-Orchestrierung:
 * 1) Inventory RESERVE → reservationId
 * 2) Payment CHARGE
 * 3) WMS anstoßen (hier: Statuswechsel)
 * - Bei Payment-Fehler: Inventory RELEASE (Kompensation)
 */
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  ConflictException,
} from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
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
  private readonly logFilePath = path.join(process.cwd(), 'log', 'log-file');

  //*Client für den Log-Service wird injiziert
  constructor(
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
    @Inject('WMS_CLIENT') private readonly wmsClient: ClientProxy,
  ) {}

  async onModuleInit() {
    //* Verbindung zur RabbitMQ-Queue für das Logging aufbauen
    await this.logClient.connect();
    //*Hier ebenso Aufbauen der Verbindung zum WMS'
    await this.wmsClient.connect();
    this.log('info', 'OMS Service verbunden mit Log-Service und WMS-Service');
  }
  //*Private Helfermethode für das Logging
  private log(level: 'info' | 'error' | 'warn', message: string) {
    //*Sendet die Log-Nachricht asynchron an die 'log_queue'
    this.logClient.emit('log_message', {
      service: 'OMS',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  } // In-Memory Orders (Demo)
  private orders = new Map<number, OrderDto>();
  private nextOrderId = 1000;

  private generateOrderId(): number {
    return this.nextOrderId++;
  }

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
    this.log('info', `Bestellung ${newId} ERHALTEN.`);

    // 1) INVENTORY: RESERVE
    const reserveRes = await this.inventoryReserve(order.id, body.items);
    if (!reserveRes.ok || !reserveRes.reservationId) {
      order.status = OrderStatus.CANCELLED;
      order.reason = 'OUT_OF_STOCK';
      this.orders.set(order.id, order);
      this.log('warn', `Bestellung ${order.id} storniert. Grund: OUT_OF_STOCK.`);
      throw new ConflictException({
        message: 'Reservierung im Inventory fehlgeschlagen',
        reason: 'OUT_OF_STOCK',
        orderId: order.id,
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
        {
          message: 'Zahlung im Payment-Service fehlgeschlagen',
          reason: order.reason,
          orderId: order.id,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    order.status = OrderStatus.PAID;
    this.orders.set(order.id, order);
    this.log('info', `Bestellung ${order.id} erfolgreich bezahlt.`);

    // 3) WMS anstoßen (hier simuliert)
    order.status = OrderStatus.FULFILLMENT_REQUESTED;
    const wmsPayload = {
      orderId: `ORDER-${order.id}`,
      items: order.items,
      customer: {
        firstName: body.firstName,
        lastName: body.lastName,
      },
    };
    this.wmsClient.emit('order_received', wmsPayload);
    this.log('info', `Bestellung ${order.id} an WMS weitergeleitet.`);

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
  }

  getLastWmsStatus(orderId: number): string | null {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return null;
      }
      const lines = fs.readFileSync(this.logFilePath, 'utf-8').split(/\r?\n/);
      const searchToken = `ORDER-${orderId}`;
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (!line || !line.includes('[WMS]') || !line.includes(searchToken)) {
          continue;
        }
        const match = line.match(/\]:\s*(.+)$/);
        return match ? match[1].trim() : line.trim();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log('warn', `WMS-Status konnte nicht gelesen werden: ${message}`);
    }
    return null;
  }

  // ---------------- Inventory Calls ----------------
  private async inventoryReserve(
    orderId: number,
    items: ItemDto[],
  ): Promise<{ ok: boolean; reservationId?: string }> {
    try {
      const { data } = await axios.post<InventoryReserveRes>(
        `http://localhost:3001/inventory/reservations`,
        { orderId, items },
      );
      this.log('info', `Inventory RESERVE -> ok=${data.ok}`);
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
        `http://localhost:3001/inventory/reservations/release`,
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
  }

  // ---------------- Payment Call ----------------
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
      }>(`http://localhost:3002/payments/authorize`, {
        orderId,
        items,
        firstName,
        lastName,
      });
      this.log('info', `Payment AUTHORIZE -> success=${data.success} `);
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
