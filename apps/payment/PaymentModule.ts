import { Module } from '@nestjs/common';
import { PaymentController } from './PaymentController';
import { PaymentService } from './PaymentService';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
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
    ]),
  ],
})
export class PaymentModule {}
