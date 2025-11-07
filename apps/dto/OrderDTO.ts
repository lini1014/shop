import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './ItemDTO';

// ✅ Statt Union-Type -> richtiges Enum (Swagger-freundlich)
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  RESERVED = 'RESERVED',
  PAID = 'PAID',
  FULFILLMENT_REQUESTED = 'FULFILLMENT_REQUESTED',
  CANCELLED = 'CANCELLED',
}

export class OrderDto {
  @ApiProperty({ example: 5001, description: 'Numerische Bestell-ID' })
  id!: number;

  @ApiProperty({ type: [ItemDto] })
  items!: ItemDto[];

  @ApiProperty({ example: 59.97, description: 'Gesamtbetrag in EUR' })
  totalAmount!: number;

  // ✅ enum + enumName, damit Swagger das schön rendert
  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus' })
  status!: OrderStatus;

  @ApiProperty({ required: false })
  reason?: string;
}
