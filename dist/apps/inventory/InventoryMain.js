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
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const path = __importStar(require("path"));
const InventoryModule_1 = require("./InventoryModule");
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(InventoryModule_1.InventoryModule, {
        transport: microservices_1.Transport.GRPC,
        options: {
            package: 'inventory',
            protoPath: path.join(process.cwd(), 'proto', 'inventory.proto'),
            url: process.env.INVENTORY_GRPC_URL || '0.0.0.0:50051',
        },
    });
    await app.listen();
    console.log(`?? Inventory gRPC-Service laeuft auf ${process.env.INVENTORY_GRPC_URL || '0.0.0.0:50051'}`);
}
void bootstrap();
//# sourceMappingURL=InventoryMain.js.map