import { Module } from '@nestjs/common';
import { InventoryController } from './InventoryController';
import { InventoryService } from './InventoryService';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
