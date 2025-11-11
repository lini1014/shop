import { Injectable, BadRequestException } from '@nestjs/common';
import { ItemDto } from 'libs/dto/ItemDTO';
import { CreateOrderDto } from 'libs/dto/CreateOrderDTO';
import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
export interface PaymentResult {
  orderId: number;
  success: boolean;
  totalAmount: number;
  accountBalance: number;
  reason?: string;
  lineItems: Array<{ productId: number; unitPrice: number; quantity: number; lineTotal: number }>;
}

type Catalog = Record<number, number>;

@Injectable()
export class PaymentService implements OnModuleInit {
  constructor(@Inject('LOG_CLIENT') private readonly logClient: ClientProxy) {}

  async onModuleInit() {
    await this.logClient.connect();
    this.log('info', 'Payment Service verbunden mit Log-Service');
  }

  private log(level: 'info' | 'error' | 'warn', message: string) {
    this.logClient.emit('log_message', {
      service: 'PAYMENT', 
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Demo-Kundenkonto-Datenbank: Vor- und Nachname -> Guthaben
  private readonly customerBalances: Record<string, number> = {
    'niklas osimhen': 200.0,
    'maxi icardi': 4.2,
    'david ederson': 200.0,
    'emirhan aktürkoğlu': 200.0,
  };

  private readonly catalog: Catalog = {
    101: 7.0,
    102: 60.0,
    103: 9.77,
  };

  getPrice(productId: number): number {
    const price = this.catalog[productId];
    if (price === undefined) {
      this.log('error', `Unbekannte productId ${productId} im Katalog.`);
    throw new BadRequestException(`Unknown productId ${productId}`);
    }
    return price;
  }

  priceItems(items: ItemDto[]) {
    return items.map((it) => {
      const unitPrice = this.getPrice(it.productId);
      const lineTotal = +(unitPrice * it.quantity).toFixed(2);
      return { productId: it.productId, unitPrice, quantity: it.quantity, lineTotal };
    });
  }

  computeTotal(items: ItemDto[]): number {
    const priced = this.priceItems(items);
    const total = priced.reduce((sum, li) => sum + li.lineTotal, 0);
    return +total.toFixed(2);
  }

  /**
   * Prüft, ob das Konto-Guthaben reicht und gibt das Ergebnis zurück.
   */
  authorize(create: CreateOrderDto): PaymentResult {
    this.log(
      'info',
      `AUTH START order=${create.orderId} customer=${create.firstName} ${create.lastName} items=${create.items?.length ?? 0}`,
    );
    const normalize = (s: string) => s.trim().toLowerCase();
    const fullKey = `${normalize(create.firstName)} ${normalize(create.lastName)}`;
    const accountBalance = this.customerBalances[fullKey];

    if (accountBalance === undefined) {
      this.log('warn', `Kunde ${fullKey} nicht in der Datenbank gefunden.`)
      throw new BadRequestException(`UNKNOWN_CUSTOMER: ${create.firstName} ${create.lastName}`);
    }

    const lineItems = this.priceItems(create.items);
    const totalAmount = lineItems.reduce((s, li) => s + li.lineTotal, 0);
    const total = +totalAmount.toFixed(2);
    const liSummary = lineItems
      .map((li) => `${li.productId}x${li.quantity}@${li.unitPrice}=${li.lineTotal}`)
      .join(', ');
    this.log(
      'info',
      `AUTH PRICED order=${create.orderId} total=${total} items=[${liSummary}]`,
    );

    const success = accountBalance >= total;
    this.log(
      'info',
      `AUTH DECISION order=${create.orderId} ${success ? 'SUCCEED' : 'FAIL'} total=${total} balance=${accountBalance}`,
    );

    const res: PaymentResult = {
      orderId: create.orderId,
      success,
      totalAmount: total,
      accountBalance,
      lineItems,
      reason: success ? undefined : 'INSUFFICIENT_FUNDS',
    };
    if(success){
      this.log('info', `Zahlung für Order ${create.orderId} (Betrag: ${total}) ERFOLGREICH.`);
     } else {
      this.log('warn', `Zahlung für Order ${create.orderId} (Betrag: ${total}) ABGELEHNT. Grund: ${res.reason}`);
     }
    
    this.log('info', `AUTH END order=${create.orderId} success=${res.success}`);
    return res;
  }
}
