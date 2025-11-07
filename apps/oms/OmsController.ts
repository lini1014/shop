// apps/oms/OmsController.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OmsService } from './OmsService';
import { CreateOrderDto } from '../dto/CreateOrderDTO';
import { OrderDto } from '../dto/OrderDTO';

@ApiTags('orders')
@Controller('orders')
export class OmsController {
  constructor(private readonly omsService: OmsService) {}

  // ========= Realistische APIs =========

  @Post()
  @ApiOperation({ summary: 'Neue Bestellung anlegen und Workflow starten' })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      sample: {
        value: {
          orderId: 5001,
          items: [
            { productId: 101, name: 'Bluetooth-Kopfhörer', quantity: 1, unitPrice: 29.99 },
            { productId: 102, name: 'USB-C Kabel', quantity: 2, unitPrice: 9.99 }.
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Bestellung angenommen', type: OrderDto })
  createOrder(@Body() body: CreateOrderDto) {
    return this.omsService.createOrder(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bestellung nach ID abrufen' })
  @ApiParam({ name: 'id', schema: { type: 'integer' }, example: 5001 })
  @ApiOkResponse({ description: 'Bestelldaten', type: OrderDto })
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.omsService.getOrderById(id);
  }

  // ========= Demo-Szenarien =========

  @Post('examples/happy')
  @ApiOperation({ summary: 'Happy Path (IS ok → PS ok → WMS)' })
  @ApiOkResponse({ description: 'Order in progress' })
  happyScenario() {
    return this.omsService.processScenario('happy');
  }

  @Post('examples/out-of-stock')
  @ApiOperation({ summary: 'Out-of-Stock (IS fail)' })
  @ApiOkResponse({ description: 'Order cancelled at inventory' })
  outOfStockScenario() {
    return this.omsService.processScenario('oos');
  }

  @Post('examples/payment-fail')
  @ApiOperation({ summary: 'Payment-Fail (PS fail → Release Reservation)' })
  @ApiOkResponse({ description: 'Order cancelled at payment' })
  paymentFailScenario() {
    return this.omsService.processScenario('payfail');
  }
}
