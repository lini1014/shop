import { Controller, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from 'libs/dto/PaymentDTO';
import { PaymentService } from './PaymentService';
import { ClientProxy } from '@nestjs/microservices';

/**
 * REST-Entry-Point für Payment-Autorisierung inklusive Logging in RabbitMQ.
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentController implements OnModuleInit {
  constructor(
    private readonly service: PaymentService,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.logClient.connect();
  }

  /**
   * Kleiner Helper, damit Controller-Methoden einfach loggen können.
   */
  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'PAYMENT',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Autorisiert eine Bestellung und gibt nur den Erfolgsschalter zurück.
   */
  @Post('authorize')
  @ApiOperation({ summary: 'Nur Erfolg/Fehler zurückgeben' })
  authorize(@Body() dto: PaymentDto): { success: boolean } {
    this.log(
      'info',
      `Authorize angefragt: order=${dto.orderId} customer=${dto.firstName} ${dto.lastName} items=${dto.items?.length ?? 0}`,
    );
    const result = this.service.authorize(dto);
    if (result.success) {
      this.log(
        'info',
        `Authorize OK: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance}`,
      );
    } else {
      this.log(
        'warn',
        `Authorize FAIL: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance} reason=${result.reason}`,
      );
    }
    return { success: result.success };
  }
}
