import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { ItemDto } from '../../libs/dto/ItemDTO';

interface Reservation {
  id: string;
  items: ItemDto[];
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
  // Beispielhafte Lagerbestände (überschneidend mit Payment-Katalog)
  private stock = new Map<number, number>([
    [101, 20],
    [102, 15],
    [103, 8],
  ]);

  // Temporäre Reservierungen
  private reservations = new Map<string, Reservation>();

  /**
   * Reserviert Bestand für eine Bestellung
   */
  reserveStock(items: ItemDto[]): string | null {
    // Prüfen, ob genug Bestand vorhanden ist
    for (const item of items) {
      const current = this.stock.get(item.productId) ?? 0;
      if (current < item.quantity) {
        this.log(
          'warn',
          `Nicht genug Bestand für Produkt ${item.productId}: ${current} < ${item.quantity}`,
        );
        return null;
      }
    }

    // Reservierung durchführen
    const reservationId = `res-${Date.now()}`;
    for (const item of items) {
      const current = this.stock.get(item.productId) ?? 0;
      this.stock.set(item.productId, current - item.quantity);
    }

    this.reservations.set(reservationId, { id: reservationId, items });

    this.log('info', `Reservierung erfolgreich: ${reservationId}`);
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
      const current = this.stock.get(item.productId) ?? 0;
      this.stock.set(item.productId, current + item.quantity);
    }

    this.reservations.delete(reservationId);

    this.log('info', `Reservierung ${reservationId} freigegeben`);
    return true;
  }

  /**
   * Optional: aktueller Bestand (für Debug oder Test)
   */
  getStock(productId: number): number {
    return this.stock.get(productId) ?? 0;
  }
}
