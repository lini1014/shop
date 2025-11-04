import { Module } from '@nestjs/common';
import { AppController } from './oms.controller';
import { AppService } from './oms.service';

@Module({
<<<<<<< HEAD
  imports: [], // ❌ kein ClientsModule, kein gRPC
=======
  imports: [],
>>>>>>> e7de925660a8b33c5e6c996b7c1932e141abb455
  controllers: [AppController],
  providers: [AppService],
})
export class OmsModule {}
