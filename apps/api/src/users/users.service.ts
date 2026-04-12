import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PatchUserDto } from './dto/patch-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { throwOptimisticLockConflict, throwNotFound } from '../common/helpers/conflict.helper';

const BCRYPT_ROUNDS = 12;

function toDto(user: Record<string, unknown>): UserResponseDto {
  return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    return toDto(user as unknown as Record<string, unknown>);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return toDto(user as unknown as Record<string, unknown>);
  }

  async create(dto: CreateUserDto, createdById: string): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.temporaryPassword, BCRYPT_ROUNDS);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException({ code: 'DUPLICATE_EMAIL', message: 'A user with this email address already exists' });
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, firstName: dto.firstName, lastName: dto.lastName,
          title: dto.title ?? null, gmcNumber: dto.gmcNumber ?? null, role: dto.role, passwordHash, createdById },
      });
      return toDto(user as unknown as Record<string, unknown>);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
        throw new ConflictException({ code: 'DUPLICATE_EMAIL', message: 'A user with this email address already exists' });
      throw err;
    }
  }

  async patch(id: string, dto: PatchUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, version: dto.version },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.gmcNumber !== undefined && { gmcNumber: dto.gmcNumber }),
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.user.findUnique({ where: { id }, select: { version: true } });
        throwOptimisticLockConflict({ entityType: 'User', entityId: id, submittedVersion: dto.version, currentVersion: current?.version });
      }
      const fresh = await tx.user.findUnique({ where: { id } });
      if (!fresh) throwNotFound('User', id);
      return toDto(fresh as unknown as Record<string, unknown>);
    });
  }

  async list(params: { isActive?: boolean; limit?: number; page?: number }) {
    const { isActive, limit = 50, page = 1 } = params;
    const skip = (page - 1) * limit;
    const where = { ...(isActive !== undefined && { isActive }) };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users.map(u => toDto(u as unknown as Record<string, unknown>)), total };
  }
}
