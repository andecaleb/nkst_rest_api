import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as express from 'express';
import * as fs from 'fs';
import helmet from 'helmet';
import * as path from 'path';
import { validationPipeConfig } from './validation.config';

export interface AppRuntimeInfo {
  port: number;
  apiPrefix: string;
  appName: string;
  nodeEnv: string;
  version: string;
  publicDir: string;
}

function resolveAppVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    if (parsed.version && typeof parsed.version === 'string') {
      return parsed.version;
    }
  } catch {
    // Fallback to npm env or default version if package.json is not adjacent
  }
  return process.env.npm_package_version || '1.0.0';
}

export function resolvePublicDir(): string {
  return path.join(__dirname, '..', 'public');
}

export function configureApp(app: INestApplication): AppRuntimeInfo {
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 8080);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const appName = configService.get<string>('app.appName', 'NKST Community API');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const version = resolveAppVersion();
  const publicDir = resolvePublicDir();

  // Allow Scalar's inline scripts/CDN assets on /docs while keeping Helmet enabled
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

  // OpenAPI 3.1 Specification (numbered following 01-12 NKST App MVP Specification)
  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      'Robust JSON:API backend service for the NKST Community MVP (Headquarters: Mkar, Benue State, Nigeria). Covers Members & Privacy, Churches & Affiliation, 4-Pathway Verification, Posts & Moderation, Groups, Church Galleries, Resources & Central Library, Non-Financial Marketplace, Announcements, Recitations, Notifications, and Admin Audit.',
    )
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `Enter your JWT access token returned from /${apiPrefix}/auth/login`,
      },
      'bearer',
    )
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // Expose raw OpenAPI JSON
  app.use('/openapi.json', (_req: express.Request, res: express.Response) => {
    res.json(openApiDocument);
  });

  // Mount Scalar Interactive API Reference at /docs
  app.use(
    '/docs',
    apiReference({
      theme: 'purple',
      content: openApiDocument,
      metaData: {
        title: `${appName} — Scalar API Reference`,
      },
    }),
  );

  // Simple health check outside API prefix
  app.use('/health', (_req: express.Request, res: express.Response) => {
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

  // Serve static API homepage assets from public/ without interfering with API routes or /docs
  app.use(
    express.static(publicDir, {
      index: 'index.html',
      dotfiles: 'deny',
      redirect: false,
      fallthrough: true,
    }),
  );

  return {
    port,
    apiPrefix,
    appName,
    nodeEnv,
    version,
    publicDir,
  };
}
