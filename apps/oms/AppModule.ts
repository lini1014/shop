import { Module } from '@nestjs/common';
import { OmsController } from './OmsController';
import { OmsService } from './OmsService';

@Module({
  imports: [], // später: ConfigModule, Logger usw.
  controllers: [OmsController], // deine Endpunkte (happy / oos / payfail)
  providers: [OmsService], // Orchestrierung IS -> PS -> WMS
})
export class AppModule {}
