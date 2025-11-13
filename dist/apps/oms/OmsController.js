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
exports.OmsController = void 0;
const common_1 = require("@nestjs/common");
const OmsService_1 = require("./OmsService");
const CreateOrderRequestDto_1 = require("../../libs/dto/CreateOrderRequestDto");
const microservices_1 = require("@nestjs/microservices");
let OmsController = class OmsController {
    omsService;
    logClient;
    constructor(omsService, logClient) {
        this.omsService = omsService;
        this.logClient = logClient;
    }
    async onModuleInit() {
        await this.logClient.connect();
    }
    log(level, message) {
        this.logClient.emit('log_message', {
            service: 'OMS',
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    async create(body) {
        this.log('info', `Bestellung weiterleiten an Service: firstName=${body.firstName}, lastName=${body.lastName}, items=${body.items?.length ?? 0}`);
        const order = await this.omsService.createOrderFromSelection(body);
        return { id: order.id, status: order.status };
    }
    getOrderById(id) {
        const order = this.omsService.getOrderById(id);
        const wmsStatus = this.omsService.getLastWmsStatus(order.id);
        return { ...order, status: wmsStatus ?? order.status };
    }
};
exports.OmsController = OmsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrderRequestDto_1.CreateOrderRequestDto]),
    __metadata("design:returntype", Promise)
], OmsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OmsController.prototype, "getOrderById", null);
exports.OmsController = OmsController = __decorate([
    (0, common_1.Controller)('orders'),
    __param(1, (0, common_1.Inject)('LOG_CLIENT')),
    __metadata("design:paramtypes", [OmsService_1.OmsService,
        microservices_1.ClientProxy])
], OmsController);
//# sourceMappingURL=OmsController.js.map