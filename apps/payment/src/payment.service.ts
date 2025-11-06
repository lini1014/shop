import { Injectable } from '@nestjs/common';
import { AlibiDbService } from '../../shop/src/common/alibi-db.service';

@Injectable()
export class PaymentService {
  constructor(private readonly db: AlibiDbService) {}

  // Optional: globales Verhalten steuern
  setMode(mode: 'alwaysSuccess' | 'alwaysFail' | 'byOrder') {
    this.db.setPaymentMode(mode);
  }

  setNextResult(orderId: string, result: 'SUCCESS' | 'FAILED') {
    this.db.setNextPaymentResultForOrder(orderId, result);
  }

  charge(orderId: string, amount: number) {
    return this.db.charge(orderId, amount);
  }
}
