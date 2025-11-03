import { Module } from '@nestjs/common';
import { AppController } from './oms.controller';
import { AppService } from './oms.service';

@Module({
  imports: [], // ❌ kein ClientsModule, kein gRPC
  controllers: [AppController],
  providers: [AppService],
})
export class OmsModule {}
