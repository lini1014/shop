import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './PaymentModule';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('Payment API')
    .setDescription(
      'Zahlungen inkl. Idempotenz (Transaction-Id), Test-Header (Simulate-Result) & Events',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3003', 'Local')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, doc, { swaggerOptions: { persistAuthorization: true } });

  const port = Number(process.env.PORT ?? 3003);
  await app.listen(port, '0.0.0.0');
  console.log(`Payment Service running on port ${port} — Swagger: http://localhost:${port}/docs`);
}
bootstrap();
