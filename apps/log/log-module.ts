import { Module } from '@nestjs/common';
import { LogService } from './log-service';

@Module({
  imports: [],
  providers: [LogService],
  controllers: [],
})
export class LogModule {}
