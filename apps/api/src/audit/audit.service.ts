import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import type { Role, AuditEventType } from '@prisma/client';

export interface TransactionalAuditPayload {
  eventType: AuditEventType;
  entityType: string;
  entityId: string | null;
  userId: string;
  roleAtTime: Role;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  changedFields?: Record<string, { before: unknown; after: unknown }> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuthAuditPayload {
  eventType: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET' | 'ROLE_CHANGED';
  userId: string | null;
  roleAtTime: Role | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  async logInTx(tx: PrismaTx, payload: TransactionalAuditPayload): Promise<void> {
    await tx.auditLog.create({
      data: {
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        userId: payload.userId,
        roleAtTime: payload.roleAtTime,
        beforeSnapshot: (payload.beforeSnapshot ?? null) as never,
        afterSnapshot: (payload.afterSnapshot ?? null) as never,
        changedFields: (payload.changedFields ?? null) as never,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        metadata: (payload.metadata ?? null) as never,
      },
    });
  }

  async logAuth(payload: AuthAuditPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: payload.eventType,
          entityType: 'Auth',
          entityId: payload.userId,
          userId: payload.userId,
          roleAtTime: payload.roleAtTime,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          metadata: (payload.metadata ?? null) as never,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write auth audit event [${payload.eventType}]`, err instanceof Error ? err.stack : String(err));
    }
  }
}
