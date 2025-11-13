import { Type } from 'class-transformer';
import { IsArray, IsString, MinLength, ValidateNested, Matches } from 'class-validator';
import { ItemDto } from './ItemDTO';

// HTTP-Request-DTO für neue Orders mit Namen- und Artikelvalidierung.
export class CreateOrderRequestDto {
  @IsString()
  @MinLength(1)
  @Matches(/^[A-Za-zÄÖÜäöüß]+$/, {
    message: 'firstName darf nur Buchstaben und Umlaute enthalten',
  })
  firstName!: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[A-Za-zÄÖÜäöüß]+$/, {
    message: 'lastName darf nur Buchstaben und Umlaute enthalten',
  })
  lastName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}
