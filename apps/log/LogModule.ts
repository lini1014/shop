import { Module } from '@nestjs/common';
import { LogService } from './LogService';

@Module({
  imports: [],
  providers: [],
  controllers: [LogService],
})
export class LogModule {}
