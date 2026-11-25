import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { validationPipeConfig } from '../../src/config/validation.config';
import { DEFAULT_AVATAR_URL } from '../../src/common/constants/roles.constant';

describe('NKST API Security Tests (Auth, RBAC, Privacy, Input Hardening)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const userAEmail = `sec.usera.${ts}@example.com`;
  const userAPhone = `+23483${String(ts).slice(-8)}`;
  const userBEmail = `sec.userb.${ts}@example.com`;
  const userBPhone = `+23484${String(ts).slice(-8)}`;

  let hqChurchId: string;
  let adminToken: string;
  let userAId: string;
  let userAToken: string;
  let userBId: string;
  let userBToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    prisma = app.get(PrismaService);

    const churches = await request(app.getHttpServer()).get('/api/v1/churches').expect(200);
    hqChurchId = churches.body.data[0].id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@nkst.org.ng', password: 'ChangeMe@123!' })
      .expect(201);
    adminToken = adminLogin.body.data.accessToken;

    // Create & activate User A (remains unverified initially)
    const regA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Private',
        surname: 'MemberA',
        email: userAEmail,
        phone: userAPhone,
        password: 'Password@123',
        gender: 'male',
        dateOfBirth: '1994-03-10',
        state: 'Benue',
        lga: 'Gboko',
        residentialLocation: 'Secret Residential Address 42',
        churchId: hqChurchId,
        photoUrl: 'https://cdn.nkst.org.ng/private-photo.jpg',
      })
      .expect(201);
    userAId = regA.body.data.member.id;

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-account')
      .send({ identifier: userAEmail, code: regA.body.data.devOtp, channel: 'email' })
      .expect(201);

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: userAEmail, password: 'Password@123' })
      .expect(201);
    userAToken = loginA.body.data.accessToken;

    // Create & activate User B
    const regB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Viewer',
        surname: 'MemberB',
        email: userBEmail,
        phone: userBPhone,
        password: 'Password@123',
        gender: 'female',
        dateOfBirth: '1996-08-22',
        state: 'Benue',
        lga: 'Makurdi',
        residentialLocation: 'Makurdi GRA',
        churchId: hqChurchId,
      })
      .expect(201);
    userBId = regB.body.data.member.id;

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-account')
      .send({ identifier: userBEmail, code: regB.body.data.devOtp, channel: 'email' })
      .expect(201);

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: userBEmail, password: 'Password@123' })
      .expect(201);
    userBToken = loginB.body.data.accessToken;
  });

  afterAll(async () => {
    const ids = [userAId, userBId].filter(Boolean);
    if (ids.length) {
      await prisma.member.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });

  describe('Authentication & Session Revocation', () => {
    it('rejects unauthenticated access to protected endpoints with 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/members/me').expect(401);
      await request(app.getHttpServer()).get('/api/v1/audit/counts').expect(401);
    });

    it('rejects tampered / malformed JWT tokens with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.sig')
        .expect(401);
    });

    it('immediately invalidates JWT after logout (session revocation)', async () => {
      const tempLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: userBEmail, password: 'Password@123' })
        .expect(201);
      const tempToken = tempLogin.body.data.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .get('/api/v1/members/me')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(401);
    });
  });

  describe('RBAC & Privilege Escalation Protection', () => {
    it('blocks regular members from Platform Admin & Church Admin routes with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/churches')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Unauthorized Church',
          state: 'Benue',
          lga: 'Gboko',
          town: 'Gboko',
          address: 'Test',
          phones: ['+2348000000099'],
        })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/communication/recitations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Fake', body: 'Fake', appliesOn: '2026-11-29' })
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/verification/queue')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(403);
    });
  });

  describe('Input Validation, Mass Assignment & Injection Protection', () => {
    it('rejects mass-assignment attempts (isPlatformAdmin / verificationState) with 400', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/members/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          firstName: 'Hacker',
          isPlatformAdmin: true,
          verificationState: 'verified',
        })
        .expect(400);
    });

    it('rejects invalid UUID path parameters with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members/not-a-valid-uuid')
        .expect(400);
    });

    it('safely handles SQL injection payloads in search queries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/churches?search=${encodeURIComponent("' OR 1=1; DROP TABLE churches;--")}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects unexpected payment fields on marketplace orders (no-financials guardrail)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/marketplace/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resourceId: '00000000-0000-4000-8000-000000000001',
          quantity: 1,
          paymentStatus: 'paid',
          cardToken: 'tok_visa',
        })
        .expect(400);
    });
  });

  describe('Privacy Masking Enforcement (PRIV-01..06)', () => {
    it('prevents private member PII from leaking to other members and visitors while allowing Platform Admin access', async () => {
      // User A switches to private
      await request(app.getHttpServer())
        .patch('/api/v1/members/me/privacy')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ profileVisibility: 'private' })
        .expect(200);

      // User B views User A -> PII must be completely absent
      const otherView = await request(app.getHttpServer())
        .get(`/api/v1/members/${userAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      const profile = otherView.body.data.profile;
      expect(profile.email).toBeUndefined();
      expect(profile.phone).toBeUndefined();
      expect(profile.dateOfBirth).toBeUndefined();
      expect(profile.residentialLocation).toBeUndefined();
      expect(profile.photoUrl).toBe(DEFAULT_AVATAR_URL);

      // Unauthenticated visitor views User A -> PII must also be absent
      const visitorView = await request(app.getHttpServer())
        .get(`/api/v1/members/${userAId}`)
        .expect(200);
      expect(visitorView.body.data.profile.email).toBeUndefined();
      expect(visitorView.body.data.profile.phone).toBeUndefined();

      // Platform Admin views User A -> authorized to see full fields (PRIV-05)
      const adminView = await request(app.getHttpServer())
        .get(`/api/v1/members/${userAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(adminView.body.data.profile.email).toBe(userAEmail);
      expect(adminView.body.data.profile.phone).toBe(userAPhone);
    });
  });

  describe('Verification & Suspension Guards (AUTH-06, VER-08)', () => {
    it('blocks unverified member from verification-gated actions with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/marketplace/orders')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ resourceId: '00000000-0000-4000-8000-000000000001', quantity: 1 })
        .expect(403);
    });

    it('allows suspended member to log in with suspensionNotice but blocks all write actions with 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/members/${userAId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Security test suspension' })
        .expect(200);

      const loginSuspended = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: userAEmail, password: 'Password@123' })
        .expect(201);

      expect(loginSuspended.body.data.suspensionNotice).toMatchObject({
        suspended: true,
        readOnly: true,
      });

      const suspendedToken = loginSuspended.body.data.accessToken;

      // Suspended user cannot create posts or resources
      await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .send({ type: 'text', category: 'general', audience: 'church', body: 'Blocked post' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .send({
          title: 'Blocked',
          description: 'Blocked',
          category: 'other',
          resourceType: 'document',
          format: 'digital',
          access: 'free',
        })
        .expect(403);
    });
  });
});
