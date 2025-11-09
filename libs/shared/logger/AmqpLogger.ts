import * as fs from 'fs';
import * as path from 'path';
import amqplib, { Connection, Channel } from 'amqplib';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEvent {
  ts: string;
  service: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

const SERVICE = process.env.SERVICE_NAME || 'unknown';
const LOG_PATH = path.resolve(process.cwd(), 'log', `${SERVICE}.log`);
const EXCHANGE = process.env.LOG_EXCHANGE || 'shop.logs';
const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';

let conn: Connection | null = null;
let ch: Channel | null = null;
let connecting = false;

function ensureFileDir() {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
}

async function ensureAmqp(): Promise<Channel | null> {
  if (ch) return ch;
  if (connecting) return ch;
  try {
    connecting = true;
    conn = await amqplib.connect(AMQP_URL);
    ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    conn.on('close', () => { ch = null; conn = null; });
    conn.on('error', () => {  });
    return ch;
  } catch {
    return null;
  } finally {
    connecting = false;
  }
}

export async function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const evt: LogEvent = {
    ts: new Date().toISOString(),
    service: SERVICE,
    level,
    message,
    context
  };

  ensureFileDir();
  fs.appendFileSync(LOG_PATH, `${evt.ts} [${SERVICE}] ${level.toUpperCase()} ${message}\n`);

  try {
    const channel = await ensureAmqp();
    if (channel) {
      const rk = `log.${SERVICE}.${level}`;
      channel.publish(EXCHANGE, rk, Buffer.from(JSON.stringify(evt)), {
        contentType: 'application/json',
        persistent: true
      });
    }
  } catch {
  }
}

export const logger = {
  debug: (msg: string, ctx?: any) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: any) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: any) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: any) => log('error', msg, ctx),
};
