import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

interface LogPayload { 
    service: string; // Name des Dienstes, der die Log-Nachricht sendet
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

@Injectable()
export class LogService {
      private LogFilePath: string;

      constructor(){
        /** Bauen des Pfades zur Log-Datei
         * __dirname geht zum "dist" Ordner, also geht man hier 3 Ebenen zurück zum "apps" Ordner
         */
        this.LogFilePath = path.join(__dirname, '..','..','..', 'log', 'log-file');
        console.log(`Log-Datei Pfad: ${this.LogFilePath}`);

        //* Initialisieren der Log-Datei, falls sie nicht existiert
        fs.promises.writeFile(this.LogFilePath, '', { flag: 'a'});
      }
    
      @MessagePattern('log_message') //* Alle Services senden Log-Nachrichten an dieses Pattern
      async handleLog(@Payload() data: LogPayload, @Ctx() context: RmqContext){
        const channel = context.getChannelRef();
        const originalMsg = context. getMessage();

        const logEntry = '${data.timestamp} [${data.service}] [${data.level.toUpperCase()}]: ${data.message}\n';

        try {
            //* Anhängen der Log-Nachricht an die Log-Datei
            await fs.promises.appendFile(this.LogFilePath, logEntry);

            //* Bestätigen der Nachricht, damit sie aus der Warteschlange entfernt wird
            channel
        }
        catch (error) {
            //* Im Fehlerfall die Nachricht nicht bestätigen, damit sie erneut verarbeitet werden kann
            channel.nack(originalMsg, false, true);
        }
      }
}