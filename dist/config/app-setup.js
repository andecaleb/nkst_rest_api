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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePublicDir = resolvePublicDir;
exports.configureApp = configureApp;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const nestjs_api_reference_1 = require("@scalar/nestjs-api-reference");
const express = __importStar(require("express"));
const fs = __importStar(require("fs"));
const helmet_1 = __importDefault(require("helmet"));
const path = __importStar(require("path"));
const validation_config_1 = require("./validation.config");
function resolveAppVersion() {
    try {
        const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
        const raw = fs.readFileSync(pkgPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.version && typeof parsed.version === 'string') {
            return parsed.version;
        }
    }
    catch {
    }
    return process.env.npm_package_version || '1.0.0';
}
function resolvePublicDir() {
    return path.join(__dirname, '..', 'public');
}
function configureApp(app) {
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port', 8080);
    const apiPrefix = configService.get('app.apiPrefix', 'api/v1');
    const appName = configService.get('app.appName', 'NKST Community API');
    const nodeEnv = configService.get('app.nodeEnv', 'development');
    const version = resolveAppVersion();
    const publicDir = resolvePublicDir();
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    app.enableCors({ origin: true, credentials: true });
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe(validation_config_1.validationPipeConfig));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle(appName)
        .setDescription('Robust JSON:API backend service for the NKST Community MVP (Headquarters: Mkar, Benue State, Nigeria). Covers Members & Privacy, Churches & Affiliation, 4-Pathway Verification, Posts & Moderation, Groups, Church Galleries, Resources & Central Library, Non-Financial Marketplace, Announcements, Recitations, Notifications, and Admin Audit.')
        .setVersion(version)
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `Enter your JWT access token returned from /${apiPrefix}/auth/login`,
    }, 'bearer')
        .build();
    const openApiDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    app.use('/openapi.json', (_req, res) => {
        res.json(openApiDocument);
    });
    app.use('/docs', (0, nestjs_api_reference_1.apiReference)({
        theme: 'purple',
        content: openApiDocument,
        metaData: {
            title: `${appName} — Scalar API Reference`,
        },
    }));
    app.use('/health', (_req, res) => {
        res.json({
            jsonapi: { version: '1.1' },
            data: {
                status: 'ok',
                service: appName,
                version,
                environment: nodeEnv,
                apiBasePath: `/${apiPrefix}`,
                docs: `http://localhost:${port}/docs`,
                openapi: `http://localhost:${port}/openapi.json`,
            },
        });
    });
    app.use(express.static(publicDir, {
        index: 'index.html',
        dotfiles: 'deny',
        redirect: false,
        fallthrough: true,
    }));
    return {
        port,
        apiPrefix,
        appName,
        nodeEnv,
        version,
        publicDir,
    };
}
//# sourceMappingURL=app-setup.js.map