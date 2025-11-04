import { Body, Controller, Post } from '@nestjs/common';

type CheckBody = { productId: string; quantity: number };

@Controller('inventory')
export class InventoryController {
  @Post('check')
  check(@Body() body: CheckBody) {
    const available = Number(body.quantity) <= 5;
    return { available };
  }
}
