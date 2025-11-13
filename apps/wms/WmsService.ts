import { Inject, OnModuleInit, Controller } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';

//* Aussehen einer Order-Nachricht (Beispiel)
interface OrderPayload {
  orderId: string;
  items: any[];
}

@Controller()
export class WmsService implements OnModuleInit {
  constructor(
    @Inject('WMS_STATUS_CLIENT') private readonly statusClient: ClientProxy,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}

  async onModuleInit() {
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
  @MessagePattern('order_received')
  async handleOrderReceived(@Payload() data: OrderPayload, @Ctx() context: RmqContext) {
    const channel: Channel = context.getChannelRef();

    const originalMsg: Message = context.getMessage();

    this.log('info', `Bestellung erhalten: ${data.orderId}`);

    try {
      //* Simulation der Haupt-Geschäftslogik

      //* Simulation von "Artikel auswählen"
      await this.sleep(10000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Artikel ausgewählt');
      this.log('info', `Artikel für Bestellung ${data.orderId} ausgewählt.`);

      //* Simulation von "Bestellung verpacken"
      await this.sleep(10000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Bestellung verpackt');
      this.log('info', `Bestellung ${data.orderId} verpackt.`);

      //* Simulation von "Bestellung versenden"
      await this.sleep(10000); // 1 Sekunde warten
      this.publishStatus(data.orderId, 'Bestellung versandt');
      this.log('info', `Bestellung ${data.orderId} versandt`);
      await this.sleep(1000); // 0.5 Sekunden warten
      this.log('info', `Bestellung ${data.orderId} abgeschlossen.`);

      /** Erfolg: RabbitMQ wird weitergegeben, dass die Nachricht erfolgreich verarbeitet wurde und
       * aus der Queue gelöscht werden kann */

      channel.ack(originalMsg);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(
        'error',
        `Fehler bei der Verarbeitung der Bestellung ${data.orderId}:${errorMessage}`,
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
