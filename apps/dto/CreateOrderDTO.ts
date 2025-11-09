import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { ItemDto } from './ItemDTO';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  orderId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

  @IsNumber()
  @Min(0)
  accountBalance!: number;
}
