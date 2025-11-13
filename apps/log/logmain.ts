import { NestFactory } from '@nestjs/core';
import { Transport, RmqOptions } from '@nestjs/microservices';
import { LogModule } from './LogModule';
import { StatusModule } from './StatusModule';

// Startet beide RabbitMQ-Microservices (allgemeines Logging & WMS-Status).
async function bootstrap() {
  const logApp = await NestFactory.createMicroservice<RmqOptions>(LogModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
      queue: 'log_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  const wmsStatusApp = await NestFactory.createMicroservice<RmqOptions>(StatusModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
      queue: 'status_updates_queue',
      queueOptions: {
        durable: false,
      },
      noAck: false,
    },
  });

  await Promise.all([logApp.listen(), wmsStatusApp.listen()]);
  console.log('Logging Microservice gestartet');
  console.log('WMS Status gestartet');
}

void bootstrap();
