import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './oms.service'; // <- Pfad korrigiert

@Controller('orders')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  createOrder(@Body() order: any) {
    return this.appService.handleOrder(order);
  }
}
