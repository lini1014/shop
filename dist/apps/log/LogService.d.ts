interface LogPayload {
    service: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}
export declare class LogService {
    private logFilePath;
    constructor();
    handleLog(data: LogPayload): Promise<void>;
}
export {};
