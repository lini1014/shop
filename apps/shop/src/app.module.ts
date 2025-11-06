// src/app.module.ts (oder das zentrale Modul deiner Wahl)
import { Module } from '@nestjs/common';
import { AlibiDbService } from './common/alibi-db.service';
// + deine anderen Module (OMS, Inventory, Payment, WMS)

@Module({
  imports: [
    // OMSModule, InventoryModule, PaymentModule, WmsModule, ...
  ],
  providers: [AlibiDbService],
  exports: [AlibiDbService],
})
export class AppModule {}
