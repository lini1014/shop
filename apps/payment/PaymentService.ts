import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePaymentDto, PaymentView, PaymentStatus } from './PaymentDto';
import amqplib, { Connection, Channel } from 'amqplib';

const LOG_PATH = path.resolve(process.cwd(), 'log', 'central.log');
const ensureLog = () => fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

// ---------- AMQP Log Publisher (best effort, non-blocking) ----------
const SERVICE_NAME = process.env.SERVICE_NAME || 'payment';
const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';
const LOG_QUEUE = process.env.LOG_QUEUE || 'log_queue';

let amqpConn: Connection | null = null;
let amqpCh: Channel | null = null;
let connecting = false;

async function ensureAmqp(): Promise<Channel | null> {
  if (amqpCh) return amqpCh;
  if (connecting) return amqpCh; // parallel calls: einfach zurück
  try {
    connecting = true;
    amqpConn = await amqplib.connect(AMQP_URL);
    amqpCh = await amqpConn.createChannel();
    await amqpCh.assertQueue(LOG_QUEUE, { durable: true });
    amqpConn.on('close', () => { amqpCh = null; amqpConn = null; });
    amqpConn.on('error', () => { /* ignorieren, File-Log bleibt aktiv */ });
    return amqpCh;
  } catch {
    return null;
  } finally {
    connecting = false;
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

async function publishCentralLog(level: LogLevel, message: string, context?: Record<string, any>) {
  const payload = {
    service: SERVICE_NAME,
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  try {
    const ch = await ensureAmqp();
    // Nest RMQ @MessagePattern('log') erwartet header { pattern: 'log' }
    if (ch) ch.sendToQueue(LOG_QUEUE, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: true,
      headers: { pattern: 'log' },
    });
  } catch {
    // bewusst verschlucken – kein Einfluss auf Request-Flow
  }
}

// ---------- Lokales File-Logging + zentraler Publish ----------
function writeFileLog(line: string) {
  ensureLog();
  fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${line}\n`);
}

async function logInfo(line: string, ctx?: Record<string, any>)  { writeFileLog(line); await publishCentralLog('info',  line, ctx); }
async function logWarn(line: string, ctx?: Record<string, any>)  { writeFileLog(line); await publishCentralLog('warn',  line, ctx); }
async function logError(line: string, ctx?: Record<string, any>) { writeFileLog(line); await publishCentralLog('error', line, ctx); }
async function logDebug(line: string, ctx?: Record<string, any>) { writeFileLog(line); await publishCentralLog('debug', line, ctx); }

// ---------- Payment-Domain ----------
type CacheItem = { key: string; response: PaymentView };
const transactionCache = new Map<string, CacheItem>();
const db = new Map<string, PaymentView>(); // In-Memory "DB"

function decideOutcome(dto: CreatePaymentDto, simulateResult?: string): PaymentStatus {
  if (simulateResult === 'success') return 'SUCCEEDED';
  if (simulateResult === 'decline') return 'DECLINED';
  if (simulateResult === 'timeout') return 'PENDING';
  if (simulateResult === 'error') return 'ERROR';

  const cents = Math.round((dto.amount % 1) * 100);
  if (cents === 13) return 'DECLINED';
  if (cents === 97) return 'PENDING'; // simuliert Timeout/Async
  return 'SUCCEEDED';
}

export class PaymentService {
  async create(dto: CreatePaymentDto, transactionId?: string, simulateResult?: string): Promise<PaymentView> {
    if (transactionId && transactionCache.has(transactionId)) {
      const cached = transactionCache.get(transactionId)!.response;
      await logInfo(`[TX-HIT] order=${dto.orderId} paymentId=${cached.paymentId}`, { orderId: dto.orderId, paymentId: cached.paymentId });
      return cached;
    }

    const paymentId = `pay_${randomUUID()}`;
    await logInfo(`[CREATE-REQUEST] order=${dto.orderId} amount=${dto.amount} currency=${dto.currency} method=${dto.method}`, {
      orderId: dto.orderId, amount: dto.amount, currency: dto.currency, method: dto.method
    });

    const status = decideOutcome(dto, simulateResult);
    const view: PaymentView = {
      paymentId,
      orderId: dto.orderId,
      status,
      provider: 'MockPay',
      createdAt: new Date().toISOString(),
    };

    switch (status) {
      case 'SUCCEEDED':
        view.authCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await logInfo(`[APPROVED] order=${dto.orderId} paymentId=${paymentId} auth=${view.authCode}`, {
          orderId: dto.orderId, paymentId, auth: view.authCode
        });
        break;

      case 'DECLINED':
        view.errorCode = 'CARD_DECLINED';
        view.errorMessage = 'Payment method was declined.';
        await logWarn(`[DECLINED] order=${dto.orderId} paymentId=${paymentId} code=${view.errorCode}`, {
          orderId: dto.orderId, paymentId, code: view.errorCode
        });
        break;

      case 'PENDING':
        await logWarn(`[TIMEOUT/PENDING] order=${dto.orderId} paymentId=${paymentId} -> simulate retry by caller`, {
          orderId: dto.orderId, paymentId
        });
        break;

      case 'ERROR':
        view.errorCode = 'PROVIDER_ERROR';
        view.errorMessage = 'Unexpected provider error.';
        await logError(`[ERROR] order=${dto.orderId} paymentId=${paymentId}`, {
          orderId: dto.orderId, paymentId
        });
        break;
    }

    db.set(paymentId, view);
    if (transactionId) transactionCache.set(transactionId, { key: transactionId, response: view });

    // OPTIONAL: Domain-Event fürs Business
    // await emitPaymentEvent(view);

    return view;
  }

  async get(paymentId: string): Promise<PaymentView | undefined> {
    return db.get(paymentId);
  }
}

// ---- RabbitMQ Publisher für Business-Events (optional) ----
async function emitPaymentEvent(view: PaymentView) {
  const conn = await amqplib.connect(AMQP_URL);
  const ch = await conn.createChannel();
  const exchange = 'shop.events';
  await ch.assertExchange(exchange, 'topic', { durable: true });
  const routingKey = `payment.${view.status.toLowerCase()}`; // z.B. payment.succeeded
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(view)), { contentType: 'application/json', persistent: true });
  await ch.close();
  await conn.close();
}
