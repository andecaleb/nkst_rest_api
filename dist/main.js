"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const app_setup_1 = require("./config/app-setup");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const { port, apiPrefix, appName } = (0, app_setup_1.configureApp)(app);
    await app.listen(port);
    logger.log(`${appName} homepage available at http://localhost:${port}/`);
    logger.log(`${appName} running at http://localhost:${port}/${apiPrefix}`);
    logger.log(`Scalar API Reference available at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map