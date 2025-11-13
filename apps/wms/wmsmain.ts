import { NestFactory } from '@nestjs/core';
import { WmsModule } from './WmsModules';
import { Transport, RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  //*Erstellen von einem Microservice, der auf RabbitMQ hört
  const app = await NestFactory.createMicroservice<RmqOptions>(WmsModule, {
    transport: Transport.RMQ,
    options: {
      //*URL zu dem RabbitMQ Server
      urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
      queue: 'wms_queue',
      queueOptions: {
        durable: false,
      },
      noAck: false,
    },
  });

  //*Starten des Microservices
  await app.listen();
  console.log('WMS Microservice hört zu...');
}
void bootstrap();
