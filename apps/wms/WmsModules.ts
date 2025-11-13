import { Module } from '@nestjs/common';
import { WmsService } from './WmsService';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        //* 1. Sender: Für Status-Updates (an das OMS)
        name: 'WMS_STATUS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
          queue: 'status_updates_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        //* 2. Sender: Für Log-Nachrichten (an den Log Service)
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
    ]),
  ],
  providers: [],
  controllers: [WmsService],
})
export class WmsModule {}
