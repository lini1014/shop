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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let InventoryService = class InventoryService {
    logClient;
    constructor(logClient) {
        this.logClient = logClient;
    }
    async onModuleInit() {
        await this.logClient.connect();
        this.log('info', 'Inventory Service verbunden mit Log-Service');
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'INVENTORY',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    stock = new Map([
        [101, 20],
        [102, 15],
        [103, 8],
    ]);
    reservations = new Map();
    reserveStock(items) {
        for (const item of items) {
            const current = this.stock.get(item.productId) ?? 0;
            if (current < item.quantity) {
                this.log('warn', `Nicht genug Bestand für Produkt ${item.productId}: ${current} < ${item.quantity}`);
                return null;
            }
        }
        const reservationId = `res-${Date.now()}`;
        for (const item of items) {
            const current = this.stock.get(item.productId) ?? 0;
            this.stock.set(item.productId, current - item.quantity);
        }
        this.reservations.set(reservationId, { id: reservationId, items });
        return reservationId;
    }
    commitReservation(reservationId) {
        this.log('info', `CommitReservation: ${reservationId}`);
        if (!this.reservations.has(reservationId)) {
            this.log('warn', `Commit fehlgeschlagen – Reservierung nicht gefunden: ${reservationId}`);
            return false;
        }
        this.reservations.delete(reservationId);
        this.log('info', `Reservierung ${reservationId} erfolgreich committed`);
        return true;
    }
    releaseReservation(reservationId) {
        this.log('info', `ReleaseReservation: ${reservationId}`);
        const reservation = this.reservations.get(reservationId);
        if (!reservation) {
            this.log('warn', `Keine Reservierung mit ID ${reservationId} gefunden`);
            return false;
        }
        for (const item of reservation.items) {
            const current = this.stock.get(item.productId) ?? 0;
            this.stock.set(item.productId, current + item.quantity);
        }
        this.reservations.delete(reservationId);
        this.log('info', `Reservierung ${reservationId} freigegeben`);
        return true;
    }
    getStock(productId) {
        return this.stock.get(productId) ?? 0;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], InventoryService);
//# sourceMappingURL=InventoryService.js.map