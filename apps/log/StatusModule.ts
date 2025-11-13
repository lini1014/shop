import { Module } from '@nestjs/common';
import { StatusService } from './StatusService';

// statusmodule kapselt den microservice, der die wms-status events konsumiert
@Module({
  controllers: [StatusService],
})
export class StatusModule {}
