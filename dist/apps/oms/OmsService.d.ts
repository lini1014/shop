import { OnModuleInit } from '@nestjs/common';
import { OrderDto } from '../../libs/dto/OrderDTO';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';
import type { ClientGrpc } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
export declare class OmsService implements OnModuleInit {
    private readonly logClient;
    private readonly wmsClient;
    private readonly inventoryClient;
    private readonly logFilePath;
    private inventoryGrpcService;
    constructor(logClient: ClientProxy, wmsClient: ClientProxy, inventoryClient: ClientGrpc);
    onModuleInit(): Promise<void>;
    private log;
    private orders;
    private nextOrderId;
    private generateOrderId;
    createOrderFromSelection(body: CreateOrderRequestDto): Promise<OrderDto>;
    getOrderById(id: number): OrderDto;
    getLastWmsStatus(orderId: number): string | null;
    private inventoryReserve;
    private inventoryRelease;
    private paymentCharge;
}
