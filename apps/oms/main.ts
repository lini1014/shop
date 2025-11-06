/// Datei um Swagger zu aktivieren.
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger-Setup
  const config = new DocumentBuilder()
    .setTitle('OMS Orchestrierung')
    .setDescription('IS → PS → WMS Demo-Endpunkte')
    .setVersion('1.0.0')
    .addTag('orders')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // UI unter http://localhost:3000/api

  await app.listen(3000);
}
bootstrap();

/// Kern um inventory als Server zu starten.