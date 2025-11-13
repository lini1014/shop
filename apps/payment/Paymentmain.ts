import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './PaymentModule';
import { ValidationPipe } from '@nestjs/common';

/**
 * Startet den Payment Microservice
 */
async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port, '0.0.0.0');
  console.log(`Payment Service running on port ${port}`);
}
void bootstrap();
