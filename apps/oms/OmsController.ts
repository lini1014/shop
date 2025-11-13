import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { OmsService } from './OmsService';
import { CreateOrderRequestDto } from '../../libs/dto/CreateOrderRequestDto';
import { ClientProxy } from '@nestjs/microservices';

// REST-Einstiegspunkt, der die OMS-Bestellfunktionen nach außen bereitstellt.
@Controller('orders')
export class OmsController implements OnModuleInit {
  constructor(
    private readonly omsService: OmsService,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}
  async onModuleInit() {
    await this.logClient.connect();
  }

  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'OMS',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  // POST /orders
  @Post()
  async create(@Body() body: CreateOrderRequestDto) {
    this.log(
      'info',
      `Bestellung weiterleiten an Service: firstName=${body.firstName}, lastName=${body.lastName}, items=${body.items?.length ?? 0}`,
    );
    const order = await this.omsService.createOrderFromSelection(body);
    return { id: order.id, status: order.status };
  }

  // GET /orders/:id — Status der Order holen
  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.omsService.getOrderById(id);
  }
}
