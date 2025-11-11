import { Type } from 'class-transformer';
import { IsArray, IsNumber, Min, ValidateNested, IsString, MinLength } from 'class-validator';
import { ItemDto } from './ItemDTO';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  orderId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;
}
