import { Module } from '@nestjs/common';
import { InventoryController } from './InventoryController';
import { InventoryService } from './InventoryService';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOG_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@127.0.0.1:5672'],
          queue: 'log_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
