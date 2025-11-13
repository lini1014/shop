import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

interface Reservation {
  id: string;
  items: { sku: string; qty: number }[];
}

@Injectable()
export class InventoryService implements OnModuleInit {
  //*Client für den Log-Service wird injiziert
  constructor(@Inject('LOG_CLIENT') private readonly logClient: ClientProxy) {}

  async onModuleInit() {
    //* Verbindung zur RabbitMQ-Queue für das Logging aufbauen
    await this.logClient.connect();
    this.log('info', 'Inventory Service verbunden mit Log-Service');
  }
  //*Private Helfermethode für das Logging
  private log(level: 'info' | 'error' | 'warn', message: string) {
    //*Sendet die Log-Nachricht asynchron an die 'log_queue
    this.logClient.emit('log_message', {
      service: 'INVENTORY',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  // Beispielhafte Lagerbestände
  private stock = new Map<string, number>([
    ['SKU-123', 20],
    ['SKU-456', 15],
    ['SKU-789', 8],
  ]);

  // Temporäre Reservierungen
  private reservations = new Map<string, Reservation>();

  /**
   * Reserviert Bestand für eine Bestellung
   */
  reserveStock(items: { sku: string; qty: number }[]): string | null {
    // Prüfen, ob genug Bestand vorhanden ist
    for (const item of items) {
      const current = this.stock.get(item.sku) ?? 0;
      if (current < item.qty) {
        return null;
      }
    }

    // Reservierung durchführen
    const reservationId = `res-${Date.now()}`;
    for (const item of items) {
      const current = this.stock.get(item.sku) ?? 0;
      this.stock.set(item.sku, current - item.qty);
    }

    this.reservations.set(reservationId, { id: reservationId, items });
    return reservationId;
  }

  /**
   * Verbindlich abbuchen (Commit)
   */
  commitReservation(reservationId: string): boolean {
    this.log('info', `CommitReservation: ${reservationId}`);
    if (!this.reservations.has(reservationId)) {
      this.log('warn', `Commit fehlgeschlagen – Reservierung nicht gefunden: ${reservationId}`);
      return false;
    }

    // In einem echten System würde man hier in der DB den Status setzen.
    this.reservations.delete(reservationId);

    this.log('info', `Reservierung ${reservationId} erfolgreich committed`);
    return true;
  }

  /**
   * Reservierung wieder freigeben (Rollback)
   */
  releaseReservation(reservationId: string): boolean {
    this.log('info', `ReleaseReservation: ${reservationId}`);
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      this.log('warn', `Keine Reservierung mit ID ${reservationId} gefunden`);
      return false;
    }

    // Bestand wieder zurückbuchen
    for (const item of reservation.items) {
      const current = this.stock.get(item.sku) ?? 0;
      this.stock.set(item.sku, current + item.qty);
    }

    this.reservations.delete(reservationId);

    this.log('info', `Reservierung ${reservationId} freigegeben`);
    return true;
  }

  /**
   * Optional: aktueller Bestand (für Debug oder Test)
   */
  getStock(sku: string): number {
    return this.stock.get(sku) ?? 0;
  }
}
