import { Controller, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import { InventoryService } from './InventoryService';
<<<<<<< HEAD
import { ItemDto } from '../../libs/dto/ItemDTO';
=======
import { ClientProxy } from '@nestjs/microservices';
>>>>>>> 844581d25236b4eaa4d1b828c34240f20ba867ca

@Controller('inventory')
export class InventoryController implements OnModuleInit {
  constructor(
    private readonly service: InventoryService,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}
  async onModuleInit() {
    await this.logClient.connect();
  }
  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'INVENTORY',
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
<<<<<<< HEAD
  async reserveStock(@Body() body: { orderId: number; items: ItemDto[] }) {
    this.logger.log(`Reservierung für Order ${body.orderId}`);
    const reservationId = await this.service.reserveStock(body.items);
=======
  reserveStock(@Body() body: { orderId: number; items: { sku: string; qty: number }[] }) {
    this.log('info', `Eingehende Reservierung für Order ${body.orderId}`);

    const reservationId: string | null = this.service.reserveStock(body.items);

>>>>>>> 844581d25236b4eaa4d1b828c34240f20ba867ca
    if (!reservationId) {
      this.log('warn', `Reservierung für Order ${body.orderId} fehlgeschlagen: OUT_OF_STOCK`);
      return { ok: false, reason: 'OUT_OF_STOCK' };
    }
    this.log('info', `Reservierung für Order ${body.orderId} erfolgreich: ${reservationId}`);
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
