import { IsNumber, Min } from 'class-validator';

// OMS führt keine Preis-/Namenslogik. Nur IDs und Mengen.
export class ItemDto {
  @IsNumber()
  @Min(1)
  productId!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;
}
