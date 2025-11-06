import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AlibiDbService } from '../../shop/src/common/alibi-db.service';

interface InventoryRequest {
  productId: string;
  quantity: number;
}
interface InventoryResponse {
  available: boolean;
}

@Injectable()
export class InventoryService {
  @GrpcMethod('InventoryService')
  CheckAvailability(data: InventoryRequest): InventoryResponse {
    const available = data.quantity <= 5;
    console.log('[inventory] CheckAvailability', data, '=>', available);
    return { available };
  }

  constructor(private readonly db: AlibiDbService) {}

  check(items) {
    return this.db.checkAvailability(items);
  }

  reserve(orderId: string, items) {
    return this.db.reserve(orderId, items);
  }

  release(orderId: string) {
    this.db.releaseReservation(orderId);
  }

  commit(orderId: string) {
    this.db.commitReservation(orderId);
  }
}
