import { Controller, Post, Get, Param, Body, Headers, HttpException, HttpCode } from '@nestjs/common';
import { PaymentService } from './PaymentService';
import { CreatePaymentDto, PaymentView } from './PaymentDto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreatePaymentDto,
               @Headers('Idempotency-Key') idemKey?: string,
               @Headers('X-Force-Outcome') force?: string): Promise<PaymentView> {
    const res = await this.svc.create(dto, idemKey, force);

    if (res.status === 'DECLINED') {
      throw new HttpException(res, 402); // Payment Required
    }
    if (res.status === 'ERROR') {
      throw new HttpException(res, 502); // Bad Gateway (externer PS Fehler)
    }
    if (res.status === 'PENDING') {
      // Simuliert Timeout -> der Client kann retryen (idempotent!)
      throw new HttpException({ ...res, hint: 'Retry with same Idempotency-Key' }, 504);
    }
    return res;
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<PaymentView> {
    const res = await this.svc.get(id);
    if (!res) throw new HttpException('Not Found', 404);
    return res;
  }
}
