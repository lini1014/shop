import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './PaymentModule';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, { cors: true });

  // Validation für DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Shop Payment Service')
    .setDescription('API für Zahlungen inkl. Idempotenz & Test-Headern')
    .setVersion('1.0.0')
    .addServer('http://localhost:3003', 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document, {
    swaggerOptions: { persistAuthorization: true }
  });

  const port = Number(process.env.PORT ?? 3003);
  await app.listen(port, '0.0.0.0');
  console.log(`Payment Service running on port ${port} — Swagger: http://localhost:${port}/docs`);
}
bootstrap();
