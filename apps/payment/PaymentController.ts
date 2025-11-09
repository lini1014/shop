import { Controller, Post, Get, Param, Body, Headers, HttpException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { PaymentService } from './PaymentService';
import { CreatePaymentDto, PaymentView } from '../dto/PaymentDTO';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Zahlung ausführen' })
  @ApiHeader({
    name: 'Transaction-Id',
    required: false,
    description: 'Eindeutige Kennung pro Auftrag (verhindert doppelte Zahlungen bei Retries)',
  })
  @ApiHeader({
    name: 'Simulate-Result',
    required: false,
    description: 'Nur für Tests: Erzwingt ein bestimmtes Ergebnis (success | decline | timeout | error)',
  })
  @ApiResponse({ status: 201, description: 'Zahlung erfolgreich', type: PaymentView })
  @ApiResponse({ status: 402, description: 'Zahlung abgelehnt', type: PaymentView })
  @ApiResponse({ status: 504, description: 'Timeout/Pending, bitte erneut senden', type: PaymentView })
  async create(
    @Body() dto: CreatePaymentDto,
    @Headers('Transaction-Id') transactionId?: string,
    @Headers('Simulate-Result') simulateResult?: string
  ): Promise<PaymentView> {
    const res = await this.svc.create(dto, transactionId, simulateResult);

    if (res.status === 'DECLINED') throw new HttpException(res, 402);
    if (res.status === 'ERROR') throw new HttpException(res, 502);
    if (res.status === 'PENDING') throw new HttpException({ ...res, hint: 'Retry with same Transaction-Id' }, 504);

    return res;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Payment-Status abrufen' })
  @ApiParam({ name: 'id', example: 'pay_1234-5678' })
  @ApiResponse({ status: 200, type: PaymentView })
  async get(@Param('id') id: string): Promise<PaymentView> {
    const res = await this.svc.get(id);
    if (!res) throw new HttpException('Not Found', 404);
    return res;
  }

  @Get('health')
  @ApiOperation({ summary: 'Healthcheck' })
  health() { return { status: 'ok' }; }
}
