import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { Channel, Message } from 'amqplib';

//*Definition einer Log-Nachricht
interface LogPayload {
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// Controller, der LogQueue-Nachrichten empfängt und verarbeitet.
@Controller()
export class LogService {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'log-file');

    console.log(`Log-Datei Pfad: ${this.logFilePath}`);
    try {
      fs.appendFileSync(this.logFilePath, '--- Log-Service gestartet ---\n');
    } catch (error) {
      console.error('Konnte Log-Datei nicht initial schreiben', error);
    }
  }

  // Persistiert jeden eingehenden Logeintrag und bestätigt die RabbitMQ-Nachricht.
  @EventPattern('log_message')
  async handleLog(@Payload() data: LogPayload, @Ctx() context: RmqContext) {
    const channel: Channel = context.getChannelRef();
    const originalMsg: Message = context.getMessage();
    const logEntry = `${data.timestamp} [${data.service}] [${data.level.toUpperCase()}]: ${data.message}\n`;
    try {
      await fs.promises.appendFile(this.logFilePath, logEntry);

      const isTerminal =
        (data.service === 'WMS' && /abgeschlossen/i.test(data.message)) ||
        (data.service === 'OMS' && (/storniert/i.test(data.message) || /fehlgeschlagen/i.test(data.message)));
      if (isTerminal) {
        await fs.promises.appendFile(this.logFilePath, '--------------------\n');
      }

      channel.ack(originalMsg);
    } catch (error) {
      console.error('Konnte nicht in Logfile schreiben', error);
      channel.nack(originalMsg, false, true);
    }
  }
}
