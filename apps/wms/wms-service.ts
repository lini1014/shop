/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/// kernlogik
import { Inject, OnModuleInit, Controller } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';

//* Aussehen einer Order-Nachricht (Beispiel)
interface OrderPayload {
  orderId: string;
  items: any[];
}

@Controller()
export class WmsService implements OnModuleInit {
  //* Hier werden die Sender (Clients) "injiziert" die wir in "wms-modules" definiert haben
  constructor(
    //* statusClient referenziert den WMS_StATUS_CLIENT Sender
    @Inject('WMS_STATUS_CLIENT') private readonly statusClient: ClientProxy,
    //* logClient referenziert den LOG_CLIENT Sender
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}

  //* Diese Methode wird aufgerufen, wenn der Service initialisiert wird

  async onModuleInit() {
    //* Sender (Clients) müssen sich aktiv verbinden, bevor sie 'emit' benutzen können
   try {
      
      await this.statusClient.connect();
      await this.logClient.connect();
      this.log('info', 'WMS verbunden mit Log-Service');
      
    } catch (error) {
      console.error('FEHLER: WMS konnte sich nicht verbinden', error);
      this.log('error', 'WMS konnte sich nicht mit RabbitMQ verbinden.');
    }
  }
  
  //* private Methode zum Kapseln vom Logging
  private log(level: 'info' | 'error' | 'warn', message: string) {
    //* Senden einer Nachricht an den Log-Service
    this.logClient.emit('log_message', {
      service: 'WMS',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  /** Empfänger:
   * Diese Methode wird automatisch aufgerufen, wenn eine Nachricht mit 'order_received' auf der 'wms_queue' eintrifft
   */
  @EventPattern('order_received')
  async handleOrderReceived(@Payload() data: OrderPayload, @Ctx() context: RmqContext) {
    
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prettier/prettier
    const channel : Channel = context.getChannelRef();
    const originalMsg : Message = context.getMessage();

    this.log('info', `Bestellung erhalten: ${data.orderId}`);

    try {
      //* Simulation der Haupt-Geschäftslogik

      //* Simulation von "Artikel auswählen"
      await this.sleep(2000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Artikel ausgewählt');
      this.log('info', `Artikel für Bestellung ${data.orderId} ausgewählt.`);

      //* Simulation von "Bestellung verpacken"
      await this.sleep(2000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Bestellung verpackt');
      this.log('info', `Bestellung ${data.orderId} verpackt.`);

      //* Simulation von "Bestellung versenden"
      await this.sleep(1000); // 1 Sekunde warten
      this.publishStatus(data.orderId, 'Bestellung versandt');
      this.log('info', `Bestellung ${data.orderId} versandt`);

      this.log('info', `Bestellung ${data.orderId} abgeschlossen.`);

      /** Erfolg: RabbitMQ wird weitergegeben, dass die Nachricht erfolgreich verarbeitet wurde und 
       * aus der Queue gelöscht werden kann */

      channel.ack(originalMsg);
    } catch (error) {
      this.log(
        'error',
        `Fehler bei der Verarbeitung der Bestellung ${data.orderId}:${error.message}`,
      );

      /** Fehler: RabbitMQ wird weitergegeben, dass ein Fehler aufgetreten ist */
      channel.nack(originalMsg, false, true);
    }
  }

  //* Sender-Methode
  private publishStatus(orderId: string, status: string) {
    const payload = { orderId, status, timestamp: new Date() };

    /** Wir senden Status-Nachricht an "status_update_queue"
     * "status_update" ist das Pattern der Nachricht
     */
    this.statusClient.emit('status_update', payload);
  }

  //* Eine simple Helfer-Funktion um zu warten 
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
