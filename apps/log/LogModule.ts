import { Module } from '@nestjs/common';
import { LogService } from './LogService';

// Stellt den Nest-Microservice für eingehende Log-Events bereit.
@Module({
  imports: [],
  providers: [],
  controllers: [LogService],
})
export class LogModule {}
