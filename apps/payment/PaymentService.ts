import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePaymentDto, PaymentView, PaymentStatus } from './PaymentDto';
import amqplib from 'amqplib';

const LOG_PATH = path.resolve(process.cwd(), 'log', 'payment.log');
const ensureLog = () => fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

type CacheItem = { key: string; response: PaymentView };
const idemCache = new Map<string, CacheItem>();
const db = new Map<string, PaymentView>(); // In-Memory "DB"

function writeLog(line: string) {
  ensureLog();
  fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${line}\n`);
}

function decideOutcome(dto: CreatePaymentDto, forced?: string): PaymentStatus {
  if (forced === 'success') return 'SUCCEEDED';
  if (forced === 'decline') return 'DECLINED';
  if (forced === 'timeout') return 'PENDING';
  if (forced === 'error') return 'ERROR';

  const cents = Math.round((dto.amount % 1) * 100);
  if (cents === 13) return 'DECLINED';
  if (cents === 97) return 'PENDING'; // simuliert Timeout/Async
  return 'SUCCEEDED';
}

export class PaymentService {
  async create(dto: CreatePaymentDto, idemKey?: string, forced?: string): Promise<PaymentView> {
    if (idemKey && idemCache.has(idemKey)) {
      const cached = idemCache.get(idemKey)!.response;
      writeLog(`[IDEMPOTENT-HIT] order=${dto.orderId} paymentId=${cached.paymentId}`);
      return cached;
    }

    const paymentId = `pay_${randomUUID()}`;
    writeLog(`[CREATE-REQUEST] order=${dto.orderId} amount=${dto.amount} currency=${dto.currency} method=${dto.method}`);

    const status = decideOutcome(dto, forced);
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
        writeLog(`[APPROVED] order=${dto.orderId} paymentId=${paymentId} auth=${view.authCode}`);
        break;
      case 'DECLINED':
        view.errorCode = 'CARD_DECLINED';
        view.errorMessage = 'Payment method was declined.';
        writeLog(`[DECLINED] order=${dto.orderId} paymentId=${paymentId} code=${view.errorCode}`);
        break;
      case 'PENDING':
        writeLog(`[TIMEOUT/PENDING] order=${dto.orderId} paymentId=${paymentId} -> simulate retry by caller`);
        break;
      case 'ERROR':
        view.errorCode = 'PROVIDER_ERROR';
        view.errorMessage = 'Unexpected provider error.';
        writeLog(`[ERROR] order=${dto.orderId} paymentId=${paymentId}`);
        break;
    }

    db.set(paymentId, view);
    if (idemKey) idemCache.set(idemKey, { key: idemKey, response: view });

    // OPTIONAL: Event emitten, wenn ihr RabbitMQ nutzt (siehe unten).
    // await emitPaymentEvent(view);

    return view;
  }

  async get(paymentId: string): Promise<PaymentView | undefined> {
    return db.get(paymentId);
  }

  
}
async function emitPaymentEvent(view: PaymentView) {
  const conn = await amqplib.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672');
  const ch = await conn.createChannel();
  const exchange = 'shop.events';
  await ch.assertExchange(exchange, 'topic', { durable: true });
  const routingKey = `payment.${view.status.toLowerCase()}`; // z.B. payment.succeeded
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(view)), { contentType: 'application/json' });
  await ch.close();
  await conn.close();
}
