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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const PaymentDTO_1 = require("../../libs/dto/PaymentDTO");
const PaymentService_1 = require("./PaymentService");
const microservices_1 = require("@nestjs/microservices");
let PaymentController = class PaymentController {
    service;
    logClient;
    constructor(service, logClient) {
        this.service = service;
        this.logClient = logClient;
    }
    async onModuleInit() {
        await this.logClient.connect();
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'PAYMENT',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    authorize(dto) {
        this.log('info', `Authorize angefragt: order=${dto.orderId} customer=${dto.firstName} ${dto.lastName} items=${dto.items?.length ?? 0}`);
        const result = this.service.authorize(dto);
        if (result.success) {
            this.log('info', `Authorize OK: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance}`);
        }
        else {
            this.log('warn', `Authorize FAIL: order=${dto.orderId} total=${result.totalAmount} balance=${result.accountBalance} reason=${result.reason}`);
        }
        return { success: result.success };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('authorize'),
    (0, swagger_1.ApiOperation)({ summary: 'Nur Erfolg/Fehler zurückgeben' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaymentDTO_1.PaymentDto]),
    __metadata("design:returntype", Object)
], PaymentController.prototype, "authorize", null);
exports.PaymentController = PaymentController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('payments'),
    __param(1, (0, common_1.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [PaymentService_1.PaymentService,
        microservices_1.ClientProxy])
], PaymentController);
//# sourceMappingURL=PaymentController.js.map