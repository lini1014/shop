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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmsModule = void 0;
const common_1 = require("@nestjs/common");
const OmsController_1 = require("./OmsController");
const OmsService_1 = require("./OmsService");
const microservices_1 = require("@nestjs/microservices");
const path = __importStar(require("path"));
let OmsModule = class OmsModule {
};
exports.OmsModule = OmsModule;
exports.OmsModule = OmsModule = __decorate([
    (0, common_1.Module)({
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
                {
                    name: 'WMS_CLIENT',
                    transport: microservices_1.Transport.RMQ,
                    options: {
                        urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
                        queue: 'wms_queue',
                        queueOptions: {
                            durable: false,
                        },
                    },
                },
                {
                    name: 'INVENTORY_GRPC_CLIENT',
                    transport: microservices_1.Transport.GRPC,
                    options: {
                        package: 'inventory',
                        protoPath: path.join(process.cwd(), 'proto', 'inventory.proto'),
                        url: process.env.INVENTORY_GRPC_URL || 'localhost:50051',
                    },
                },
            ]),
        ],
        controllers: [OmsController_1.OmsController],
        providers: [OmsService_1.OmsService],
    })
], OmsModule);
//# sourceMappingURL=OmsModule.js.map