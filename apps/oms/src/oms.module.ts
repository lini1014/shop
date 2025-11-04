import { Module } from '@nestjs/common';
import { AppController } from './oms.controller';
import { AppService } from './oms.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class OmsModule {}
