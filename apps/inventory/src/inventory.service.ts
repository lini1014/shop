import { Injectable } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

interface InventoryRequest { productId: string; quantity: number; }
interface InventoryResponse { available: boolean; }

@Injectable()
export class InventoryService {
  // 1 Argument -> Funktionsname muss exakt wie im proto heißen: CheckAvailability
  @GrpcMethod('InventoryService')
  CheckAvailability(data: InventoryRequest): InventoryResponse {
    const available = data.quantity <= 5;
    console.log('[inventory] CheckAvailability', data, '=>', available);
    return { available };
  }
}
