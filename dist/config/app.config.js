"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    appName: process.env.APP_NAME || 'NKST Community API',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'nkst-dev-access-secret',
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'nkst-dev-refresh-secret',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    otpExpiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES || '15', 10),
    throttleTtlMs: parseInt(process.env.THROTTLE_TTL_MS || '60000', 10),
    throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
//# sourceMappingURL=app.config.js.map