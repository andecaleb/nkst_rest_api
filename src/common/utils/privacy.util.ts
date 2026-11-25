import { ProfileVisibility, VerificationState } from '@prisma/client';
import { DEFAULT_AVATAR_URL } from '../constants/roles.constant';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

export interface MemberLike {
  id: string;
  firstName: string;
  middleName?: string | null;
  surname: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  photoUrl?: string | null;
  bio?: string | null;
  state?: string;
  lga?: string;
  residentialLocation?: string;
  churchId: string;
  verificationState: VerificationState;
  profileVisibility: ProfileVisibility;
  isPlatformAdmin?: boolean;
  church?: { id: string; name: string; state?: string; lga?: string } | null;
  socialLinks?: Array<{ id: string; label: string; url: string }>;
  [key: string]: any;
}

/**
 * Single centralized privacy masking serializer (PRIV-01 through PRIV-06, 11-data-model.md).
 *
 * When a member is PRIVATE:
 * - Phone, email, profile photo (replaced by default avatar), date of birth,
 *   residential address, and social links are hidden from all other members and visitors.
 * - Name, church, and verification badge remain visible.
 * - The member themselves, their own Church Admin, and the Platform Admin can view hidden fields.
 */
export function serializeMember(
  member: MemberLike | null | undefined,
  viewer?: AuthenticatedUser,
) {
  if (!member) return null;

  const isSelf = viewer?.id === member.id;
  const isPlatformAdmin = Boolean(viewer?.isPlatformAdmin);
  const isOwnChurchAdmin = Boolean(
    viewer?.administeredChurchIds?.includes(member.churchId),
  );
  const canSeePrivateFields =
    member.profileVisibility === ProfileVisibility.public ||
    isSelf ||
    isPlatformAdmin ||
    isOwnChurchAdmin;

  const fullName = [member.firstName, member.middleName, member.surname]
    .filter(Boolean)
    .join(' ');

  const base = {
    id: member.id,
    firstName: member.firstName,
    middleName: member.middleName ?? null,
    surname: member.surname,
    fullName,
    churchId: member.churchId,
    church: member.church ?? undefined,
    verificationState: member.verificationState,
    isVerified: member.verificationState === VerificationState.verified,
    verificationBadge:
      member.verificationState === VerificationState.verified ? 'Verified' : 'Unverified',
    profileVisibility: member.profileVisibility,
    photoUrl: canSeePrivateFields ? (member.photoUrl ?? DEFAULT_AVATAR_URL) : DEFAULT_AVATAR_URL,
    bio: member.bio ?? null,
    gender: member.gender,
    state: member.state,
    lga: member.lga,
  };

  if (!canSeePrivateFields) {
    return base;
  }

  return {
    ...base,
    email: member.email,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    residentialLocation: member.residentialLocation,
    socialLinks: member.socialLinks ?? undefined,
    isPlatformAdmin: isSelf || isPlatformAdmin ? member.isPlatformAdmin : undefined,
    suspensionReason:
      isSelf || isPlatformAdmin || isOwnChurchAdmin ? member.suspensionReason : undefined,
  };
}

/**
 * Compact author/uploader/seller card serializer respecting privacy rules (PRIV-04, PRIV-06).
 */
export function serializeMemberCard(
  member: MemberLike | null | undefined,
  viewer?: AuthenticatedUser,
) {
  if (!member) return null;
  const serialized = serializeMember(member, viewer);
  if (!serialized) return null;
  return {
    id: serialized.id,
    fullName: serialized.fullName,
    photoUrl: serialized.photoUrl,
    churchId: serialized.churchId,
    church: serialized.church,
    isVerified: serialized.isVerified,
    verificationBadge: serialized.verificationBadge,
    profileVisibility: serialized.profileVisibility,
  };
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}
