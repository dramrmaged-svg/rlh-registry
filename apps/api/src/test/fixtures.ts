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

export async function seedEpisode(client: PrismaClient, createdById: string, opts: { patientId: string; episodeNumber?: number; firstOrRepeat?: string; previousEpisodeId?: string; status?: string } = {} as never) {
  return client.episode.create({
    data: {
      patientId: opts.patientId,
      episodeNumber: opts.episodeNumber ?? 1,
      firstOrRepeat: (opts.firstOrRepeat ?? 'FIRST') as never,
      previousEpisodeId: opts.previousEpisodeId ?? null,
      status: (opts.status ?? 'REFERRED') as never,
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedDiagnosis(client: PrismaClient, createdById: string, opts: { episodeId: string; tumourType?: string }) {
  return client.diagnosis.create({
    data: {
      episodeId: opts.episodeId,
      tumourType: opts.tumourType ?? 'HCC',
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedMdtRecord(client: PrismaClient, opts: { episodeId: string; mdtSessionId: string; createdById: string; lockStatus?: string }) {
  return client.mdtRecord.create({
    data: {
      episodeId: opts.episodeId,
      mdtSessionId: opts.mdtSessionId,
      lockStatus: (opts.lockStatus ?? 'DRAFT') as never,
      createdById: opts.createdById,
      updatedById: opts.createdById,
    },
  });
}

export async function seedLesion(client: PrismaClient, createdById: string, opts: { episodeId: string; lesionNumber?: number }) {
  return client.lesion.create({
    data: {
      episodeId: opts.episodeId,
      lesionNumber: opts.lesionNumber ?? 1,
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedMappingSession(client: PrismaClient, createdById: string, opts: { episodeId: string; sessionDate?: Date }) {
  return client.mappingSession.create({
    data: {
      episodeId: opts.episodeId,
      sessionDate: opts.sessionDate ?? new Date('2024-04-01'),
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedDosimetryPlan(client: PrismaClient, createdById: string, opts: { episodeId: string; planDate?: Date; planningModel?: string }) {
  return client.dosimetryPlan.create({
    data: {
      episodeId: opts.episodeId,
      planDate: opts.planDate ?? new Date('2024-04-10'),
      planningModel: opts.planningModel ?? 'BSA',
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedTreatmentSession(client: PrismaClient, createdById: string, opts: { episodeId: string; sessionNumber?: number; sessionDate?: Date }) {
  return client.treatmentSession.create({
    data: {
      episodeId: opts.episodeId,
      sessionNumber: opts.sessionNumber ?? 1,
      sessionDate: opts.sessionDate ?? new Date('2024-04-20'),
      createdById,
      updatedById: createdById,
    },
  });
}

export async function seedVocabulary(client: PrismaClient, opts: { key: string; label?: string; options: Array<{ code: string; label: string; sortOrder?: number }> }) {
  return client.vocabulary.create({
    data: {
      key: opts.key,
      label: opts.label ?? opts.key,
      options: { create: opts.options.map((o, i) => ({ code: o.code, label: o.label, sortOrder: o.sortOrder ?? i })) },
    },
    include: { options: true },
  });
}
