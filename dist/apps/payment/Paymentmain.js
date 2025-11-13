"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const PaymentModule_1 = require("./PaymentModule");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(PaymentModule_1.PaymentModule, { cors: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    const port = Number(process.env.PORT ?? 3002);
    await app.listen(port, '0.0.0.0');
    console.log(`Payment Service running on port ${port}`);
}
void bootstrap();
//# sourceMappingURL=Paymentmain.js.map