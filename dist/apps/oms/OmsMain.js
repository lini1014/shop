"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const OmsModule_1 = require("./OmsModule");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(OmsModule_1.OmsModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(3000);
    console.log('OMS läuft auf http://localhost:3000');
}
void bootstrap();
//# sourceMappingURL=OmsMain.js.map