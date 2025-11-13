import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ItemDto } from '../../libs/dto/ItemDTO';
export declare class InventoryService implements OnModuleInit {
    private readonly logClient;
    constructor(logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    private stock;
    private reservations;
    reserveStock(items: ItemDto[]): string | null;
    commitReservation(reservationId: string): boolean;
    releaseReservation(reservationId: string): boolean;
    getStock(productId: number): number;
}
