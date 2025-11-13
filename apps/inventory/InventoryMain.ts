import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { InventoryModule } from './InventoryModule';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryModule, {
    transport: Transport.GRPC,
    options: {
      package: 'inventory',
      protoPath: path.join(process.cwd(), 'proto', 'inventory.proto'),
      url: process.env.INVENTORY_GRPC_URL || '0.0.0.0:50051',
    },
  });

  await app.listen();
  console.log(`Inventory gRPC-Service laeuft auf ${
    process.env.INVENTORY_GRPC_URL || '0.0.0.0:50051'
  }`);
}

void bootstrap();
