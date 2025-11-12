import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

// Startet den OMS-HTTP-Server und richtet globale Pipes ein.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(3000);
  console.log('OMS läuft auf http://localhost:3000');
}

void bootstrap();
