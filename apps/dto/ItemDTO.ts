import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class ItemDto {
  @ApiProperty({ example: 101, description: 'Artikel-ID (nur Zahl)' })
  @IsNumber()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 'Bluetooth-Kopfhörer', description: 'Artikelname' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'Menge' })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 19.99, minimum: 0, description: 'Einzelpreis (EUR)' })
  @IsNumber()
  @Min(0)
  unitPrice!: number; // Preis pro Stück
}
