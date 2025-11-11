import { Module } from '@nestjs/common';
import { LogService } from './log-service';

@Module({
  imports: [],
  providers: [],
  controllers: [LogService],
})
export class LogModule {}
