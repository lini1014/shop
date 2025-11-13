import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from 'libs/dto/PaymentDTO';
import { PaymentService } from './PaymentService';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(private readonly service: PaymentService) {}

  @Post('authorize')
  @ApiOperation({ summary: 'Nur Erfolg/Fehler zurückgeben' })
  authorize(@Body() dto: PaymentDto): { success: boolean } {
    this.logger.log(
      `Authorize angefragt: order=${dto.orderId} customer=${dto.firstName} ${dto.lastName} items=${dto.items?.length ?? 0}`,
    );
    const result = this.service.authorize(dto);

    if (result.success) {
      this.logger.log(
        `Authorize OK: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance}`,
      );
    } else {
      this.logger.warn(
        `Authorize FAIL: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance} reason=${result.reason}`,
      );
    }

    return { success: result.success };
  }
}
