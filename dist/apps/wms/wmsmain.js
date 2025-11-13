"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const WmsModules_1 = require("./WmsModules");
const microservices_1 = require("@nestjs/microservices");
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(WmsModules_1.WmsModule, {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
            queue: 'wms_queue',
            queueOptions: {
                durable: false,
            },
            noAck: false,
        },
    });
    await app.listen();
    console.log('WMS Microservice hört zu...');
}
void bootstrap();
//# sourceMappingURL=wmsmain.js.map