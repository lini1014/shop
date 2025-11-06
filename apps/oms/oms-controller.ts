/// Controller simuliert die Postabfragen mithile Swagger und gibt die an Service weiter.
import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { OrchestrationService } from './orchestration.service';

@ApiTags('orders')
@Controller('orders/examples')
export class OrdersExamplesController {
  constructor(private readonly flow: OrchestrationService) {}

  @ApiOperation({ summary: 'Happy Path (IS ok → PS ok → WMS)' })
  @ApiOkResponse({ description: 'Order in progress' })
  @Post('happy')
  runHappy() { return this.flow.processScenario('happy'); }

  @ApiOperation({ summary: 'Out-of-Stock (IS fail)' })
  @ApiOkResponse({ description: 'Order cancelled at inventory' })
  @Post('out-of-stock')
  runOutOfStock() { return this.flow.processScenario('oos'); }

  @ApiOperation({ summary: 'Payment-Fail (PS fail → Release Reservation)' })
  @ApiOkResponse({ description: 'Order cancelled at payment' })
  @Post('payment-fail')
  runPaymentFail() { return this.flow.processScenario('payfail'); }
}
