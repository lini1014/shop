import { ItemDto } from 'libs/dto/ItemDTO';
import { PaymentDto } from 'libs/dto/PaymentDTO';
import { OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
export interface PaymentResult {
    orderId: number;
    success: boolean;
    totalAmount: number;
    accountBalance: number;
    reason?: string;
    lineItems: Array<{
        productId: number;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
    }>;
}
export declare class PaymentService implements OnModuleInit {
    private readonly logClient;
    constructor(logClient: ClientProxy);
    onModuleInit(): Promise<void>;
    private log;
    private readonly customerBalances;
    private readonly catalog;
    getPrice(productId: number): number;
    priceItems(items: ItemDto[]): {
        productId: number;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
    }[];
    computeTotal(items: ItemDto[]): number;
    authorize(create: PaymentDto): PaymentResult;
}
