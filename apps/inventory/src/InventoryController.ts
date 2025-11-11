import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InventoryService } from './InventoryService';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly service: InventoryService) {}

  // Accept both shapes: {sku, qty}[] and {productId, quantity}[]
  private normalizeItems(items: any[]): { sku: string; qty: number }[] {
    const productToSku: Record<number, string> = {
      101: 'SKU-123',
      102: 'SKU-456',
      103: 'SKU-789',
    };
    return (items || [])
      .map((it) => {
        if (it && it.sku !== undefined && it.qty !== undefined) {
          return { sku: String(it.sku), qty: Number(it.qty) };
        }
        if (it && it.productId !== undefined && it.quantity !== undefined) {
          const sku = productToSku[Number(it.productId)];
          return { sku: sku ?? String(it.productId), qty: Number(it.quantity) };
        }
        return null;
      })
      .filter((x): x is { sku: string; qty: number } => !!x && Number.isFinite(x.qty));
  }

  /**
   * POST /inventory/reservations
   * Reserviert Bestand für eine Bestellung (Step 1 in OMS)
   */
  @Post('reservations')
  async reserveStock(@Body() body: { orderId: number; items: any[] }) {
    this.logger.log(`Reservierung für Order ${body.orderId}`);
    const normalized = this.normalizeItems(body.items);
    const reservationId = await this.service.reserveStock(normalized);
    if (!reservationId) {
      return { ok: false, reason: 'OUT_OF_STOCK' };
    }
    return { ok: true, reservationId };
  }

  /**
   * POST /inventory/reservations/release
   * Reservierung wieder freigeben (bei Payment-Fehler)
   */
  @Post('reservations/release')
  async releaseReservation(@Body() body: { reservationId: string }) {
    this.logger.warn(`Release Reservation ${body.reservationId}`);
    const ok = await this.service.releaseReservation(body.reservationId);
    return { ok };
  }
}
