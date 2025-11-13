import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

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
    const logDir = path.join(process.cwd(), 'log');
    this.logFilePath = path.join(logDir, 'log-file');

    console.log(`Log-Datei Pfad: ${this.logFilePath}`);

    if (!fs.existsSync(logDir)) {
      console.log(`Erstelle Log-Verzeichnis: ${logDir}`);
      fs.mkdirSync(logDir);
    }

    try {
      fs.appendFileSync(this.logFilePath, '--- Log-Service gestartet ---\n');
    } catch (error) {
      console.error('Konnte Log-Datei nicht initial schreiben', error);
    }
  }

  // Persistiert jeden eingehenden Logeintrag und bestätigt die RabbitMQ-Nachricht.
  @EventPattern('log_message')
  async handleLog(@Payload() data: LogPayload) {
    const logEntry = `${data.timestamp} [${data.service}] [${data.level.toUpperCase()}]: ${data.message}\n`;
    try {
      await fs.promises.appendFile(this.logFilePath, logEntry);

      const isTerminal =
        (data.service === 'WMS' && /abgeschlossen/i.test(data.message)) ||
        (data.service === 'OMS' &&
          (/storniert/i.test(data.message) || /fehlgeschlagen/i.test(data.message)));
      if (isTerminal) {
        await fs.promises.appendFile(this.logFilePath, '--------------------\n');
      }
    } catch (error) {
      console.error('Konnte nicht in Logfile schreiben', error);
    }
  }
}
