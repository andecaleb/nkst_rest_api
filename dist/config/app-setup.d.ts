import { INestApplication } from '@nestjs/common';
export interface AppRuntimeInfo {
    port: number;
    apiPrefix: string;
    appName: string;
    nodeEnv: string;
    version: string;
    publicDir: string;
}
export declare function resolvePublicDir(): string;
export declare function configureApp(app: INestApplication): AppRuntimeInfo;
