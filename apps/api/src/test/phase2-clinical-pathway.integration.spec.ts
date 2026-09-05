import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EpisodesService } from '../episodes/episodes.service';
import { LesionsService } from '../lesions/lesions.service';
import { DiagnosisService } from '../diagnosis/diagnosis.service';
import { MappingService } from '../mapping/mapping.service';
import { DosimetryService } from '../dosimetry/dosimetry.service';
import { TreatmentService } from '../treatment/treatment.service';
import { FollowUpService } from '../followup/followup.service';
import { ToxicityService } from '../toxicity/toxicity.service';
import { createTestClient, truncateAll } from './db';
import { seedUser, seedPatient } from './fixtures';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { PrismaClient } from '@prisma/client';

const fakeRequest = { ip: '127.0.0.1', headers: {} } as unknown as Request;

describe('Phase 2 clinical pathway (integration)', () => {
  let moduleRef: TestingModule;
  let episodesService: EpisodesService;
  let lesionsService: LesionsService;
  let diagnosisService: DiagnosisService;
  let mappingService: MappingService;
  let dosimetryService: DosimetryService;
  let treatmentService: TreatmentService;
  let followUpService: FollowUpService;
  let toxicityService: ToxicityService;
  let rawClient: PrismaClient;
  let currentUser: UserResponseDto;
  let patientId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [PrismaService, AuditService, EpisodesService, LesionsService, DiagnosisService, MappingService, DosimetryService, TreatmentService, FollowUpService, ToxicityService],
    }).compile();
    await moduleRef.init();
    episodesService = moduleRef.get(EpisodesService);
    lesionsService = moduleRef.get(LesionsService);
    diagnosisService = moduleRef.get(DiagnosisService);
    mappingService = moduleRef.get(MappingService);
    dosimetryService = moduleRef.get(DosimetryService);
    treatmentService = moduleRef.get(TreatmentService);
    followUpService = moduleRef.get(FollowUpService);
    toxicityService = moduleRef.get(ToxicityService);
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

  it('walks a full episode from referral through treatment, follow-up and toxicity across all Phase 2 modules', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);

    // Diagnosis + recalculate exercises the Phase 1 calculation engine end-to-end via the API.
    await diagnosisService.create(episode.id, { tumourType: 'HCC', aetiology: 'HBV' }, currentUser, fakeRequest);
    const recalculated = await diagnosisService.recalculate(
      episode.id,
      { bilirubinUmolL: 20, albuminGL: 40, inr: 1.0, creatinineUmolL: 70, sodiumMmolL: 138, sex: 'FEMALE', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: false },
      currentUser,
      fakeRequest,
    );
    expect(recalculated.diagnosis.calculatedCpGrade).toBe('A');
    expect(recalculated.diagnosis.calculatedBclcStage).toBe('STAGE_A');
    expect(recalculated.calculations.find((c) => c.formulaId === 'CHILD_PUGH')?.status).toBe('CALCULATED');
    const calcAuditRows = await rawClient.calculationAudit.count({ where: { entityId: recalculated.diagnosis.id } });
    expect(calcAuditRows).toBe(5); // one per formula run

    // Lesion
    const lesion = await lesionsService.create(episode.id, { segment: 'VII', diameterAxialMm: 22 }, currentUser, fakeRequest);
    expect(lesion.lesionNumber).toBe(1);

    // Mapping session + MAA study — LSF risk band computed server-side.
    const mappingSession = await mappingService.create(episode.id, { sessionDate: '2024-04-01' }, currentUser, fakeRequest);
    const maaStudy = await mappingService.createMaaStudy(mappingSession.id, { studyDate: '2024-04-01', lungShuntFraction: 7 }, currentUser, fakeRequest);
    expect(maaStudy.calculatedLsfRiskBand).toBe('BORDERLINE');

    // Dosimetry plan — treatment session blocked until this is approved.
    const dosimetryPlan = await dosimetryService.create(episode.id, { mappingSessionId: mappingSession.id, planDate: '2024-04-05', planningModel: 'Partition' }, currentUser, fakeRequest);

    await expect(treatmentService.create(episode.id, { sessionDate: '2024-04-10' }, currentUser, fakeRequest)).rejects.toMatchObject({ code: 'READINESS_CHECK_FAILED' });

    const approved = await dosimetryService.approve(dosimetryPlan.id, currentUser, fakeRequest);
    expect(approved.alreadyInState).toBe(false);
    expect(approved.record.lockStatus).toBe('LOCKED');
    const reapproved = await dosimetryService.approve(dosimetryPlan.id, currentUser, fakeRequest);
    expect(reapproved.alreadyInState).toBe(true);

    // Now the treatment session can be created without an override.
    const treatmentSession = await treatmentService.create(episode.id, { dosimetryPlanId: dosimetryPlan.id, sessionDate: '2024-04-10' }, currentUser, fakeRequest);
    expect(treatmentSession.sessionNumber).toBe(1);

    // A second treatment session (e.g. staged bilobar) still succeeds and sequences correctly.
    const secondSession = await treatmentService.create(episode.id, { sessionDate: '2024-04-17' }, currentUser, fakeRequest);
    expect(secondSession.sessionNumber).toBe(2);

    // Dose injection linking the lesion to the treatment session.
    const injection = await treatmentService.createDoseInjection(treatmentSession.id, { lesionId: lesion.id, deliveredActivityGbq: 1.5, deliveredDoseGy: 120 }, currentUser, fakeRequest);
    expect(injection.lesionId).toBe(lesion.id);

    // Follow-up linked to the lesion.
    const followUp = await followUpService.create(episode.id, { lesionId: lesion.id, followUpDate: '2024-07-10', intendedTimepoint: '3m', overallResponse: 'PR' }, currentUser, fakeRequest);
    expect(followUp.lesionId).toBe(lesion.id);

    // Toxicity event linked to the treatment session.
    const toxicity = await toxicityService.create(episode.id, { treatmentSessionId: treatmentSession.id, toxicityType: 'Post-embolisation syndrome', ctcaeGrade: 2 }, currentUser, fakeRequest);
    expect(toxicity.treatmentSessionId).toBe(treatmentSession.id);

    const finalEpisode = await episodesService.getById(episode.id);
    expect(finalEpisode.completeness.lesionCount).toBe(1);
    expect(finalEpisode.completeness.treatmentSessionCount).toBe(2);
    expect(finalEpisode.completeness.followUpCount).toBe(1);
    expect(finalEpisode.completeness.toxicityEventCount).toBe(1);
  });

  it('allows a treatment session before dosimetry approval only with a valid override reason', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const session = await treatmentService.create(
      episode.id,
      { sessionDate: '2024-04-10', overrideWarnings: [{ code: 'TREATMENT_WITHOUT_APPROVED_DOSIMETRY_PLAN', reason: 'Compassionate urgent pathway, dosimetry approval to follow' }] },
      currentUser,
      fakeRequest,
    );
    expect(session.sessionNumber).toBe(1);
  });

  it('rejects a lesion dose injection whose lesion belongs to a different episode', async () => {
    const episodeA = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const episodeB = await episodesService.create(patientId, { firstOrRepeat: 'REPEAT', previousEpisodeId: episodeA.id }, currentUser, fakeRequest);
    const lesionOnA = await lesionsService.create(episodeA.id, {}, currentUser, fakeRequest);
    const dosimetryPlan = await dosimetryService.create(episodeB.id, { planDate: '2024-04-05', planningModel: 'Partition' }, currentUser, fakeRequest);
    await dosimetryService.approve(dosimetryPlan.id, currentUser, fakeRequest);
    const sessionOnB = await treatmentService.create(episodeB.id, { sessionDate: '2024-04-10' }, currentUser, fakeRequest);

    await expect(treatmentService.createDoseInjection(sessionOnB.id, { lesionId: lesionOnA.id }, currentUser, fakeRequest)).rejects.toMatchObject({ code: 'LESION_EPISODE_MISMATCH' });
  });

  it('locks a dosimetry plan against further edits once approved', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const plan = await dosimetryService.create(episode.id, { planDate: '2024-04-05', planningModel: 'MIRD' }, currentUser, fakeRequest);
    await dosimetryService.approve(plan.id, currentUser, fakeRequest);
    await expect(dosimetryService.patch(plan.id, { planningModel: 'Voxel-based', version: plan.version }, currentUser, fakeRequest)).rejects.toMatchObject({ code: 'RECORD_LOCKED' });
  });

  it('soft-deletes a lesion and excludes it from subsequent listings', async () => {
    const episode = await episodesService.create(patientId, {}, currentUser, fakeRequest);
    const lesion = await lesionsService.create(episode.id, {}, currentUser, fakeRequest);
    await lesionsService.remove(lesion.id, lesion.version, currentUser, fakeRequest);
    const remaining = await lesionsService.listForEpisode(episode.id);
    expect(remaining).toHaveLength(0);
  });
});
