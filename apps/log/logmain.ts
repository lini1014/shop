import { NestFactory } from '@nestjs/core';
import { LogModule } from './log-module';
import { Transport, RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<RmqOptions>(LogModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@127.0.0.1:5672'],
      //* Hier wird der Kanal für den Log-Service definiert
      queue: 'log_queue',
      queueOptions: {
        durable: true, //
      },
    },
  });
  await app.listen();
  console.log('Logging Microservice gestartet');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
