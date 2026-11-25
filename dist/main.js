"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const nestjs_api_reference_1 = require("@scalar/nestjs-api-reference");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const validation_config_1 = require("./config/validation.config");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port', 8080);
    const apiPrefix = configService.get('app.apiPrefix', 'api/v1');
    const appName = configService.get('app.appName', 'NKST Community API');
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    app.enableCors({ origin: true, credentials: true });
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe(validation_config_1.validationPipeConfig));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle(appName)
        .setDescription('Robust JSON:API backend service for the NKST Community MVP (Headquarters: Mkar, Benue State, Nigeria). Covers Members & Privacy, Churches & Affiliation, 4-Pathway Verification, Posts & Moderation, Groups, Church Galleries, Resources & Central Library, Non-Financial Marketplace, Announcements, Recitations, Notifications, and Admin Audit.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token returned from /api/v1/auth/login',
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
                docs: `http://localhost:${port}/docs`,
                openapi: `http://localhost:${port}/openapi.json`,
            },
        });
    });
    await app.listen(port);
    logger.log(`${appName} running at http://localhost:${port}/${apiPrefix}`);
    logger.log(`Scalar API Reference available at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map