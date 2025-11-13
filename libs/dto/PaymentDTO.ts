import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ItemDto } from './ItemDTO';

// Beschreibt die Payment-spezifische Order-Payload inkl. Validierungsregeln.
export class PaymentDto {
  @IsInt()
  @Min(1000)
  @Max(1999)
  orderId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];

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
}
