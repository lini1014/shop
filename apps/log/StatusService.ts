import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

interface StatusPayload {
  orderId: string;
  status: string;
  timestamp?: string | Date;
}

// statusservice nimmt die status_update events entgegen und persistiert sie in log/wms-status,
// damit oms die neuesten wms-meldungen unabhängig vom allgemeinen log einlesen kann
@Controller()
export class StatusService {
  private readonly statusFilePath: string;

  constructor() {
    const logDir = path.join(process.cwd(), 'log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.statusFilePath = path.join(logDir, 'wms-status');
  }

  @EventPattern('status_update')
  async handleStatus(@Payload() payload: StatusPayload) {
    try {
      const timestamp =
        typeof payload.timestamp === 'string'
          ? payload.timestamp
          : new Date(payload.timestamp ?? new Date()).toISOString();
      const entry = `${timestamp};${payload.orderId};${payload.status}\n`;
      await fs.promises.appendFile(this.statusFilePath, entry);
    } catch (error) {
      console.error('Konnte WMS-Status nicht persistieren', error);
    }
  }
}
