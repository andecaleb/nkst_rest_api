"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../../database/prisma.service");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(configService, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('app.jwtAccessSecret', 'nkst-dev-access-secret'),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const session = await this.prisma.session.findUnique({
            where: { id: payload.sessionId },
        });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Session has expired or been signed out');
        }
        const member = await this.prisma.member.findUnique({
            where: { id: payload.sub },
            include: {
                administeredChurches: { select: { id: true } },
                memberRoles: { include: { role: true } },
                groupMemberships: {
                    where: { role: 'admin' },
                    select: { groupId: true },
                },
            },
        });
        if (!member || member.deletedAt || member.deactivatedAt) {
            throw new common_1.UnauthorizedException('Account is inactive or not found');
        }
        const roles = new Set([roles_constant_1.ROLES.MEMBER]);
        for (const mr of member.memberRoles) {
            roles.add(mr.role.name);
        }
        if (member.isPlatformAdmin) {
            roles.add(roles_constant_1.ROLES.PLATFORM_ADMIN);
        }
        if (member.administeredChurches.length > 0) {
            roles.add(roles_constant_1.ROLES.CHURCH_ADMIN);
        }
        if (member.groupMemberships.length > 0) {
            roles.add(roles_constant_1.ROLES.GROUP_ADMIN);
        }
        return {
            id: member.id,
            email: member.email,
            phone: member.phone,
            churchId: member.churchId,
            verificationState: member.verificationState,
            isPlatformAdmin: member.isPlatformAdmin,
            administeredChurchIds: member.administeredChurches.map((c) => c.id),
            roles: Array.from(roles),
            sessionId: session.id,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map