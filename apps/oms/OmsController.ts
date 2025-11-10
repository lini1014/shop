// apps/oms/OmsController.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Logger } from '@nestjs/common';
import { OmsService } from './OmsService';
import { CreateOrderDto } from '../../libs/dto/CreateOrderDTO';

@Controller('orders')
export class OmsController {
  private readonly logger = new Logger(OmsController.name);
  constructor(private readonly omsService: OmsService) {}

  // POST /orders
  @Post()
  create(@Body() body: CreateOrderDto) {
    this.logger.log(
      `Forwarding order to service: orderId=${body.orderId}, items=${body.items?.length ?? 0}`,
    );
    return this.omsService.createOrderFromSelection(body);
  }

  // GET /orders/:id — Status der Order holen
  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.omsService.getOrderById(id);
  }
}
