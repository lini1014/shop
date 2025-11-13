import { NestFactory } from '@nestjs/core';
import { LogModule } from './LogModule';
import { Transport, RmqOptions } from '@nestjs/microservices';

// Startet den Log-Microservice, der RabbitMQ-Logevents verarbeitet.
async function bootstrap() {
  const app = await NestFactory.createMicroservice<RmqOptions>(LogModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
      queue: 'log_queue',
      queueOptions: {
        durable: true, //
      },
      noAck: false,
    },
  });
  await app.listen();
  console.log('Logging Microservice gestartet');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
