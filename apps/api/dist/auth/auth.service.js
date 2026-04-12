"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
const REFRESH_TOKEN_TTL_DAYS = 7;
const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = 'rlh_refresh';
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    usersService;
    auditService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService, usersService, auditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async login(email, password, request, response) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        const passwordHash = user?.passwordHash ?? '$2b$12$invalidhashpadding000000000000000';
        const isValid = !!user && (await bcrypt.compare(password, passwordHash));
        if (!isValid || !user) {
            await this.auditService.logAuth({ eventType: 'LOGIN_FAILED', userId: null, roleAtTime: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { attemptedEmail: email } });
            throw new common_1.UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
        }
        if (!user.isActive)
            throw new common_1.UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'This account is deactivated' });
        const accessToken = this.generateAccessToken(user);
        await this.issueRefreshToken(user.id, request, response);
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await this.auditService.logAuth({ eventType: 'LOGIN', userId: user.id, roleAtTime: user.role, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
        const userDto = await this.usersService.findById(user.id);
        return { accessToken, user: userDto };
    }
    async refresh(existingRawToken, request, response) {
        const result = await this.validateRefreshToken(existingRawToken);
        if (!result)
            throw new common_1.UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
        const { user, tokenRecord } = result;
        const accessToken = this.generateAccessToken(user);
        const rawNewToken = crypto.randomBytes(48).toString('hex');
        const newTokenHash = this.hashToken(rawNewToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
        await this.prisma.withinTransaction(async (tx) => {
            const revoked = await tx.refreshToken.updateMany({ where: { id: tokenRecord.id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
            if (revoked.count === 0)
                throw new common_1.UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
            const newRecord = await tx.refreshToken.create({ data: { userId: user.id, tokenHash: newTokenHash, expiresAt, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null } });
            await tx.refreshToken.update({ where: { id: tokenRecord.id }, data: { replacedByTokenId: newRecord.id } });
        }, 'read-committed');
        this.setRefreshCookie(response, rawNewToken, expiresAt);
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { accessToken };
    }
    async logout(refreshToken, userId, request, response) {
        if (refreshToken) {
            const tokenHash = this.hashToken(refreshToken);
            await this.prisma.withinTransaction(async (tx) => { await tx.refreshToken.updateMany({ where: { tokenHash, userId }, data: { revokedAt: new Date() } }); }, 'read-committed');
        }
        this.clearRefreshCookie(response);
        await this.auditService.logAuth({ eventType: 'LOGOUT', userId, roleAtTime: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
    }
    async validateRefreshToken(rawToken) {
        const tokenHash = this.hashToken(rawToken);
        const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
        if (!tokenRecord)
            return null;
        if (tokenRecord.revokedAt !== null)
            return null;
        if (tokenRecord.expiresAt < new Date())
            return null;
        if (!tokenRecord.user.isActive)
            return null;
        return { user: tokenRecord.user, tokenRecord };
    }
    async requestPasswordReset(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive)
            return;
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.logger.debug(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);
    }
    async completePasswordReset(_token, _newPassword, _request) {
        throw new common_1.BadRequestException({ code: 'NOT_IMPLEMENTED', message: 'Password reset not yet fully implemented' });
    }
    generateAccessToken(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return this.jwtService.sign(payload);
    }
    async issueRefreshToken(userId, request, response) {
        const rawToken = crypto.randomBytes(48).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null } });
        this.setRefreshCookie(response, rawToken, expiresAt);
    }
    hashToken(raw) { return crypto.createHash('sha256').update(raw).digest('hex'); }
    setRefreshCookie(response, token, expiresAt) {
        response.cookie(REFRESH_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires: expiresAt, path: '/api/v1/auth' });
    }
    clearRefreshCookie(response) {
        response.cookie(REFRESH_COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 0, path: '/api/v1/auth' });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        users_service_1.UsersService,
        audit_service_1.AuditService])
], AuthService);
