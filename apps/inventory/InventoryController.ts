import { Controller, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import { InventoryService } from './InventoryService';
import { ClientProxy } from '@nestjs/microservices';

@Controller('inventory')
export class InventoryController implements OnModuleInit {
  constructor(
    private readonly service: InventoryService,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}
  async onModuleInit() {
    await this.logClient.connect();
    this.log('info', 'InventoryController verbunden mit Log-Service');
  }
  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'INVENTORY_Controller', // Eindeutiger Name
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /inventory/reservations
   * Reserviert Bestand für eine Bestellung (Step 1 in OMS)
   */
  @Post('reservations')
  reserveStock(@Body() body: { orderId: number; items: { sku: string; qty: number }[] }) {
    this.log('info', `Reservierung für Order ${body.orderId}`);

    const reservationId: string | null = this.service.reserveStock(body.items);

    if (!reservationId) {
      return { ok: false, reason: 'OUT_OF_STOCK' };
    }

    return { ok: true, reservationId };
  }

  /**
   * POST /inventory/reservations/commit
   * Verbindlich abbuchen (Step 3 in OMS)
   */
  @Post('reservations/commit')
  commitReservation(@Body() body: { reservationId: string }) {
    this.log('info', `Commit Reservation ${body.reservationId}`);

    const ok: boolean = this.service.commitReservation(body.reservationId);

    return { ok };
  }

  /**
   * POST /inventory/reservations/release
   * Reservierung wieder freigeben (bei Payment-Fehler)
   */
  @Post('reservations/release')
  releaseReservation(@Body() body: { reservationId: string }) {
    this.log('warn', `Release Reservation ${body.reservationId}`);

    const ok: boolean = this.service.releaseReservation(body.reservationId);

    return { ok };
  }
}
