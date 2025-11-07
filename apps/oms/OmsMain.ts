import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 👉 Hier wird deine App erstellt
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 👉 Swagger-Setup (API-Doku im Browser)
  const config = new DocumentBuilder()
    .setTitle('OMS Orchestrierung')
    .setDescription('IS → PS → WMS Demo-Endpunkte')
    .setVersion('1.0.0')
    .addTag('orders')
    .build();

  // 👉 Swagger-Dokument erzeugen
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 👉 App starten (HTTP-Server läuft jetzt)
  await app.listen(3000);
  console.log('✅ OMS läuft auf http://localhost:3000/api');
}

// 👉 "void" verhindert eine ESLint-Warnung, Promise wird bewusst nicht awaited
void bootstrap();
