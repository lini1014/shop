import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'DECLINED' | 'ERROR';

export class CreatePaymentDto {
  @ApiProperty({ example: 'ORD-2025-0001' })
  @IsString()
  orderId!: string;

  @ApiProperty({ example: 209.97 })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency!: string;

  @ApiProperty({ enum: ['CARD', 'WALLET', 'INVOICE'], example: 'CARD' })
  @IsIn(['CARD', 'WALLET', 'INVOICE'])
  method!: 'CARD' | 'WALLET' | 'INVOICE';

  @ApiPropertyOptional({ example: 'tok_visa_4242' })
  @IsOptional()
  @IsString()
  cardToken?: string;
}

export class PaymentView {
  @ApiProperty() paymentId!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty({ enum: ['PENDING','SUCCEEDED','DECLINED','ERROR'] })
  status!: PaymentStatus;
  @ApiPropertyOptional() authCode?: string;
  @ApiProperty({ example: 'MockPay' }) provider!: string;
  @ApiProperty({ example: '2025-10-16T12:00:00.000Z' }) createdAt!: string;
  @ApiPropertyOptional() errorCode?: string;
  @ApiPropertyOptional() errorMessage?: string;
}
