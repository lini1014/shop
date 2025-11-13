"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const LogModule_1 = require("./LogModule");
const microservices_1 = require("@nestjs/microservices");
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(LogModule_1.LogModule, {
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.AMQP_URL || 'amqp://guest:guest@127.0.0.1:5672'],
            queue: 'log_queue',
            queueOptions: {
                durable: true,
            },
            noAck: false,
        },
    });
    await app.listen();
    console.log('Logging Microservice gestartet');
}
void bootstrap();
//# sourceMappingURL=logmain.js.map