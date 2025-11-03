import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  await app.listen(4000); // REST statt gRPC
  console.log('[inventory] http up on 4000');
}
bootstrap();
