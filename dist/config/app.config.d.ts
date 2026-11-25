declare const _default: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    jwtAccessSecret: string;
    jwtAccessExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    otpExpiresMinutes: number;
    throttleTtlMs: number;
    throttleLimit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    appName: string;
    jwtAccessSecret: string;
    jwtAccessExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
    otpExpiresMinutes: number;
    throttleTtlMs: number;
    throttleLimit: number;
}>;
export default _default;
