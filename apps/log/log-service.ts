/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import { Channel, Message } from 'amqplib';

interface LogPayload {
  service: string; // Name des Dienstes, der die Log-Nachricht sendet
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string; 
}  

@Injectable()
export class LogService {
  private logFilePath: string;

  constructor() {

  const logDir = path.join(process.cwd(), 'log');
  this.logFilePath = path.join(logDir, 'log-file');

  console.log(`Log-Datei Pfad: ${this.logFilePath}`);

  if(!fs.existsSync(logDir)){
   console.log(`Erstelle Log-Verzeichnis: ${logDir}`);
   fs.mkdirSync(logDir);
  }
  try {
    fs.appendFileSync(this.logFilePath, '--- Log-Service gestartet ---\n');
  }
  catch(error) {
    console.error('Konnte Log-Datei nicht initial schreiben', error);
  }
 }
@MessagePattern('log_message')
async handleLog(@Payload() data: LogPayload, @Ctx() context: RmqContext) {
  const channel : Channel = context.getChannelRef();
  const originalMsg : Message = context.getMessage();

  const logEntry = `${data.timestamp} [${data.service}] [${data.level.toUpperCase()}]: ${data.message}\n`;
 
  try {

    await fs.promises.appendFile(this.logFilePath, logEntry);

    channel.ack(originalMsg);

  }
catch(error){
  console.error('Konnte nicht in Logfile schreiben', error);
  channel.nack(originalMsg, false, true);
}


}


}
