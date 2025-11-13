import { IsNumber, Min, IsIn, IsInt } from 'class-validator';

// Transportiert zulässige Artikel-IDs samt Mindestmengen fürs OMS.
export class ItemDto {
  @IsNumber()
  @IsIn([101, 102, 103], {
    message: 'productId muss 101, 102 oder 103 sein',
  })
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
