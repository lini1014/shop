import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { ItemDto } from './ItemDTO';

export class CreateOrderDto {
  @ApiProperty({ example: 5001, description: 'Bestell-ID' })
  @IsNumber()
  @Min(1)
  orderId!: number;

  @ApiProperty({ type: [ItemDto], description: 'Artikel im Warenkorb' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}
