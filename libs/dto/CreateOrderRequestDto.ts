import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { ItemDto } from './ItemDTO';

export class CreateOrderRequestDto {
  @IsNumber()
  @Min(1)
  orderId!: number;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}
