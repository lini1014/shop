/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/// kernlogik
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';

//* Aussehen einer Order-Nachricht (Beispiel)
interface OrderPayload {
  orderId: string;
  items: any[];
}

@Injectable()
export class WmsService implements OnModuleInit {
  //* Hier wird der Sender (Client) injiziert, der Status-Updates verschickt
  constructor(
    @Inject('WMS_STATUS_CLIENT') private readonly statusClient: ClientProxy,
    @Inject('LOG_CLIENT') private readonly logClient: ClientProxy,
  ) {}

  //* Diese Methode wird aufgerufen, wenn der Service initialisiert wird

  async onModuleInit() {
    //* Verbindung zum RabbitMQ-Server aufbauen
    await this.statusClient.connect();
    await this.logClient.connect();
    console.log('WMS Status Clients (Status und Log) verbunden');
  }
  //* private Methode zum Loggen
  private log(level: 'info' | 'error' | 'warn', message: string) {
    //* Senden eine Nachricht an den Log-Service
    this.logClient.emit('log_message', {
      service: 'WMS',
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  /** Empfänger:
   * Diese Methode reagiert automatisch auf Nachrichten
   * auf dem "wms_queue" Kanal
   */
  @MessagePattern('order_received')
  async handleOrderReceived(@Payload() data: OrderPayload, @Ctx() context: RmqContext) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prettier/prettier
    const channel: Channel = context.getChannelRef();
    const originalMsg: Message = context.getMessage();

    this.log('info', `[WMS] Bestellung erhalten: ${data.orderId}`);

    try {
      //* Simulation

      //* Simulation von "Item Picked"
      await this.sleep(2000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Artikel ausgewählt');
      this.log('info', `[WMS] Artikel für Bestellung ${data.orderId} ausgewählt.`);

      //* Simulation von "Order Packed"
      await this.sleep(2000); // 2 Sekunden warten
      this.publishStatus(data.orderId, 'Bestellung verpackt');
      this.log('info', `[WMS] Bestellung ${data.orderId} verpackt.`);

      //* Simulation von "Order Shipped"
      await this.sleep(1000); // 1 Sekunde warten
      this.publishStatus(data.orderId, 'Bestellung versandt');
      this.log('info', `[WMS] Bestellung ${data.orderId} versandt`);

      this.log('info', `[WMS] Bestellung ${data.orderId} abgeschlossen.`);

      //* Bestätigung an RabbitMQ, dass die Nachricht verarbeitet wurde, denn sonst wird sie erneut gesendet
      channel.ack(originalMsg);
    } catch (error) {
      this.log(
        'error',
        `[WMS] Fehler bei der Verarbeitung der Bestellung ${data.orderId}:${error.message}`,
      );

      //* Im Fehlerfall die Nachricht nicht bestätigen, damit sie erneut verarbeitet wird
      channel.nack(originalMsg, false, true);
    }
  }

  //* Sender-Methode
  private publishStatus(orderId: string, status: string) {
    const payload = { orderId, status, timestamp: new Date() };

    this.log('info', `[WMS] Sende Status-Update:${status} für Bestellung ${orderId}`);
    this.statusClient.emit('status_update', payload);

    /** Wir senden Status-Nachricht an "status_update_queue"
     * "status_update" ist das Pattern der Nachricht
     */
    this.statusClient.emit('status_update', payload);
  }

  //** Eine simple Helfer-Funktion um zu warten */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
