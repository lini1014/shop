import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePaymentDto, PaymentView, PaymentStatus } from '../dto/PaymentDTO';
import amqplib, { Connection, Channel } from 'amqplib';

const LOG_PATH = path.resolve(process.cwd(), 'log', 'payment.log');
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
  if (connecting) return amqpCh;
  try {
    connecting = true;
    amqpConn = await amqplib.connect(AMQP_URL);
    amqpCh = await amqpConn.createChannel();
    await amqpCh.assertQueue(LOG_QUEUE, { durable: true });
    amqpConn.on('close', () => { amqpCh = null; amqpConn = null; });
    amqpConn.on('error', () => { /* noop */ });
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
    if (ch) ch.sendToQueue(LOG_QUEUE, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: true,
      headers: { pattern: 'log' },
    });
  } catch { }
}

function writeFileLog(line: string) {
  ensureLog();
  fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${line}\n`);
}

async function logInfo(line: string, ctx?: Record<string, any>)  { writeFileLog(line); await publishCentralLog('info',  line, ctx); }
async function logWarn(line: string, ctx?: Record<string, any>)  { writeFileLog(line); await publishCentralLog('warn',  line, ctx); }
async function logError(line: string, ctx?: Record<string, any>) { writeFileLog(line); await publishCentralLog('error', line, ctx); }

type CacheItem = { key: string; response: PaymentView };
const transactionCache = new Map<string, CacheItem>();
const db = new Map<string, PaymentView>(); // In-Memory "DB"

function decideOutcome(dto: CreatePaymentDto, simulateResult?: string): PaymentStatus {
  if (simulateResult === 'success') return 'SUCCEEDED';
  if (simulateResult === 'decline') return 'DECLINED';
  if (simulateResult === 'timeout') return 'PENDING';
  if (simulateResult === 'error') return 'ERROR';

  const cents = Math.round((dto.totalAmount % 1) * 100);
  if (cents === 13) return 'DECLINED';
  if (cents === 97) return 'PENDING';
  return 'SUCCEEDED';
}

export class PaymentService {
  async create(dto: CreatePaymentDto, transactionId?: string, simulateResult?: string): Promise<PaymentView> {
    if ((dto as any).amount != null && (dto as any).totalAmount == null) {
      (dto as any).totalAmount = (dto as any).amount;
    }

    if (transactionId && transactionCache.has(transactionId)) {
      const cached = transactionCache.get(transactionId)!.response;
      await logInfo(`[TX-HIT] order=${dto.orderId} paymentId=${cached.paymentId}`, { orderId: dto.orderId, paymentId: cached.paymentId });
      return cached;
    }

    const paymentId = `pay_${randomUUID()}`;
    await logInfo(`[CREATE-REQUEST] order=${dto.orderId} total=${dto.totalAmount} currency=${dto.currency} method=${dto.method}`,
      { orderId: dto.orderId, totalAmount: dto.totalAmount, currency: dto.currency, method: dto.method });

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
        await logInfo(`[APPROVED] order=${dto.orderId} paymentId=${paymentId} auth=${view.authCode}`,
          { orderId: dto.orderId, paymentId, auth: view.authCode });
        break;

      case 'DECLINED':
        view.errorCode = 'CARD_DECLINED';
        view.errorMessage = 'Payment method was declined.';
        await logWarn(`[DECLINED] order=${dto.orderId} paymentId=${paymentId} code=${view.errorCode}`,
          { orderId: dto.orderId, paymentId, code: view.errorCode });
        break;

      case 'PENDING':
        await logWarn(`[TIMEOUT/PENDING] order=${dto.orderId} paymentId=${paymentId} -> simulate retry by caller`,
          { orderId: dto.orderId, paymentId });
        break;

      case 'ERROR':
        view.errorCode = 'PROVIDER_ERROR';
        view.errorMessage = 'Unexpected provider error.';
        await logError(`[ERROR] order=${dto.orderId} paymentId=${paymentId}`,
          { orderId: dto.orderId, paymentId });
        break;
    }

    db.set(paymentId, view);
    if (transactionId) transactionCache.set(transactionId, { key: transactionId, response: view });

    if (view.status === 'SUCCEEDED') {
      await emitPaymentEvent(view); 
    }
    await emitPaymentEvent(view);

    return view;
  }

  async get(paymentId: string): Promise<PaymentView | undefined> {
    return db.get(paymentId);
  }
}

async function emitPaymentEvent(view: PaymentView) {
  const conn = await amqplib.connect(AMQP_URL);
  const ch = await conn.createChannel();
  const exchange = 'shop.events';
  await ch.assertExchange(exchange, 'topic', { durable: true });
  const routingKey = `payment.${view.status.toLowerCase()}`;
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(view)),
    { contentType: 'application/json', persistent: true });
  await ch.close();
  await conn.close();
}
