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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const InventoryService_1 = require("./InventoryService");
let InventoryController = class InventoryController {
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
            service: 'INVENTORY',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    reserveStock(data) {
        this.log('info', `Reservierung fuer Order ${data.orderId}`);
        const reservationId = this.service.reserveStock(data.items);
        if (!reservationId) {
            this.log('warn', `Reservierung fuer Order ${data.orderId} fehlgeschlagen: OUT_OF_STOCK`);
            return { ok: false, reason: 'OUT_OF_STOCK' };
        }
        this.log('info', `Reservierung fuer Order ${data.orderId} erfolgreich: ${reservationId}`);
        return { ok: true, reservationId };
    }
    commitReservation(data) {
        this.log('info', `Commit Reservation ${data.reservationId}`);
        const ok = this.service.commitReservation(data.reservationId);
        return { ok };
    }
    releaseReservation(data) {
        this.log('warn', `Release Reservation ${data.reservationId}`);
        const ok = this.service.releaseReservation(data.reservationId);
        return { ok };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, microservices_1.GrpcMethod)('InventoryService', 'ReserveStock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "reserveStock", null);
__decorate([
    (0, microservices_1.GrpcMethod)('InventoryService', 'CommitReservation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "commitReservation", null);
__decorate([
    (0, microservices_1.GrpcMethod)('InventoryService', 'ReleaseReservation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "releaseReservation", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)(),
    __param(1, (0, common_1.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [InventoryService_1.InventoryService,
        microservices_1.ClientProxy])
], InventoryController);
//# sourceMappingURL=InventoryController.js.map