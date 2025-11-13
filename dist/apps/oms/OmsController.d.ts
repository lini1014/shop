import { OnModuleInit } from '@nestjs/common';
import { OmsService } from './OmsService';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';
import { ClientProxy } from '@nestjs/microservices';
export declare class OmsController implements OnModuleInit {
    private readonly omsService;
    private readonly logClient;
    constructor(omsService: OmsService, logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    create(body: CreateOrderRequestDto): Promise<{
        id: number;
        status: import("../../libs/dto/OrderDTO").OrderStatus;
    }>;
    getOrderById(id: number): {
        status: string;
        id: number;
        items: import("../../libs/dto/ItemDTO").ItemDto[];
        reason?: string;
    };
}
