import { Injectable } from '@nestjs/common';

export type OrderStatus =
  | 'RECEIVED'        // Bestellung im OMS erstellt
  | 'CHECKED'         // Verfügbarkeit geprüft
  | 'RESERVED'        // Items reserviert
  | 'PAYMENT_OK'      // Zahlung erfolgreich
  | 'PAYMENT_FAILED'  // Zahlung fehlgeschlagen
  | 'CANCELLED'       // Bestellung storniert (keine Verfügbarkeit)
  | 'DISPATCHED';     // an WMS übergeben

export interface OrderItem {
  productId: string;
  quantity: number;
  price?: number;
}

export interface Order {
  orderId: string;
  customer?: any;
  items: OrderItem[];
  totalAmount?: number;
  shippingAddress?: any;
  status: OrderStatus;
  log: string[];
}

export interface InventoryItem {
  productId: string;
  stock: number;     
}

export interface Reservation {
  orderId: string;
  items: { productId: string; quantity: number }[];
  committed: boolean;
}

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export type WmsEventType = 'ITEMS_PICKED' | 'ORDER_PACKED' | 'ORDER_SHIPPED' | 'START_FULFILLMENT';

export interface WmsEvent {
  id: string;
  orderId: string;
  type: WmsEventType;
  payload?: any;
  timestamp: string;
}

@Injectable()
export class AlibiDbService {

  private orders = new Map<string, Order>();

  private inventory = new Map<string, InventoryItem>();
  private reservations = new Map<string, Reservation>();

  private payments = new Map<string, PaymentRecord>();

  private wmsEvents = new Map<string, WmsEvent[]>();

  private paymentMode: 'alwaysSuccess' | 'alwaysFail' | 'byOrder' = 'alwaysSuccess';
  private nextPaymentResultByOrder = new Map<string, 'SUCCESS' | 'FAILED'>();

  constructor() {
    this.setStock('P-8821', 10);
    this.setStock('P-3344', 3);
  }

