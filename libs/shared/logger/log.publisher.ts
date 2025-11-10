import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let client: ClientProxy | null = null;

function getClient(): ClientProxy {
  if (!client) {
    client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'],
        queue: 'log_queue',
        queueOptions: { durable: true },
      },
    });
  }
  return client;
}

export async function publishLog(level: LogLevel, message: string, context?: Record<string, any>) {
  const payload = {
    service: process.env.SERVICE_NAME || 'unknown',
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  // Fire-and-forget: emit -> @MessagePattern('log')
  await getClient().emit('log', payload).toPromise();
}

// Convenience
export const logClient = {
  debug: (m: string, c?: any) => publishLog('debug', m, c),
  info: (m: string, c?: any) => publishLog('info', m, c),
  warn: (m: string, c?: any) => publishLog('warn', m, c),
  error: (m: string, c?: any) => publishLog('error', m, c),
};
