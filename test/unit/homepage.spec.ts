import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('@scalar/nestjs-api-reference', () => ({
  apiReference: (options: { metaData?: { title?: string } }) => (_req: any, res: any) => {
    res
      .status(200)
      .type('text/html')
      .send(`<!DOCTYPE html><html><head><title>${options?.metaData?.title || 'Scalar API Reference'}</title></head><body>Scalar API Reference</body></html>`);
  },
}));

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/config/app-setup';
import { PrismaService } from '../../src/database/prisma.service';

describe('NKST API Custom Homepage, Routing Regression & Security', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    church: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'NKST National Headquarters, Mkar',
          isHeadquarters: true,
          isActive: true,
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Homepage & Static Assets', () => {
    it('GET / returns HTTP 200 with HTML content and NKST branding', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);

      expect(res.headers['content-type']).toMatch(/text\/html/i);
      expect(res.text).toContain('Powering the NKST Digital Experience.');
      expect(res.text).toContain('NKST API');
      expect(res.text).toContain('href="/docs"');
      expect(res.text).toContain('href="/health"');
      expect(res.text).toContain('/api/v1/auth');
      expect(res.text).toContain('/api/v1/churches');
      expect(res.text).toContain('/api/v1/verification');
    });

    it('GET /styles.css returns HTTP 200 with CSS content', async () => {
      const res = await request(app.getHttpServer()).get('/styles.css').expect(200);

      expect(res.headers['content-type']).toMatch(/text\/css/i);
      expect(res.text).toContain('--bg-primary');
    });

    it('GET /app.js returns HTTP 200 with JavaScript content', async () => {
      const res = await request(app.getHttpServer()).get('/app.js').expect(200);

      expect(res.headers['content-type']).toMatch(/javascript/i);
      expect(res.text).toContain("fetch('/health'");
    });

    it('GET /favicon.svg returns HTTP 200 with SVG content', async () => {
      const res = await request(app.getHttpServer()).get('/favicon.svg').expect(200);

      expect(res.headers['content-type']).toMatch(/image\/svg\+xml/i);
    });
  });

  describe('Documentation & Health Endpoints', () => {
    it('GET /docs remains accessible for Scalar API Reference', async () => {
      const res = await request(app.getHttpServer()).get('/docs').expect(200);

      expect(res.headers['content-type']).toMatch(/text\/html/i);
      expect(res.text).toContain('Scalar API Reference');
    });

    it('GET /openapi.json returns the OpenAPI specification', async () => {
      const res = await request(app.getHttpServer()).get('/openapi.json').expect(200);

      expect(res.body.openapi).toBeDefined();
      expect(res.body.info).toBeDefined();
      expect(res.body.info.version).toBe('1.0.0');
      expect(res.body.paths).toBeDefined();
    });

    it('GET /health returns HTTP 200 with JSON:API 1.1 status metadata', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.body.jsonapi).toEqual({ version: '1.1' });
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBeDefined();
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.data.apiBasePath).toBe('/api/v1');
      expect(res.body.data.docs).toContain('/docs');
      expect(res.body.data.openapi).toContain('/openapi.json');
    });
  });

  describe('API Routing, Auth & Exception Handling Regressions', () => {
    it('preserves existing public API endpoints under /api/v1 with JSON:API envelope', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/churches').expect(200);

      expect(res.body.jsonapi).toEqual({ version: '1.1' });
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].isHeadquarters).toBe(true);
    });

    it('preserves global JWT authentication guard on protected routes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/members/me').expect(401);

      expect(res.body.jsonapi).toEqual({ version: '1.1' });
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0].status).toBe('401');
    });

    it('returns JSON:API 404 error for unknown API routes without static interception', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/non-existent-endpoint')
        .expect(404);

      expect(res.body.jsonapi).toEqual({ version: '1.1' });
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors[0].status).toBe('404');
    });
  });

  describe('Security Checks', () => {
    const blockedPaths = [
      '/.env',
      '/.env.example',
      '/../.env',
      '/../../.env',
      '/package.json',
      '/nest-cli.json',
      '/src/main.ts',
      '/config/app.config.ts',
    ];

    it.each(blockedPaths)('does not expose internal file %s', async (targetPath) => {
      const res = await request(app.getHttpServer()).get(targetPath);
      expect(res.status).toBe(404);
    });

    it('does not expose sensitive environment variables in homepage or /health', async () => {
      const home = await request(app.getHttpServer()).get('/').expect(200);
      const health = await request(app.getHttpServer()).get('/health').expect(200);
      const combined = `${home.text}\n${JSON.stringify(health.body)}`;

      expect(combined).not.toContain('DATABASE_URL');
      expect(combined).not.toContain('JWT_ACCESS_SECRET');
      expect(combined).not.toContain('JWT_REFRESH_SECRET');
      expect(combined).not.toContain('postgresql://');
      expect(combined).not.toContain('nkst-dev-access-secret');
    });

    it('does not load external third-party scripts or stylesheets on the homepage', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);

      expect(res.text).not.toMatch(/https?:\/\/.*(cdn|fonts\.googleapis|unpkg|jsdelivr)/i);
    });
  });
});
