import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EpisodesService } from './episodes.service';
import { createTestClient, truncateAll } from '../test/db';
import { seedUser, seedPatient, seedMdtSession, seedMdtRecord } from '../test/fixtures';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import { ApiException } from '../common/filters/global-exception.filter';
import type { PrismaClient } from '@prisma/client';

const fakeRequest = { ip: '127.0.0.1', headers: {} } as unknown as Request;

describe('EpisodesService (integration)', () => {
  let moduleRef: TestingModule;
  let episodesService: EpisodesService;
  let rawClient: PrismaClient;
  let currentUser: UserResponseDto;
  let patientId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ providers: [PrismaService, AuditService, EpisodesService] }).compile();
    await moduleRef.init();
    episodesService = moduleRef.get(EpisodesService);
    rawClient = createTestClient();
    await rawClient.$connect();
  });

  afterAll(async () => {
    await rawClient.$disconnect();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await truncateAll(rawClient);
    const user = await seedUser(rawClient, { role: 'CONSULTANT_IR', email: `consultant-${Date.now()}-${Math.random()}@nhs.net` });
    currentUser = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, title: null, gmcNumber: null, role: user.role, isActive: true, version: 1, lastLoginAt: null, createdAt: user.createdAt, updatedAt: user.updatedAt } as UserResponseDto;
    const patient = await seedPatient(rawClient, user.id);
    patientId = patient.id;
  });

  it('creates a first episode with episodeNumber 1', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    expect(episode.episodeNumber).toBe(1);
    expect(episode.firstOrRepeat).toBe('FIRST');
    expect(episode.status).toBe('REFERRED');
  });

  it('sequences episodeNumber correctly under concurrent creation (serializable + retry)', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => episodesService.create(patientId, {}, currentUser, fakeRequest)));
    const numbers = results.map((r) => r.episodeNumber).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('lists episodes for a patient and gets one by id', async () => {
    const first = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const repeat = await episodesService.create(patientId, { firstOrRepeat: 'REPEAT', previousEpisodeId: first.id }, currentUser, fakeRequest);
    const list = await episodesService.listForPatient(patientId);
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.episodeNumber)).toEqual([1, 2]);

    const detail = await episodesService.getById(repeat.id);
    expect(detail.id).toBe(repeat.id);
    expect(detail.completeness.mdtRecordCount).toBe(0);
  });

  it('blocks creating a REPEAT episode with no previousEpisodeId', async () => {
    await expect(episodesService.create(patientId, { firstOrRepeat: 'REPEAT' }, currentUser, fakeRequest)).rejects.toMatchObject({
      code: 'READINESS_CHECK_FAILED',
    });
  });

  it('rejects an optimistic-lock conflict on patch with a stale version', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    await episodesService.patch(episode.id, { referralSource: 'GP referral', version: episode.version }, currentUser, fakeRequest);
    await expect(episodesService.patch(episode.id, { referralSource: 'Stale update', version: episode.version }, currentUser, fakeRequest)).rejects.toMatchObject({
      code: 'OPTIMISTIC_LOCK_CONFLICT',
    });
  });

  it('walks the full happy path from REFERRED to COMPLETED', async () => {
    let episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const session = await seedMdtSession(rawClient, currentUser.id);
    await seedMdtRecord(rawClient, { episodeId: episode.id, mdtSessionId: session.id, createdById: currentUser.id });
    await rawClient.diagnosis.create({ data: { episodeId: episode.id, tumourType: 'HCC', createdById: currentUser.id, updatedById: currentUser.id } });

    const path = [
      'AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED', 'AWAITING_MAPPING',
      'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED', 'AWAITING_TREATMENT',
      'TREATMENT_COMPLETED', 'EARLY_FOLLOW_UP', 'IMAGING_FOLLOW_UP', 'COMPLETED',
    ] as const;
    for (const toStatus of path) {
      const result = await episodesService.transition(episode.id, { toStatus, version: episode.version }, currentUser, fakeRequest);
      expect(result.alreadyInState).toBe(false);
      episode = result.record;
      expect(episode.status).toBe(toStatus);
    }
  });

  it('rejects an invalid (skipping) transition with 409 INVALID_STATE_TRANSITION', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    await expect(episodesService.transition(episode.id, { toStatus: 'COMPLETED', version: episode.version }, currentUser, fakeRequest)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  it('is idempotent when transitioning to the status the episode is already in', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const result = await episodesService.transition(episode.id, { toStatus: 'REFERRED', version: episode.version }, currentUser, fakeRequest);
    expect(result.alreadyInState).toBe(true);
    expect(result.record.status).toBe('REFERRED');
  });

  it('blocks completing an episode with unresolved readiness findings (missing diagnosis)', async () => {
    let episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const session = await seedMdtSession(rawClient, currentUser.id);
    await seedMdtRecord(rawClient, { episodeId: episode.id, mdtSessionId: session.id, createdById: currentUser.id });
    const path = ['AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED', 'AWAITING_MAPPING', 'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED', 'AWAITING_TREATMENT', 'TREATMENT_COMPLETED', 'EARLY_FOLLOW_UP', 'IMAGING_FOLLOW_UP'] as const;
    for (const toStatus of path) {
      const result = await episodesService.transition(episode.id, { toStatus, version: episode.version }, currentUser, fakeRequest);
      episode = result.record;
    }
    // No diagnosis was ever created for this episode.
    await expect(episodesService.transition(episode.id, { toStatus: 'COMPLETED', version: episode.version }, currentUser, fakeRequest)).rejects.toMatchObject({
      code: 'READINESS_CHECK_FAILED',
    });
  });

  it('rejects a WARNING-severity transition without an override, and accepts it with a valid override reason', async () => {
    let episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const r1 = await episodesService.transition(episode.id, { toStatus: 'AWAITING_MDT', version: episode.version }, currentUser, fakeRequest);
    episode = r1.record;

    // No MdtRecord exists yet for this episode -> MDT_APPROVED_WITHOUT_MDT_RECORD warning.
    await expect(episodesService.transition(episode.id, { toStatus: 'MDT_APPROVED', version: episode.version }, currentUser, fakeRequest)).rejects.toMatchObject({
      code: 'READINESS_CHECK_FAILED',
    });

    await expect(
      episodesService.transition(episode.id, { toStatus: 'MDT_APPROVED', version: episode.version, overrideWarnings: [{ code: 'MDT_APPROVED_WITHOUT_MDT_RECORD', reason: 'short' }] }, currentUser, fakeRequest),
    ).rejects.toMatchObject({ code: 'READINESS_CHECK_FAILED' });

    const result = await episodesService.transition(
      episode.id,
      { toStatus: 'MDT_APPROVED', version: episode.version, overrideWarnings: [{ code: 'MDT_APPROVED_WITHOUT_MDT_RECORD', reason: 'Urgent pathway, MDT discussion to follow retrospectively' }] },
      currentUser,
      fakeRequest,
    );
    expect(result.alreadyInState).toBe(false);
    expect(result.record.status).toBe('MDT_APPROVED');
  });

  it('duplicates an episode without copying any lesion/session data, and correctly increments episodeNumber', async () => {
    const source = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    await rawClient.diagnosis.create({ data: { episodeId: source.id, tumourType: 'HCC', aetiology: 'HBV', createdById: currentUser.id, updatedById: currentUser.id } });
    await rawClient.lesion.create({ data: { episodeId: source.id, lesionNumber: 1, createdById: currentUser.id, updatedById: currentUser.id } });

    const duplicate = await episodesService.duplicate(source.id, { copyDiagnosisBasics: true }, currentUser, fakeRequest);

    expect(duplicate.episodeNumber).toBe(2);
    expect(duplicate.firstOrRepeat).toBe('REPEAT');
    expect(duplicate.diagnosis?.tumourType).toBe('HCC');
    expect(duplicate.completeness.lesionCount).toBe(0);

    const lesionsOnDuplicate = await rawClient.lesion.count({ where: { episodeId: duplicate.id } });
    expect(lesionsOnDuplicate).toBe(0);
    const lesionsOnSource = await rawClient.lesion.count({ where: { episodeId: source.id } });
    expect(lesionsOnSource).toBe(1);
  });

  it('does not copy diagnosis when copyDiagnosisBasics is false', async () => {
    const source = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    await rawClient.diagnosis.create({ data: { episodeId: source.id, tumourType: 'HCC', createdById: currentUser.id, updatedById: currentUser.id } });
    const duplicate = await episodesService.duplicate(source.id, { copyDiagnosisBasics: false }, currentUser, fakeRequest);
    expect(duplicate.diagnosis).toBeNull();
  });

  it('propagates a real ApiException instance (not a generic Error) for validation failures', async () => {
    try {
      await episodesService.create(patientId, { firstOrRepeat: 'REPEAT' }, currentUser, fakeRequest);
      fail('expected create() to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
    }
  });
});
