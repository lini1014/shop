/* eslint-disable prettier/prettier */
// In NestJS ist ein Modul (immer mit @Module() markiert) so etwas wie ein „Container“,
//der alle Teile dieses einen Services bündelt.

//Beim WMS besteht dein Service z. B. aus:

//einer Klasse, die auf RabbitMQ-Nachrichten reagiert (→ WmsSimService)

//eventuell weiteren Helper-Services

//evtl. Logger, Config usw.

//Das Modul sagt also Nest:

//"Wenn ich starte, hier sind meine Provider (z. B. Services),
//und so ist mein Service zusammengesetzt."

import { Module } from '@nestjs/common';
import { WmsService } from './wms-service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    //*Das Modul stellt Sender (also: den Client) bereit
    ClientsModule.register([
      {
        name: 'WMS_STATUS_CLIENT', //*Ein Name, mit der ein Service geholt wird
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          /**Der "Funkkanal", auf dem der Status gesendet wird
           *Logging muss hier zuhören*/
          queue: 'status_updates_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
          { 
            name: 'LOG_CLIENT', //* Implementieren des LogClients
          transport: Transport.RMQ,
          options: {
            urls: ['amqp://guest:guest@localhost:5672'],
            queue: 'log_queue',
            queueOptions: {
              durable: true,
            },
          },
        },
    ]),
  ],
  providers: [WmsService] /** Service, der die Logik enthält */,
  controllers: [],
}) /** Da wir nicht auf HTTP Anfragen reagieren, brauchen wir auch keinen Controller  */
export class WmsModule {}
