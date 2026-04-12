import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ROUNDS = 4;

export async function seedUser(client: PrismaClient, opts: { role?: string; email?: string; isActive?: boolean } = {}) {
  return client.user.create({
    data: {
      email: opts.email ?? `test-${Date.now()}@nhs.net`,
      passwordHash: await bcrypt.hash('TestPass123!', ROUNDS),
      firstName: 'Test',
      lastName: 'User',
      role: (opts.role ?? 'CONSULTANT_IR') as never,
      isActive: opts.isActive ?? true,
    },
  });
}

export async function seedPatient(client: PrismaClient, createdById: string, opts: { firstName?: string; lastName?: string } = {}) {
  return client.patient.create({
    data: {
      firstName: opts.firstName ?? 'James',
      lastName: opts.lastName ?? 'Miller',
      dateOfBirth: new Date('1965-04-12'),
      sex: 'MALE' as never,
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedMdtSession(client: PrismaClient, createdById: string) {
  return client.mdtSession.create({
    data: { sessionDate: new Date('2024-03-20'), createdById },
  });
}

export async function seedMdtRecord(client: PrismaClient, opts: { patientId: string; mdtSessionId: string; createdById: string; lockStatus?: string }) {
  return client.mdtRecord.create({
    data: {
      patientId: opts.patientId,
      mdtSessionId: opts.mdtSessionId,
      lockStatus: (opts.lockStatus ?? 'DRAFT') as never,
      createdById: opts.createdById,
      updatedById: opts.createdById,
    },
  });
}
