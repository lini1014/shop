import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { OmsModule } from './oms.module'; // oder AppModule, aber konsistent

async function bootstrap() {
  const app = await NestFactory.create(OmsModule);
  await app.listen(3000);
  console.log('[oms] http up on 3000');
}
bootstrap();
