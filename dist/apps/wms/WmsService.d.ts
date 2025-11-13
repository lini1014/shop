import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RmqContext } from '@nestjs/microservices';
interface OrderPayload {
    orderId: string;
    items: any[];
}
export declare class WmsService implements OnModuleInit {
    private readonly statusClient;
    private readonly logClient;
    constructor(statusClient: ClientProxy, logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    handleOrderReceived(data: OrderPayload, context: RmqContext): Promise<void>;
    private publishStatus;
    private sleep;
}
export {};