  createOrder(order: Omit<Order, 'status' | 'log'> & Partial<Pick<Order, 'status' | 'log'>>): Order {
    if (this.orders.has(order.orderId)) {
      return this.orders.get(order.orderId)!;
    }
    const o: Order = {
      ...order,
      status: order.status ?? 'RECEIVED',
      log: order.log ?? [],
    };
    this.orders.set(o.orderId, o);
    this.appendLog(o.orderId, `Order created with ${o.items?.length ?? 0} items.`);
    return o;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  setOrderStatus(orderId: string, status: OrderStatus): void {
    const o = this.mustOrder(orderId);
    o.status = status;
    this.appendLog(orderId, `Status -> ${status}`);
  }

  appendLog(orderId: string, message: string): void {
    const o = this.mustOrder(orderId);
    o.log.push(`[${new Date().toISOString()}] ${message}`);
  }

  listOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  //Inventory
  setStock(productId: string, stock: number): void {
    this.inventory.set(productId, { productId, stock });
  }

  getStock(productId: string): number {
    return this.inventory.get(productId)?.stock ?? 0;
  }

  /**
   * Prüft Verfügbarkeit aller Items.
   * Gibt {ok:false, missing:[...]} zurück, wenn etwas fehlt.
   */
  checkAvailability(items: OrderItem[]): { ok: boolean; missing: { productId: string; need: number; have: number }[] } {
    const missing = items
      .map(i => {
        const have = this.getStock(i.productId);
        return have >= i.quantity ? null : { productId: i.productId, need: i.quantity, have };
      })
      .filter(Boolean) as { productId: string; need: number; have: number }[];
    return { ok: missing.length === 0, missing };
  }

  /**
   * Reserviert Items (dekrementiert sofort den verfügbaren Bestand).
   * Idempotent je orderId (erneutes Reservieren überschreibt nicht).
   */
  reserve(orderId: string, items: OrderItem[]): { ok: boolean; message?: string } {
    if (this.reservations.has(orderId)) {
      return { ok: true, message: 'Already reserved (idempotent).' };
    }
    const check = this.checkAvailability(items);
    if (!check.ok) {
      return { ok: false, message: `Not enough stock for: ${check.missing.map(m => `${m.productId} (${m.have}/${m.need})`).join(', ')}` };
    }
    // Bestand reduzieren
    for (const i of items) {
      const curr = this.getStock(i.productId);
      this.setStock(i.productId, curr - i.quantity);
    }
    // Reservation speichern
    this.reservations.set(orderId, {
      orderId,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      committed: false,
    });
    this.appendLog(orderId, `Reserved ${items.map(i => `${i.quantity}x ${i.productId}`).join(', ')}`);
    return { ok: true };
  }

  /**
   * Rollback der Reservierung (z.B. bei Payment-Fehlschlag).
   */
  releaseReservation(orderId: string): void {
    const res = this.reservations.get(orderId);
    if (!res || res.committed) return;
    for (const i of res.items) {
      const curr = this.getStock(i.productId);
      this.setStock(i.productId, curr + i.quantity);
    }
    this.reservations.delete(orderId);
    this.appendLog(orderId, `Reservation released (rollback).`);
  }

  /**
   * Commit der Reservierung (nach Zahlung): markiert als committed.
   * Bestand wurde bereits beim Reservieren reduziert – hier nur Markierung.
   */
  commitReservation(orderId: string): void {
    const res = this.reservations.get(orderId);
    if (!res) return;
    res.committed = true;
    this.appendLog(orderId, `Reservation committed.`);
  }

  // ---------- Payments (Simulation) ----------
  setPaymentMode(mode: 'alwaysSuccess' | 'alwaysFail' | 'byOrder'): void {
    this.paymentMode = mode;
  }

  setNextPaymentResultForOrder(orderId: string, result: 'SUCCESS' | 'FAILED'): void {
    this.nextPaymentResultByOrder.set(orderId, result);
  }

  charge(orderId: string, amount: number): PaymentRecord {
    let result: 'SUCCESS' | 'FAILED' = 'SUCCESS';

    if (this.paymentMode === 'alwaysFail') {
      result = 'FAILED';
    } else if (this.paymentMode === 'byOrder') {
      result = this.nextPaymentResultByOrder.get(orderId) ?? 'SUCCESS';
      this.nextPaymentResultByOrder.delete(orderId); // einmalig
    }

    const rec: PaymentRecord = {
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId,
      amount,
      status: result,
      timestamp: new Date().toISOString(),
    };
    this.payments.set(rec.paymentId, rec);

    if (result === 'SUCCESS') {
      this.appendLog(orderId, `Payment SUCCESS (${amount.toFixed(2)})`);
    } else {
      this.appendLog(orderId, `Payment FAILED (${amount.toFixed(2)})`);
    }

    return rec;
  }

  getPaymentsForOrder(orderId: string): PaymentRecord[] {
    return Array.from(this.payments.values()).filter(p => p.orderId === orderId);
  }

  // ---------- WMS Events (als Log/Messages) ----------
  pushWmsEvent(orderId: string, type: WmsEventType, payload?: any): WmsEvent {
    const ev: WmsEvent = {
      id: `WMS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const list = this.wmsEvents.get(orderId) ?? [];
    list.push(ev);
    this.wmsEvents.set(orderId, list);
    this.appendLog(orderId, `WMS Event: ${type}`);
    return ev;
  }

  getWmsEvents(orderId: string): WmsEvent[] {
    return this.wmsEvents.get(orderId) ?? [];
  }

  // ---------- Helpers ----------
  private mustOrder(orderId: string): Order {
    const o = this.orders.get(orderId);
    if (!o) {
      throw new Error(`Order not found: ${orderId}`);
    }
    return o;
  }
}
