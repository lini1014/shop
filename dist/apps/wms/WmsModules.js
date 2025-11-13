"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsModule = void 0;
const common_1 = require("@nestjs/common");
const WmsService_1 = require("./WmsService");
const microservices_1 = require("@nestjs/microservices");
let WmsModule = class WmsModule {
};
exports.WmsModule = WmsModule;
exports.WmsModule = WmsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: 'WMS_STATUS_CLIENT',
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
                        queue: 'status_updates_queue',
                        queueOptions: {
                            durable: false,
                        },
                    },
                },
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
        providers: [],
        controllers: [WmsService_1.WmsService],
    })
], WmsModule);
//# sourceMappingURL=WmsModules.js.map