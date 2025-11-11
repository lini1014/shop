import { NestFactory } from '@nestjs/core';
import { WmsModule } from './wms-modules';
import { Transport, RmqOptions } from '@nestjs/microservices';

async function bootstrap() {
  //*Erstellen von einem Microservice, der auf RabbitMQ hört
  const app = await NestFactory.createMicroservice<RmqOptions>(WmsModule, {
    transport: Transport.RMQ,
    options: {
      //*URL zu dem RabbitMQ Server
      urls: ['amqp://guest:guest@127.0.0.1:5672'],
      /** Das stellt den "Funkkanal" dar, auf dem der WMS lauscht
       * Hierhin schickt das OMS Nachrichten */
      queue: 'wms_queue',
      queueOptions: {
        durable: false, //** wenn true, dann überlebt Queue den Server Neustart */
      },
    },
  });

  //*Starten des Microservices
  await app.listen();
  console.log('WMS Microservice hört zu...');
}
bootstrap();
