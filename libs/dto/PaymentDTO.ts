import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'DECLINED' | 'ERROR';

export class CreatePaymentDto {
  @ApiProperty({ example: 5001, description: 'Bestell-ID (numerisch, identisch zu CreateOrderDto.orderId)' })
  @IsNumber()
  @Min(1)
  orderId!: number;

  @ApiProperty({ example: 209.97, description: 'Gesamtbetrag (entspricht OrderDTO.totalAmount)' })
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional({ example: 209.97, description: 'Alias für totalAmount (legacy/kompatibel)' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  currency!: string;

  @ApiProperty({ enum: ['CARD', 'WALLET', 'INVOICE'], example: 'CARD', default: 'CARD' })
  @IsIn(['CARD', 'WALLET', 'INVOICE'])
  method!: 'CARD' | 'WALLET' | 'INVOICE';

  @ApiPropertyOptional({ example: 'tok_visa_4242' })
  @IsOptional()
  @IsString()
  cardToken?: string;
}

export class PaymentView {
  @ApiProperty() paymentId!: string;
  @ApiProperty({ example: 5001 }) orderId!: number;
  @ApiProperty({ enum: ['PENDING','SUCCEEDED','DECLINED','ERROR'] })
  status!: PaymentStatus;
  @ApiPropertyOptional() authCode?: string;
  @ApiProperty({ example: 'MockPay' }) provider!: string;
  @ApiProperty({ example: '2025-10-16T12:00:00.000Z' }) createdAt!: string;
  @ApiPropertyOptional() errorCode?: string;
  @ApiPropertyOptional() errorMessage?: string;
}
