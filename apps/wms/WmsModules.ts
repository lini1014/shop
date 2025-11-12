/* eslint-disable prettier/prettier */


import { Module } from '@nestjs/common';
import { WmsService } from './WmsService';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    /** Wir importieren hier das ClientsModule, damit das WMS Nachrichten
     * an andere Services senden kann */ 
    
    ClientsModule.register([
      {
        //* 1. Sender: Für Status-Updates (an das OMS)
        name: 'WMS_STATUS_CLIENT', 
        transport: Transport.RMQ,
        options: {
         /**Das ist die Ziel-Queue, an die dieser Client sendet
          * Ein anderer Service muss auf diese Queue hören */
          urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'], 
          queue: 'status_updates_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
          { 
            //* 2. Sender: Für Log-Nachrichten (an den Log Service)
            name: 'LOG_CLIENT', //* Implementieren des LogClients
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
