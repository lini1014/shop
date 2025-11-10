import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './InventoryModule';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);

  // Optional: Prefix für saubere URL-Struktur
  // -> Beispiel: http://localhost:3001/api/inventory/reservations
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Inventory-Service läuft auf http://localhost:${port}`);
}

bootstrap();
