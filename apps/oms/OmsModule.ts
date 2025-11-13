import { Module } from '@nestjs/common';
import { OmsController } from './OmsController';
import { OmsService } from './OmsService';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    ]),
  ],
  controllers: [OmsController],
  providers: [OmsService],
})
export class OmsModule {}
