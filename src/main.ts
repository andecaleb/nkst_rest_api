import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './config/app-setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const { port, apiPrefix, appName } = configureApp(app);

  await app.listen(port);
  logger.log(`${appName} homepage available at http://localhost:${port}/`);
  logger.log(`${appName} running at http://localhost:${port}/${apiPrefix}`);
  logger.log(`Scalar API Reference available at http://localhost:${port}/docs`);
}

bootstrap();
