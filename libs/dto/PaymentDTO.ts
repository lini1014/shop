import { IsNumber, Min } from 'class-validator';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'DECLINED' | 'ERROR';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  orderId!: number;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class PaymentView {
  paymentId!: string;
  orderId!: number;
  status!: PaymentStatus;
  createdAt!: string;
  errorMessage?: string;
}
