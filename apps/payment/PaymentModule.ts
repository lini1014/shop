import { Module } from '@nestjs/common';
import { PaymentController } from './PaymentController';
import { PaymentService } from './PaymentService';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
