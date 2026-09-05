-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT_IR', 'FELLOW', 'CNS_COORDINATOR', 'DATA_MANAGER', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "BiologicalSex" AS ENUM ('MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('NHS_NUMBER', 'MRN_RLH', 'MRN_EXTERNAL', 'EXTERNAL_REFERRAL_ID');

-- CreateEnum
CREATE TYPE "RecordLockStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'LOCK', 'UNLOCK', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_RESET', 'ROLE_CHANGED', 'MERGE');

-- CreateEnum
CREATE TYPE "BclcStage" AS ENUM ('STAGE_0', 'STAGE_A', 'STAGE_B', 'STAGE_C', 'STAGE_D');

-- CreateEnum
CREATE TYPE "ChildPughGrade" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('REFERRED', 'AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED', 'AWAITING_MAPPING', 'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED', 'AWAITING_TREATMENT', 'TREATMENT_COMPLETED', 'EARLY_FOLLOW_UP', 'IMAGING_FOLLOW_UP', 'COMPLETED', 'CANCELLED', 'DEFERRED', 'NOT_SUITABLE', 'LOST_TO_FOLLOW_UP');

-- CreateEnum
CREATE TYPE "EpisodeType" AS ENUM ('FIRST', 'REPEAT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "gmcNumber" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "sex" "BiologicalSex" NOT NULL,
    "ethnicity" TEXT,
    "countryOfBirth" TEXT,
    "gpPractice" TEXT,
    "gpName" TEXT,
    "referringHospital" TEXT,
    "referringClinician" TEXT,
    "nhsNumberPendingUntil" TIMESTAMP(3),
    "vitalStatus" TEXT,
    "dateOfDeath" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_identifiers" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "identifierType" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "issuingOrg" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (partial unique index, not expressible via @@unique in schema.prisma)
CREATE UNIQUE INDEX "patient_identifiers_nhs_number_unique" ON "patient_identifiers"("value") WHERE "identifierType" = 'NHS_NUMBER';

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "firstOrRepeat" "EpisodeType" NOT NULL DEFAULT 'FIRST',
    "previousEpisodeId" TEXT,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'REFERRED',
    "deferredFromStatus" "EpisodeStatus",
    "referralDate" DATE,
    "referralSource" TEXT,
    "referringClinicianOverride" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "tumourType" TEXT NOT NULL,
    "aetiology" TEXT,
    "diagnosisDate" DATE,
    "histologyConfirmed" BOOLEAN,
    "calculatedBclcStage" "BclcStage",
    "confirmedBclcStage" "BclcStage",
    "bclcOverrideReason" TEXT,
    "calculatedTStage" TEXT,
    "calculatedNStage" TEXT,
    "calculatedMStage" TEXT,
    "confirmedTStage" TEXT,
    "confirmedNStage" TEXT,
    "confirmedMStage" TEXT,
    "tnmOverrideReason" TEXT,
    "calculatedCpScore" INTEGER,
    "calculatedCpGrade" "ChildPughGrade",
    "confirmedCpGrade" "ChildPughGrade",
    "cpOverrideReason" TEXT,
    "calculatedMeld3Score" DECIMAL(8,4),
    "calculatedMeldNaScore" DECIMAL(8,4),
    "meldOverrideReason" TEXT,
    "calculatedAlbiScore" DECIMAL(8,4),
    "calculatedAlbiGrade" INTEGER,
    "albiOverrideReason" TEXT,
    "calculationVersion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdt_sessions" (
    "id" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "location" TEXT,
    "chair" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mdt_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdt_records" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "mdtSessionId" TEXT NOT NULL,
    "clinicalSnapshotId" TEXT,
    "diseaseSummary" TEXT,
    "priorTreatmentSummary" TEXT,
    "decision" TEXT,
    "decisionDetail" TEXT,
    "decisionConditions" TEXT,
    "patientFitForProcedure" BOOLEAN,
    "performanceStatusAcceptable" BOOLEAN,
    "liverFunctionAcceptable" BOOLEAN,
    "tumourLoadAcceptable" BOOLEAN,
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdt_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_scores" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "scoreDate" DATE NOT NULL,
    "context" TEXT,
    "ecogScore" INTEGER,
    "ascites" TEXT,
    "encephalopathy" TEXT,
    "cpGrade" "ChildPughGrade",
    "cpTotalScore" INTEGER,
    "meld3Score" DECIMAL(8,4),
    "meldNaScore" DECIMAL(8,4),
    "meldNaScoreRounded" INTEGER,
    "albiGrade" INTEGER,
    "albiScore" DECIMAL(8,4),
    "bclcStage" "BclcStage",
    "bsaM2" DECIMAL(6,4),
    "weightKg" DECIMAL(6,2),
    "calculationVersion" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_panels" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "bilirubinTotalUmolL" DECIMAL(8,2),
    "albuminGL" DECIMAL(6,2),
    "inr" DECIMAL(6,3),
    "afpNgMl" DECIMAL(12,2),
    "plateletsE9L" DECIMAL(8,2),
    "creatinineUmolL" DECIMAL(8,2),
    "sodiumMmolL" DECIMAL(6,2),
    "onDialysis" BOOLEAN,
    "dialysisSessionsPastWeek" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_snapshots" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "snapshotContext" TEXT NOT NULL,
    "clinicalScoreId" TEXT,
    "labPanelId" TEXT,
    "ecogScore" INTEGER,
    "cpGrade" "ChildPughGrade",
    "cpTotalScore" INTEGER,
    "meld3Score" DECIMAL(8,4),
    "meldNaScore" DECIMAL(8,4),
    "meldNaScoreRounded" INTEGER,
    "albiGrade" INTEGER,
    "albiScore" DECIMAL(8,4),
    "bclcStage" "BclcStage",
    "bsaM2" DECIMAL(6,4),
    "weightKg" DECIMAL(6,2),
    "tumourStatusSummary" TEXT,
    "calculationVersion" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_studies" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "mappingSessionId" TEXT,
    "treatmentSessionId" TEXT,
    "studyDate" DATE NOT NULL,
    "modality" TEXT NOT NULL,
    "bodyPart" TEXT,
    "phase" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imaging_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesions" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "lesionNumber" INTEGER NOT NULL,
    "segment" TEXT,
    "laterality" TEXT,
    "isTargetLesion" BOOLEAN NOT NULL DEFAULT true,
    "diameterAxialMm" DECIMAL(7,2),
    "diameterCraniocaudalMm" DECIMAL(7,2),
    "diameterApMm" DECIMAL(7,2),
    "calculatedVolumeCm3" DECIMAL(10,3),
    "lirads" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesion_feeders" (
    "id" TEXT NOT NULL,
    "lesionId" TEXT NOT NULL,
    "feederNumber" INTEGER NOT NULL,
    "vesselName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesion_feeders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesion_dose_injections" (
    "id" TEXT NOT NULL,
    "treatmentSessionId" TEXT NOT NULL,
    "lesionId" TEXT NOT NULL,
    "lesionFeederId" TEXT,
    "deliveredActivityGbq" DECIMAL(10,4),
    "deliveredDoseGy" DECIMAL(10,3),
    "particleCount" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesion_dose_injections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mapping_sessions" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "sessionDate" DATE NOT NULL,
    "status" TEXT,
    "accessRoute" TEXT,
    "accessSite" TEXT,
    "catheterType" TEXT,
    "fluoroTimeMin" DECIMAL(6,2),
    "dapGyCm2" DECIMAL(10,4),
    "contrastVolumeMl" DECIMAL(8,2),
    "michelsAnatomy" TEXT,
    "embolicMaterial" TEXT,
    "complications" TEXT,
    "operatorUserId" TEXT,
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mapping_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maa_studies" (
    "id" TEXT NOT NULL,
    "mappingSessionId" TEXT NOT NULL,
    "imagingStudyId" TEXT,
    "studyDate" DATE NOT NULL,
    "injectedActivityMbq" DECIMAL(10,3),
    "lungShuntFraction" DECIMAL(6,3),
    "calculatedLsfRiskBand" TEXT,
    "extrahepaticUptake" BOOLEAN,
    "extrahepaticUptakeSites" TEXT,
    "maaDistributionMatchesTarget" BOOLEAN,
    "balanceCheckPass" BOOLEAN,
    "calculationVersion" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maa_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosimetry_plans" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "mappingSessionId" TEXT,
    "planDate" DATE NOT NULL,
    "planningModel" TEXT NOT NULL,
    "particleProduct" TEXT,
    "targetLiverVolumeCm3" DECIMAL(10,2),
    "treatedLiverVolumePercent" DECIMAL(6,2),
    "tumourLiverVolumeRatio" DECIMAL(6,3),
    "calculatedPrescribedActivityGbq" DECIMAL(10,4),
    "confirmedPrescribedActivityGbq" DECIMAL(10,4),
    "prescribedActivityOverrideReason" TEXT,
    "particleDensityCalc" DECIMAL(12,4),
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosimetry_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_sessions" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "dosimetryPlanId" TEXT,
    "sessionDate" DATE NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "status" TEXT,
    "accessRoute" TEXT,
    "accessSite" TEXT,
    "catheterType" TEXT,
    "fluoroTimeMin" DECIMAL(6,2),
    "dapGyCm2" DECIMAL(10,4),
    "contrastVolumeMl" DECIMAL(8,2),
    "embolicMaterial" TEXT,
    "particleProduct" TEXT,
    "administeredActivityGbq" DECIMAL(10,4),
    "maaBalanceCheckedAtDelivery" BOOLEAN,
    "complications" TEXT,
    "operatorUserId" TEXT,
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "lesionId" TEXT,
    "followUpDate" DATE NOT NULL,
    "intendedTimepoint" TEXT,
    "intervalMonths" INTEGER,
    "visitType" TEXT,
    "overallResponse" TEXT,
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toxicity_events" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "treatmentSessionId" TEXT,
    "onsetDate" DATE,
    "toxicityType" TEXT NOT NULL,
    "ctcaeGrade" INTEGER,
    "reildGrade" TEXT,
    "outcome" TEXT,
    "resolvedDate" DATE,
    "notes" TEXT,
    "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toxicity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_outcomes" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "outcomeStatus" TEXT,
    "progressionDate" DATE,
    "progressionReason" TEXT,
    "calculatedOsMonths" DECIMAL(8,3),
    "calculatedPfsMonths" DECIMAL(8,3),
    "osPfsFormulaVersion" TEXT,
    "confirmedOutcomeNotes" TEXT,
    "calculationVersion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_audits" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "inputsSnapshot" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedById" TEXT,

    CONSTRAINT "calculation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_options" (
    "id" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "roleAtTime" "Role",
    "eventType" "AuditEventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "changedFields" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "episodes_patientId_status_idx" ON "episodes"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_patientId_episodeNumber_key" ON "episodes"("patientId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "diagnoses_episodeId_key" ON "diagnoses"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "mdt_records_episodeId_mdtSessionId_key" ON "mdt_records"("episodeId", "mdtSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "lesions_episodeId_lesionNumber_key" ON "lesions"("episodeId", "lesionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "lesion_feeders_lesionId_feederNumber_key" ON "lesion_feeders"("lesionId", "feederNumber");

-- CreateIndex
CREATE UNIQUE INDEX "lesion_dose_injections_treatmentSessionId_lesionId_lesionFe_key" ON "lesion_dose_injections"("treatmentSessionId", "lesionId", "lesionFeederId");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_sessions_episodeId_sessionNumber_key" ON "treatment_sessions"("episodeId", "sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "episode_outcomes_episodeId_key" ON "episode_outcomes"("episodeId");

-- CreateIndex
CREATE INDEX "calculation_audits_entityType_entityId_formulaId_calculated_idx" ON "calculation_audits"("entityType", "entityId", "formulaId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_key_key" ON "vocabularies"("key");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_options_vocabularyId_code_key" ON "vocabulary_options"("vocabularyId", "code");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_timestamp_idx" ON "audit_logs"("entityType", "entityId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_previousEpisodeId_fkey" FOREIGN KEY ("previousEpisodeId") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_mdtSessionId_fkey" FOREIGN KEY ("mdtSessionId") REFERENCES "mdt_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_clinicalSnapshotId_fkey" FOREIGN KEY ("clinicalSnapshotId") REFERENCES "clinical_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_scores" ADD CONSTRAINT "clinical_scores_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_panels" ADD CONSTRAINT "lab_panels_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_clinicalScoreId_fkey" FOREIGN KEY ("clinicalScoreId") REFERENCES "clinical_scores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_labPanelId_fkey" FOREIGN KEY ("labPanelId") REFERENCES "lab_panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_mappingSessionId_fkey" FOREIGN KEY ("mappingSessionId") REFERENCES "mapping_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_treatmentSessionId_fkey" FOREIGN KEY ("treatmentSessionId") REFERENCES "treatment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesions" ADD CONSTRAINT "lesions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesion_feeders" ADD CONSTRAINT "lesion_feeders_lesionId_fkey" FOREIGN KEY ("lesionId") REFERENCES "lesions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesion_dose_injections" ADD CONSTRAINT "lesion_dose_injections_treatmentSessionId_fkey" FOREIGN KEY ("treatmentSessionId") REFERENCES "treatment_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesion_dose_injections" ADD CONSTRAINT "lesion_dose_injections_lesionId_fkey" FOREIGN KEY ("lesionId") REFERENCES "lesions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesion_dose_injections" ADD CONSTRAINT "lesion_dose_injections_lesionFeederId_fkey" FOREIGN KEY ("lesionFeederId") REFERENCES "lesion_feeders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mapping_sessions" ADD CONSTRAINT "mapping_sessions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maa_studies" ADD CONSTRAINT "maa_studies_mappingSessionId_fkey" FOREIGN KEY ("mappingSessionId") REFERENCES "mapping_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maa_studies" ADD CONSTRAINT "maa_studies_imagingStudyId_fkey" FOREIGN KEY ("imagingStudyId") REFERENCES "imaging_studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosimetry_plans" ADD CONSTRAINT "dosimetry_plans_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosimetry_plans" ADD CONSTRAINT "dosimetry_plans_mappingSessionId_fkey" FOREIGN KEY ("mappingSessionId") REFERENCES "mapping_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_sessions" ADD CONSTRAINT "treatment_sessions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_sessions" ADD CONSTRAINT "treatment_sessions_dosimetryPlanId_fkey" FOREIGN KEY ("dosimetryPlanId") REFERENCES "dosimetry_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lesionId_fkey" FOREIGN KEY ("lesionId") REFERENCES "lesions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toxicity_events" ADD CONSTRAINT "toxicity_events_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toxicity_events" ADD CONSTRAINT "toxicity_events_treatmentSessionId_fkey" FOREIGN KEY ("treatmentSessionId") REFERENCES "treatment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_outcomes" ADD CONSTRAINT "episode_outcomes_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_options" ADD CONSTRAINT "vocabulary_options_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

