import { ItemDto } from './ItemDTO';

// Repräsentiert den Orderzustand inklusive Items und optionalem Abbruchgrund.
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  RESERVED = 'RESERVED',
  PAID = 'PAID',
  FULFILLMENT_REQUESTED = 'FULFILLMENT_REQUESTED',
  CANCELLED = 'CANCELLED',
}

export class OrderDto {
  id!: number;
  items!: ItemDto[];
  status!: OrderStatus;
  reason?: string;
}
