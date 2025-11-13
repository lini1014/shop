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
exports.WmsService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const microservices_2 = require("@nestjs/microservices");
let WmsService = class WmsService {
    statusClient;
    logClient;
    constructor(statusClient, logClient) {
        this.statusClient = statusClient;
        this.logClient = logClient;
    }
    async onModuleInit() {
        try {
            await this.statusClient.connect();
            await this.logClient.connect();
            this.log('info', 'WMS verbunden mit Log-Service');
        }
        catch (error) {
            console.error('FEHLER: WMS konnte sich nicht verbinden', error);
            this.log('error', 'WMS konnte sich nicht mit RabbitMQ verbinden.');
        }
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'WMS',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    async handleOrderReceived(data, context) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        this.log('info', `Bestellung erhalten: ${data.orderId}`);
        try {
            await this.sleep(10000);
            this.publishStatus(data.orderId, 'Artikel ausgewählt');
            this.log('info', `Artikel für Bestellung ${data.orderId} ausgewählt.`);
            await this.sleep(10000);
            this.publishStatus(data.orderId, 'Bestellung verpackt');
            this.log('info', `Bestellung ${data.orderId} verpackt.`);
            await this.sleep(10000);
            this.publishStatus(data.orderId, 'Bestellung versandt');
            this.log('info', `Bestellung ${data.orderId} versandt`);
            await this.sleep(1000);
            this.log('info', `Bestellung ${data.orderId} abgeschlossen.`);
            channel.ack(originalMsg);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log('error', `Fehler bei der Verarbeitung der Bestellung ${data.orderId}:${errorMessage}`);
            channel.nack(originalMsg, false, true);
        }
    }
    publishStatus(orderId, status) {
        const payload = { orderId, status, timestamp: new Date() };
        this.statusClient.emit('status_update', payload);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.WmsService = WmsService;
__decorate([
    (0, microservices_2.MessagePattern)('order_received'),
    __param(0, (0, microservices_2.Payload)()),
    __param(1, (0, microservices_2.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_2.RmqContext]),
    __metadata("design:returntype", Promise)
], WmsService.prototype, "handleOrderReceived", null);
exports.WmsService = WmsService = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)('WMS_STATUS_CLIENT')),
    __param(1, (0, common_1.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        microservices_1.ClientProxy])
], WmsService);
//# sourceMappingURL=WmsService.js.map