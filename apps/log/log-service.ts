/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';
import type { Channel, Message } from 'amqplib';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  service: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

const CENTRAL_LOG = path.resolve(process.cwd(), 'log', 'central.log');

function append(line: string) {
  fs.mkdirSync(path.dirname(CENTRAL_LOG), { recursive: true });
  fs.appendFileSync(CENTRAL_LOG, line + '\n', 'utf-8');
}

@Injectable()
export class LogService {
  @MessagePattern('log') // <- Pattern für Client.emit('log', payload)
  handleLog(@Payload() payload: LogPayload, @Ctx() ctx: RmqContext) {
    const channel: Channel = ctx.getChannelRef();
    const originalMsg: Message = ctx.getMessage();

    try {
      const { service, level, message, timestamp, context } = payload ?? {};
      const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
      append(`${timestamp ?? new Date().toISOString()} [${service ?? 'unknown'}] ${String(level ?? 'info').toUpperCase()} ${message ?? ''}${ctxStr}`);
      channel.ack(originalMsg);
    } catch (err) {
      console.error('Konnte nicht in Logfile schreiben', err);
      channel.nack(originalMsg, false, true); // requeue
    }
  }
}
