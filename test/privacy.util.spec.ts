import { ProfileVisibility, VerificationState } from '@prisma/client';
import { DEFAULT_AVATAR_URL } from '../src/common/constants/roles.constant';
import { calculateAge, serializeMember } from '../src/common/utils/privacy.util';

describe('Privacy Serializer (PRIV-01..06)', () => {
  const privateMember = {
    id: 'member-1',
    firstName: 'Terfa',
    middleName: 'Aondowase',
    surname: 'Tarka',
    email: 'terfa@example.com',
    phone: '+2348031234567',
    gender: 'male',
    dateOfBirth: new Date('1995-05-10'),
    photoUrl: 'https://cdn.nkst.org.ng/terfa.jpg',
    bio: 'Choir member',
    state: 'Benue',
    lga: 'Gboko',
    residentialLocation: '14 Mkar Road',
    churchId: 'church-mkar',
    verificationState: VerificationState.verified,
    profileVisibility: ProfileVisibility.private,
    socialLinks: [{ id: 's1', label: 'LinkedIn', url: 'https://linkedin.com/in/terfa' }],
  };

  it('hides phone, email, photo, DOB, address, and social links from other members when private', () => {
    const result: any = serializeMember(privateMember, {
      id: 'other-member',
      email: 'other@example.com',
      phone: '+2348000000099',
      churchId: 'church-mkar',
      verificationState: VerificationState.verified,
      isPlatformAdmin: false,
      administeredChurchIds: [],
      roles: ['MEMBER'],
    });

    expect(result.fullName).toBe('Terfa Aondowase Tarka');
    expect(result.verificationBadge).toBe('Verified');
    expect(result.photoUrl).toBe(DEFAULT_AVATAR_URL);
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.dateOfBirth).toBeUndefined();
    expect(result.residentialLocation).toBeUndefined();
    expect(result.socialLinks).toBeUndefined();
  });

  it('reveals private fields to the member’s own Church Admin (PRIV-05)', () => {
    const result: any = serializeMember(privateMember, {
      id: 'church-admin',
      email: 'admin@mkar.org',
      phone: '+2348000000002',
      churchId: 'church-mkar',
      verificationState: VerificationState.verified,
      isPlatformAdmin: false,
      administeredChurchIds: ['church-mkar'],
      roles: ['CHURCH_ADMIN'],
    });

    expect(result.email).toBe('terfa@example.com');
    expect(result.phone).toBe('+2348031234567');
    expect(result.photoUrl).toBe('https://cdn.nkst.org.ng/terfa.jpg');
    expect(result.socialLinks).toHaveLength(1);
  });

  it('reveals private fields to the Platform Admin (PRIV-05)', () => {
    const result: any = serializeMember(privateMember, {
      id: 'platform-admin',
      email: 'admin@nkst.org.ng',
      phone: '+2348000000001',
      churchId: 'church-mkar',
      verificationState: VerificationState.verified,
      isPlatformAdmin: true,
      administeredChurchIds: [],
      roles: ['PLATFORM_ADMIN'],
    });

    expect(result.email).toBe('terfa@example.com');
    expect(result.residentialLocation).toBe('14 Mkar Road');
  });

  it('computes age accurately for group eligibility checks', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    expect(calculateAge(dob)).toBe(25);
  });
});
