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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let LogService = class LogService {
    logFilePath;
    constructor() {
        const logDir = path.join(process.cwd(), 'log');
        this.logFilePath = path.join(logDir, 'log-file');
        console.log(`Log-Datei Pfad: ${this.logFilePath}`);
        if (!fs.existsSync(logDir)) {
            console.log(`Erstelle Log-Verzeichnis: ${logDir}`);
            fs.mkdirSync(logDir);
        }
        try {
            fs.appendFileSync(this.logFilePath, '--- Log-Service gestartet ---\n');
        }
        catch (error) {
            console.error('Konnte Log-Datei nicht initial schreiben', error);
        }
    }
    async handleLog(data) {
        const logEntry = `${data.timestamp} [${data.service}] [${data.level.toUpperCase()}]: ${data.message}\n`;
        try {
            await fs.promises.appendFile(this.logFilePath, logEntry);
            const isTerminal = (data.service === 'WMS' && /abgeschlossen/i.test(data.message)) ||
                (data.service === 'OMS' &&
                    (/storniert/i.test(data.message) || /fehlgeschlagen/i.test(data.message)));
            if (isTerminal) {
                await fs.promises.appendFile(this.logFilePath, '--------------------\n');
            }
        }
        catch (error) {
            console.error('Konnte nicht in Logfile schreiben', error);
        }
    }
};
exports.LogService = LogService;
__decorate([
    (0, microservices_1.EventPattern)('log_message'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LogService.prototype, "handleLog", null);
exports.LogService = LogService = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [])
], LogService);
//# sourceMappingURL=LogService.js.map