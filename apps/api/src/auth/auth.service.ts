import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { JwtPayload } from './strategies/jwt.strategy';
import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';

const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_COOKIE_NAME = 'rlh_refresh';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string, request: Request, response: Response): Promise<{ accessToken: string; user: UserResponseDto }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordHash = user?.passwordHash ?? '$2b$12$invalidhashpadding000000000000000';
    const isValid = !!user && (await bcrypt.compare(password, passwordHash));
    if (!isValid || !user) {
      await this.auditService.logAuth({ eventType: 'LOGIN_FAILED', userId: null, roleAtTime: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { attemptedEmail: email } });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    if (!user.isActive) throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'This account is deactivated' });
    const accessToken = this.generateAccessToken(user);
    await this.issueRefreshToken(user.id, request, response);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.auditService.logAuth({ eventType: 'LOGIN', userId: user.id, roleAtTime: user.role as Role, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
    const userDto = await this.usersService.findById(user.id);
    return { accessToken, user: userDto };
  }

  async refresh(existingRawToken: string, request: Request, response: Response): Promise<{ accessToken: string }> {
    const result = await this.validateRefreshToken(existingRawToken);
    if (!result) throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
    const { user, tokenRecord } = result;
    const accessToken = this.generateAccessToken(user);
    const rawNewToken = crypto.randomBytes(48).toString('hex');
    const newTokenHash = this.hashToken(rawNewToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.withinTransaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({ where: { id: tokenRecord.id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { revokedAt: new Date() } });
      if (revoked.count === 0) throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
      const newRecord = await tx.refreshToken.create({ data: { userId: user.id, tokenHash: newTokenHash, expiresAt, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null } });
      await tx.refreshToken.update({ where: { id: tokenRecord.id }, data: { replacedByTokenId: newRecord.id } });
    }, 'read-committed');
    this.setRefreshCookie(response, rawNewToken, expiresAt);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { accessToken };
  }

  async logout(refreshToken: string | undefined, userId: string, request: Request, response: Response): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.withinTransaction(async (tx) => { await tx.refreshToken.updateMany({ where: { tokenHash, userId }, data: { revokedAt: new Date() } }); }, 'read-committed');
    }
    this.clearRefreshCookie(response);
    await this.auditService.logAuth({ eventType: 'LOGOUT', userId, roleAtTime: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
  }

  async validateRefreshToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const tokenRecord = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!tokenRecord) return null;
    if (tokenRecord.revokedAt !== null) return null;
    if (tokenRecord.expiresAt < new Date()) return null;
    if (!tokenRecord.user.isActive) return null;
    return { user: tokenRecord.user, tokenRecord };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return;
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.logger.debug(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);
  }

  async completePasswordReset(token: string, newPassword: string, request: Request): Promise<void> {
    void token; void newPassword; void request;
    throw new BadRequestException({ code: 'NOT_IMPLEMENTED', message: 'Password reset not yet fully implemented' });
  }

  private generateAccessToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private async issueRefreshToken(userId: string, request: Request, response: Response): Promise<void> {
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null } });
    this.setRefreshCookie(response, rawToken, expiresAt);
  }

  private hashToken(raw: string): string { return crypto.createHash('sha256').update(raw).digest('hex'); }

  private setRefreshCookie(response: Response, token: string, expiresAt: Date): void {
    response.cookie(REFRESH_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires: expiresAt, path: '/api/v1/auth' });
  }

  private clearRefreshCookie(response: Response): void {
    response.cookie(REFRESH_COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 0, path: '/api/v1/auth' });
  }
}
