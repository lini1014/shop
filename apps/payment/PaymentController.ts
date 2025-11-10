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
  @ApiOperation({ summary: 'Autorisiert eine Zahlung basierend auf Items & Account-Balance' })
  authorize(@Body() dto: CreateOrderDto): PaymentResult {
    return this.service.authorize(dto);
  }
}
