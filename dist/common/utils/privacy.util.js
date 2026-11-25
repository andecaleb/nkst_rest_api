"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMember = serializeMember;
exports.serializeMemberCard = serializeMemberCard;
exports.calculateAge = calculateAge;
const client_1 = require("@prisma/client");
const roles_constant_1 = require("../constants/roles.constant");
function serializeMember(member, viewer) {
    if (!member)
        return null;
    const isSelf = viewer?.id === member.id;
    const isPlatformAdmin = Boolean(viewer?.isPlatformAdmin);
    const isOwnChurchAdmin = Boolean(viewer?.administeredChurchIds?.includes(member.churchId));
    const canSeePrivateFields = member.profileVisibility === client_1.ProfileVisibility.public ||
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
        isVerified: member.verificationState === client_1.VerificationState.verified,
        verificationBadge: member.verificationState === client_1.VerificationState.verified ? 'Verified' : 'Unverified',
        profileVisibility: member.profileVisibility,
        photoUrl: canSeePrivateFields ? (member.photoUrl ?? roles_constant_1.DEFAULT_AVATAR_URL) : roles_constant_1.DEFAULT_AVATAR_URL,
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
        suspensionReason: isSelf || isPlatformAdmin || isOwnChurchAdmin ? member.suspensionReason : undefined,
    };
}
function serializeMemberCard(member, viewer) {
    if (!member)
        return null;
    const serialized = serializeMember(member, viewer);
    if (!serialized)
        return null;
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
function calculateAge(dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age;
}
//# sourceMappingURL=privacy.util.js.map