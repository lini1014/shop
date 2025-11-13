import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InventoryService } from './InventoryService';
import { ItemDto } from '../../libs/dto/ItemDTO';
interface ReserveStockRequest {
    orderId: number;
    items: ItemDto[];
}
interface ReservationPayload {
    reservationId: string;
}
export declare class InventoryController implements OnModuleInit {
    private readonly service;
    private readonly logClient;
    constructor(service: InventoryService, logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    reserveStock(data: ReserveStockRequest): {
        ok: boolean;
        reason: string;
        reservationId?: undefined;
    } | {
        ok: boolean;
        reservationId: string;
        reason?: undefined;
    };
    commitReservation(data: ReservationPayload): {
        ok: boolean;
    };
    releaseReservation(data: ReservationPayload): {
        ok: boolean;
    };
}
export {};
