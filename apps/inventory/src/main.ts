import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { InventoryModule } from './inventory.module';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);
  await app.listen(4000);
  console.log('[inventory] http up on 4000');

  const grpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: join(__dirname, '../proto/inventory.proto'),
      url: '0.0.0.0:50051',
    },
  });
  await app.startAllMicroservices();
  console.log('[inventory] gRPC up on 50051');
}
bootstrap();
