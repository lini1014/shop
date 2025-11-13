"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let PaymentService = class PaymentService {
    logClient;
    constructor(logClient) {
        this.logClient = logClient;
    }
    async onModuleInit() {
        await this.logClient.connect();
        this.log('info', 'Payment Service verbunden mit Log-Service');
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'PAYMENT',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    customerBalances = {
        'niklas osimhen': 200.0,
        'maxi icardi': 4.2,
        'david ederson': 200.0,
        'emirhan aktürkoğlu': 200.0,
    };
    catalog = {
        101: 7.0,
        102: 60.0,
        103: 9.77,
    };
    getPrice(productId) {
        const price = this.catalog[productId];
        if (price === undefined) {
            this.log('error', `Unbekannte productId ${productId} im Katalog.`);
            throw new common_1.BadRequestException(`Unknown productId ${productId}`);
        }
        return price;
    }
    priceItems(items) {
        return items.map((it) => {
            const unitPrice = this.getPrice(it.productId);
            const lineTotal = +(unitPrice * it.quantity).toFixed(2);
            return { productId: it.productId, unitPrice, quantity: it.quantity, lineTotal };
        });
    }
    computeTotal(items) {
        const priced = this.priceItems(items);
        const total = priced.reduce((sum, li) => sum + li.lineTotal, 0);
        return +total.toFixed(2);
    }
    authorize(create) {
        const normalize = (s) => s.trim().toLowerCase();
        const fullKey = `${normalize(create.firstName)} ${normalize(create.lastName)}`;
        const accountBalance = this.customerBalances[fullKey];
        if (accountBalance === undefined) {
            this.log('warn', `Kunde ${fullKey} nicht in der Datenbank gefunden.`);
            throw new common_1.BadRequestException(`UNKNOWN_CUSTOMER: ${create.firstName} ${create.lastName}`);
        }
        const lineItems = this.priceItems(create.items);
        const totalAmount = lineItems.reduce((s, li) => s + li.lineTotal, 0);
        const total = +totalAmount.toFixed(2);
        const success = accountBalance >= total;
        const res = {
            orderId: create.orderId,
            success,
            totalAmount: total,
            accountBalance,
            lineItems,
            reason: success ? undefined : 'INSUFFICIENT_FUNDS',
        };
        return res;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], PaymentService);
//# sourceMappingURL=PaymentService.js.map