import { NestFactory } from '@nestjs/core';
import { LogModule } from './log-module';
import { Transport, RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  //* Erstellt den Log-Microservice
  const app = await NestFactory.createMicroservice<RmqOptions>(LogModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
      //* Hier wird der Kanal definiert, auf den der Log-Service hört
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
