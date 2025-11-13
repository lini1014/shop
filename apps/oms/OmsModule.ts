import { Module } from '@nestjs/common';
import { OmsController } from './OmsController';
import { OmsService } from './OmsService';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';

// Bündelt Controller, Service und Messaging-Clients des OMS.
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOG_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
          queue: 'log_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'WMS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
          queue: 'wms_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'INVENTORY_GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'inventory',
          protoPath: path.join(process.cwd(), 'proto', 'inventory.proto'),
          url: process.env.INVENTORY_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [OmsController],
  providers: [OmsService],
})
export class OmsModule {}
