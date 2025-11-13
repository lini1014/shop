"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const PaymentController_1 = require("./PaymentController");
const PaymentService_1 = require("./PaymentService");
const microservices_1 = require("@nestjs/microservices");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        controllers: [PaymentController_1.PaymentController],
        providers: [PaymentService_1.PaymentService],
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: 'LOG_CLIENT',
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
                        queue: 'log_queue',
                        queueOptions: {
                            durable: true,
                        },
                    },
                },
            ]),
        ],
    })
], PaymentModule);
//# sourceMappingURL=PaymentModule.js.map