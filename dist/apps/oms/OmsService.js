"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OrderDTO_1 = require("../../libs/dto/OrderDTO");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
let OmsService = class OmsService {
    logClient;
    wmsClient;
    inventoryClient;
    logFilePath = path.join(process.cwd(), 'log', 'log-file');
    inventoryGrpcService;
    constructor(logClient, wmsClient, inventoryClient) {
        this.logClient = logClient;
        this.wmsClient = wmsClient;
        this.inventoryClient = inventoryClient;
    }
    async onModuleInit() {
        await this.logClient.connect();
        await this.wmsClient.connect();
        this.inventoryGrpcService =
            this.inventoryClient.getService('InventoryService');
        this.log('info', 'OMS Service verbunden mit Log-Service, WMS-Service und Inventory (gRPC)');
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'OMS',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    orders = new Map();
    nextOrderId = 1000;
    generateOrderId() {
        return this.nextOrderId++;
    }
    async createOrderFromSelection(body) {
        const newId = this.generateOrderId();
        const order = {
            id: newId,
            items: body.items,
            status: OrderDTO_1.OrderStatus.RECEIVED,
        };
        this.orders.set(order.id, order);
        this.log('info', `Bestellung ${newId} ERHALTEN.`);
        const reserveRes = await this.inventoryReserve(order.id, body.items);
        if (!reserveRes.ok || !reserveRes.reservationId) {
            order.status = OrderDTO_1.OrderStatus.CANCELLED;
            order.reason = 'OUT_OF_STOCK';
            this.orders.set(order.id, order);
            this.log('warn', `Bestellung ${order.id} storniert. Grund: OUT_OF_STOCK.`);
            throw new common_1.ConflictException({
                message: 'Reservierung im Inventory fehlgeschlagen',
                reason: 'OUT_OF_STOCK',
                orderId: order.id,
            });
        }
        const reservationId = reserveRes.reservationId;
        order.status = OrderDTO_1.OrderStatus.RESERVED;
        this.orders.set(order.id, order);
        const payRes = await this.paymentCharge(order.id, body.items, body.firstName, body.lastName);
        if (!payRes.ok) {
            await this.inventoryRelease(reservationId);
            order.status = OrderDTO_1.OrderStatus.CANCELLED;
            order.reason = payRes.reason ?? 'PAYMENT_FAILED';
            this.orders.set(order.id, order);
            this.log('warn', `Bestellung ${order.id} storniert. Grund: ${order.reason}.`);
            throw new common_1.HttpException({
                message: 'Zahlung im Payment-Service fehlgeschlagen',
                reason: order.reason,
                orderId: order.id,
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        order.status = OrderDTO_1.OrderStatus.PAID;
        this.orders.set(order.id, order);
        this.log('info', `Bestellung ${order.id} erfolgreich bezahlt.`);
        order.status = OrderDTO_1.OrderStatus.FULFILLMENT_REQUESTED;
        const wmsPayload = {
            orderId: `ORDER-${order.id}`,
            items: order.items,
            customer: {
                firstName: body.firstName,
                lastName: body.lastName,
            },
        };
        this.wmsClient.emit('order_received', wmsPayload);
        this.log('info', `Bestellung ${order.id} an WMS weitergeleitet.`);
        this.orders.set(order.id, order);
        return order;
    }
    getOrderById(id) {
        const order = this.orders.get(id);
        if (!order) {
            this.log('warn', `Versuch, nicht existierende Order ${id} abzurufen.`);
            throw new common_1.HttpException({ message: 'Order nicht gefunden', reason: 'NOT_FOUND' }, common_1.HttpStatus.NOT_FOUND);
        }
        return order;
    }
    getLastWmsStatus(orderId) {
        try {
            if (!fs.existsSync(this.logFilePath)) {
                return null;
            }
            const lines = fs.readFileSync(this.logFilePath, 'utf-8').split(/\r?\n/);
            const searchToken = `ORDER-${orderId}`;
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i];
                if (!line || !line.includes('[WMS]') || !line.includes(searchToken)) {
                    continue;
                }
                const match = line.match(/\]:\s*(.+)$/);
                return match ? match[1].trim() : line.trim();
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.log('warn', `WMS-Status konnte nicht gelesen werden: ${message}`);
        }
        return null;
    }
    async inventoryReserve(orderId, items) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.inventoryGrpcService.reserveStock({ orderId, items }));
            this.log('info', `Inventory RESERVE -> ok=${response.ok}`);
            return { ok: response.ok, reservationId: response.reservationId };
        }
        catch (e) {
            const errorDetails = e instanceof Error ? e.message : String(e);
            this.log('error', `Inventory RESERVE unreachable: ${errorDetails}`);
            throw new common_1.HttpException({ message: 'Inventory-Service nicht erreichbar' }, common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async inventoryRelease(reservationId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.inventoryGrpcService.releaseReservation({ reservationId }));
            this.log('warn', `Inventory RELEASE (Kompensation) -> ok=${response.ok}`);
            return { ok: response.ok };
        }
        catch (e) {
            const errorDetails = e instanceof Error ? e.message : String(e);
            this.log('error', `Inventory RELEASE unreachable: ${errorDetails}`);
            return { ok: false };
        }
    }
    async paymentCharge(orderId, items, firstName, lastName) {
        try {
            const { data } = await axios_1.default.post(`http://localhost:3002/payments/authorize`, {
                orderId,
                items,
                firstName,
                lastName,
            });
            this.log('info', `Payment AUTHORIZE -> success=${data.success} `);
            return {
                ok: data.success,
                reason: data.reason,
            };
        }
        catch (e) {
            const errorDetails = e instanceof Error ? e.message : String(e);
            this.log('error', `Payment CHARGE unreachable: ${errorDetails}`);
            throw new common_1.HttpException({ message: 'Payment-Service nicht erreichbar' }, common_1.HttpStatus.BAD_GATEWAY);
        }
    }
};
exports.OmsService = OmsService;
exports.OmsService = OmsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('LOG_CLIENT')),
    __param(1, (0, common_1.Inject)('WMS_CLIENT')),
    __param(2, (0, common_1.Inject)('INVENTORY_GRPC_CLIENT')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        microservices_1.ClientProxy, Object])
], OmsService);
//# sourceMappingURL=OmsService.js.map