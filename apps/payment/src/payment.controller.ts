import { Controller, Post, Body } from '@nestjs/common';

type PayBody = { orderId: string; amount: number };

@Controller('payment')
export class PaymentController {
  // <-- WICHTIG: Name = PaymentController
  @Post()
  process(@Body() body: PayBody) {
    const success = Math.random() > 0.2;
    return {
      status: success ? 'success' : 'failed',
      orderId: body.orderId,
      amount: body.amount,
    };
  }
}
