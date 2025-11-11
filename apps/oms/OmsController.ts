// apps/oms/OmsController.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Logger } from '@nestjs/common';
import { OmsService } from './OmsService';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';

@Controller('orders')
export class OmsController {
  private readonly logger = new Logger(OmsController.name);
  constructor(private readonly omsService: OmsService) {}

  // POST /orders
  @Post()
  async create(@Body() body: CreateOrderRequestDto) {
    this.logger.log(
      `Forwarding order to service: firstName=${body.firstName}, lastName=${body.lastName}, items=${body.items?.length ?? 0}`,
    );
    const order = await this.omsService.createOrderFromSelection(body);
    return { status: order.status };
  }

  // GET /orders/:id — Status der Order holen
  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.omsService.getOrderById(id);
  }
}
