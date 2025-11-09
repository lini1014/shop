// DTOs & Types
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'DECLINED' | 'ERROR';

export class CreatePaymentDto {
  orderId!: string;
  amount!: number;
  currency!: string; // 'EUR'
  method!: 'CARD' | 'WALLET' | 'INVOICE';
  cardToken?: string;
}

export class PaymentView {
  paymentId!: string;
  orderId!: string;
  status!: PaymentStatus;
  authCode?: string;
  provider!: string;
  createdAt!: string;
  errorCode?: string;
  errorMessage?: string;
}
