import { OnModuleInit } from '@nestjs/common';
import { PaymentDto } from 'libs/dto/PaymentDTO';
import { PaymentService } from './PaymentService';
import { ClientProxy } from '@nestjs/microservices';
export declare class PaymentController implements OnModuleInit {
    private readonly service;
    private readonly logClient;
    constructor(service: PaymentService, logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    authorize(dto: PaymentDto): {
        success: boolean;
    };
}
