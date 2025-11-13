import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy, GrpcMethod } from '@nestjs/microservices';
import { InventoryService } from './InventoryService';
import { ItemDto } from '../../libs/dto/ItemDTO';

interface ReserveStockRequest {
  orderId: number;
  items: ItemDto[];
}

interface ReservationPayload {
  reservationId: string;
}

@Controller()
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

  @GrpcMethod('InventoryService', 'ReserveStock')
  reserveStock(data: ReserveStockRequest) {
    this.log('info', `Reservierung fuer Order ${data.orderId}`);
    const reservationId = this.service.reserveStock(data.items);
    if (!reservationId) {
      this.log('warn', `Reservierung fuer Order ${data.orderId} fehlgeschlagen: OUT_OF_STOCK`);
      return { ok: false, reason: 'OUT_OF_STOCK' };
    }
    this.log('info', `Reservierung fuer Order ${data.orderId} erfolgreich: ${reservationId}`);
    return { ok: true, reservationId };
  }

  @GrpcMethod('InventoryService', 'CommitReservation')
  commitReservation(data: ReservationPayload) {
    this.log('info', `Commit Reservation ${data.reservationId}`);
    const ok: boolean = this.service.commitReservation(data.reservationId);
    return { ok };
  }

  @GrpcMethod('InventoryService', 'ReleaseReservation')
  releaseReservation(data: ReservationPayload) {
    this.log('warn', `Release Reservation ${data.reservationId}`);
    const ok: boolean = this.service.releaseReservation(data.reservationId);
    return { ok };
  }
}
