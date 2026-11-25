import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { validationPipeConfig } from '../../src/config/validation.config';

describe('NKST API Integration Tests (PostgreSQL E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const memberEmail = `int.member.${ts}@example.com`;
  const memberPhone = `+23481${String(ts).slice(-8)}`;
  const buyerEmail = `int.buyer.${ts}@example.com`;
  const buyerPhone = `+23482${String(ts).slice(-8)}`;

  let hqChurchId: string;
  let adminToken: string;
  let memberId: string;
  let memberToken: string;
  let buyerId: string;
  let buyerToken: string;
  let heldPostId: string;
  let groupId: string;
  let resourceId: string;
  let orderId: string;
  let recitationId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test records in dependency-safe order
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
    if (resourceId) await prisma.resource.deleteMany({ where: { id: resourceId } });
    if (groupId) await prisma.group.deleteMany({ where: { id: groupId } });
    if (heldPostId) await prisma.post.deleteMany({ where: { id: heldPostId } });
    if (recitationId) await prisma.recitation.deleteMany({ where: { id: recitationId } });
    const ids = [memberId, buyerId].filter(Boolean);
    if (ids.length) {
      await prisma.sellerAccess.deleteMany({ where: { memberId: { in: ids } } });
      await prisma.member.deleteMany({ where: { id: { in: ids } } });
    }
    await app.close();
  });

  it('03 — lists seeded Mkar HQ church publicly', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/churches').expect(200);
    expect(res.body.jsonapi).toEqual({ version: '1.1' });
    expect(Array.isArray(res.body.data)).toBe(true);
    const hq = res.body.data.find((c: any) => c.isHeadquarters);
    expect(hq).toBeDefined();
    hqChurchId = hq.id;
  });

  it('02 — logs in seeded Platform Admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@nkst.org.ng', password: 'ChangeMe@123!' })
      .expect(201);

    adminToken = res.body.data.accessToken;
    expect(adminToken).toBeTruthy();
  });

  it('02 — registers, verifies OTP, and logs in a new member', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Aondover',
        surname: 'Orngu',
        email: memberEmail,
        phone: memberPhone,
        password: 'Password@123',
        gender: 'male',
        dateOfBirth: '1997-04-12',
        state: 'Benue',
        lga: 'Gboko',
        residentialLocation: 'Mkar Junction',
        churchId: hqChurchId,
      })
      .expect(201);

    memberId = reg.body.data.member.id;
    const otp = reg.body.data.devOtp;
    expect(otp).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-account')
      .send({ identifier: memberEmail, code: otp, channel: 'email' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: memberPhone, password: 'Password@123' })
      .expect(201);

    memberToken = login.body.data.accessToken;
    expect(memberToken).toBeTruthy();
  });

  it('04 & 05 — holds unverified post and releases it to pending_review on verification, then approves to feed', async () => {
    // Create post while unverified -> held_unverified
    const postRes = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        type: 'text',
        category: 'general',
        audience: 'church',
        body: 'Integration test post while unverified',
      })
      .expect(201);

    heldPostId = postRes.body.data.id;
    expect(postRes.body.data.status).toBe('held_unverified');

    // Platform Admin validates member -> releases held post to pending_review
    const valRes = await request(app.getHttpServer())
      .post('/api/v1/verification/direct-validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId, decisionNote: 'Integration test validation' })
      .expect(201);

    expect(valRes.body.data.releasedHeldContent.postsReleasedToReview).toBeGreaterThanOrEqual(1);

    // Approve post
    const modRes = await request(app.getHttpServer())
      .patch(`/api/v1/posts/${heldPostId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve', reason: 'Approved in integration test' })
      .expect(200);

    expect(modRes.body.data.status).toBe('approved');

    // Verify post appears in church feed
    const feedRes = await request(app.getHttpServer())
      .get(`/api/v1/posts/feed?churchId=${hqChurchId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(feedRes.body.data.some((p: any) => p.id === heldPostId)).toBe(true);
  });

  it('06 — enforces group gender restriction server-side on join', async () => {
    const grpRes = await request(app.getHttpServer())
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Women Fellowship ${ts}`,
        description: 'Women only fellowship',
        scope: 'church',
        churchId: hqChurchId,
        visibility: 'public',
        joinMode: 'open',
        genderRestriction: 'female',
        verifiedOnly: true,
      })
      .expect(201);

    groupId = grpRes.body.data.id;

    // Male member must be rejected with 403
    await request(app.getHttpServer())
      .post(`/api/v1/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('07 — requires consent confirmation and disables download for minors photos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/gallery/photos')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        fileUrl: 'https://cdn.nkst.org.ng/test.jpg',
        category: 'worship_service',
        consentConfirmed: false,
        hasMinors: false,
      })
      .expect(400);

    const photoRes = await request(app.getHttpServer())
      .post('/api/v1/gallery/photos')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        fileUrl: 'https://cdn.nkst.org.ng/youth.jpg',
        category: 'youth',
        consentConfirmed: true,
        hasMinors: true,
      })
      .expect(201);

    expect(photoRes.body.data.allowDownload).toBe(false);
    expect(photoRes.body.data.status).toBe('pending_review');
    await prisma.photo.delete({ where: { id: photoRes.body.data.id } });
  });

  it('08 & 09 — paid digital resource unlocks download ONLY after seller accepts order (no financials)', async () => {
    // Register & verify a second member (buyer)
    const regBuyer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Dooshima',
        surname: 'Katsina',
        email: buyerEmail,
        phone: buyerPhone,
        password: 'Password@123',
        gender: 'female',
        dateOfBirth: '1999-09-20',
        state: 'Benue',
        lga: 'Gboko',
        residentialLocation: 'Gboko South',
        churchId: hqChurchId,
      })
      .expect(201);
    buyerId = regBuyer.body.data.member.id;

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-account')
      .send({ identifier: buyerEmail, code: regBuyer.body.data.devOtp, channel: 'email' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/verification/direct-validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId: buyerId })
      .expect(201);

    const loginBuyer = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: buyerEmail, password: 'Password@123' })
      .expect(201);
    buyerToken = loginBuyer.body.data.accessToken;

    // Grant seller access to memberId
    await request(app.getHttpServer())
      .post('/api/v1/marketplace/sellers/grant')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId, plan: 'one_year' })
      .expect(201);

    // Create paid digital resource, submit, and approve
    const resCreate = await request(app.getHttpServer())
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: `NKST Liturgy Guide ${ts}`,
        description: 'Digital PDF resource',
        category: 'books_and_publications',
        resourceType: 'document',
        format: 'digital',
        access: 'paid',
        price: 1500,
        files: [
          {
            fileUrl: 'https://cdn.nkst.org.ng/liturgy.pdf',
            fileName: 'liturgy.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 102400,
            isPreviewImage: false,
          },
        ],
      })
      .expect(201);
    resourceId = resCreate.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/resources/${resourceId}/submit`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/resources/${resourceId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approve' })
      .expect(200);

    // Buyer cannot download paid resource BEFORE order is accepted
    await request(app.getHttpServer())
      .get(`/api/v1/resources/${resourceId}/download`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);

    // Buyer places order -> paymentStatus must be 'not_enabled'
    const ordRes = await request(app.getHttpServer())
      .post('/api/v1/marketplace/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ resourceId, quantity: 1 })
      .expect(201);
    orderId = ordRes.body.data.id;
    expect(ordRes.body.data.paymentStatus).toBe('not_enabled');
    expect(ordRes.body.data.status).toBe('requested');

    // Seller accepts -> status becomes 'fulfilled'
    const accRes = await request(app.getHttpServer())
      .patch(`/api/v1/marketplace/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(accRes.body.data.status).toBe('fulfilled');

    // Buyer can NOW download the digital file
    const dlRes = await request(app.getHttpServer())
      .get(`/api/v1/resources/${resourceId}/download`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(dlRes.body.data).toHaveLength(1);
    expect(dlRes.body.data[0].fileName).toBe('liturgy.pdf');
  });

  it('10 — Platform Admin publishes a national recitation readable by everyone', async () => {
    const createRec = await request(app.getHttpServer())
      .post('/api/v1/communication/recitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Sunday Recitation ${ts}`,
        body: 'Psalm 23:1-6',
        appliesOn: '2026-11-29',
      })
      .expect(201);
    recitationId = createRec.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/communication/recitations/${recitationId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pubList = await request(app.getHttpServer())
      .get('/api/v1/communication/recitations')
      .expect(200);

    expect(pubList.body.data.some((r: any) => r.id === recitationId)).toBe(true);
  });
});
