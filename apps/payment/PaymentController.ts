import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from 'libs/dto/CreateOrderDTO';
import { PaymentService } from './PaymentService';
import type { PaymentResult } from './PaymentService';


@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

@Post('authorize')
@ApiOperation({ summary: 'Nur Erfolg/Fehler zurückgeben' })
authorize(@Body() dto: CreateOrderDto): { success: boolean } {
  const result = this.service.authorize(dto);
  return { success: result.success };
}

}
