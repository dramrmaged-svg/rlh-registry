-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT_IR', 'FELLOW', 'CNS_COORDINATOR', 'DATA_MANAGER', 'READ_ONLY');
CREATE TYPE "BiologicalSex" AS ENUM ('MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN');
CREATE TYPE "IdentifierType" AS ENUM ('NHS_NUMBER', 'MRN_RLH', 'MRN_EXTERNAL', 'EXTERNAL_REFERRAL_ID');
CREATE TYPE "RecordLockStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');
CREATE TYPE "AuditEventType" AS ENUM ('CREATE','UPDATE','DELETE','SUBMIT','APPROVE','LOCK','UNLOCK','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_RESET','ROLE_CHANGED','MERGE');
CREATE TYPE "BclcStage" AS ENUM ('STAGE_0','STAGE_A','STAGE_B','STAGE_C','STAGE_D');
CREATE TYPE "ChildPughGrade" AS ENUM ('A','B','C');

CREATE TABLE "users" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "refresh_tokens" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

CREATE TABLE "patients" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "patient_identifiers" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
CREATE UNIQUE INDEX "patient_identifiers_nhs_number_unique" ON "patient_identifiers"("value") WHERE "identifierType" = 'NHS_NUMBER';

CREATE TABLE "diagnoses" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "tumourType" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "baselineBclcStage" "BclcStage",
  "diagnosisDate" DATE,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mdt_sessions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionDate" DATE NOT NULL,
  "location" TEXT,
  "chair" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mdt_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mdt_records" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
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
  CONSTRAINT "mdt_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mdt_records_patient_session_unique" UNIQUE ("patientId", "mdtSessionId")
);

CREATE TABLE "clinical_scores" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "scoreDate" DATE NOT NULL,
  "ecogScore" INTEGER,
  "cpGrade" "ChildPughGrade",
  "cpTotalScore" INTEGER,
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

CREATE TABLE "lab_panels" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "collectedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "bilirubinTotalUmolL" DECIMAL(8,2),
  "albuminGL" DECIMAL(6,2),
  "inr" DECIMAL(6,3),
  "afpNgMl" DECIMAL(12,2),
  "plateletsE9L" DECIMAL(8,2),
  "creatinineUmolL" DECIMAL(8,2),
  "sodiumMmolL" DECIMAL(6,2),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_panels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_snapshots" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "snapshotDate" DATE NOT NULL,
  "snapshotContext" TEXT NOT NULL,
  "clinicalScoreId" TEXT,
  "labPanelId" TEXT,
  "ecogScore" INTEGER,
  "cpGrade" "ChildPughGrade",
  "cpTotalScore" INTEGER,
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

CREATE TABLE "treatment_courses" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "startedAt" DATE NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treatment_courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procedures" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "treatmentCourseId" TEXT NOT NULL,
  "procedureType" TEXT NOT NULL,
  "laterality" TEXT NOT NULL,
  "plannedDate" DATE,
  "actualDate" DATE,
  "sessionStatus" TEXT,
  "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "follow_ups" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "followUpDate" DATE NOT NULL,
  "lockStatus" "RecordLockStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "deletedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "imaging_studies" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" TEXT NOT NULL,
  "studyDate" DATE NOT NULL,
  "modality" TEXT NOT NULL,
  "bodyPart" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "imaging_studies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

CREATE INDEX "audit_logs_entityType_entityId_timestamp_idx" ON "audit_logs"("entityType","entityId","timestamp");
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId","timestamp");
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "audit_logs"("eventType","timestamp");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patients" ADD CONSTRAINT "patients_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_mdtSessionId_fkey" FOREIGN KEY ("mdtSessionId") REFERENCES "mdt_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_clinicalSnapshotId_fkey" FOREIGN KEY ("clinicalSnapshotId") REFERENCES "clinical_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mdt_records" ADD CONSTRAINT "mdt_records_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinical_scores" ADD CONSTRAINT "clinical_scores_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_panels" ADD CONSTRAINT "lab_panels_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_clinicalScoreId_fkey" FOREIGN KEY ("clinicalScoreId") REFERENCES "clinical_scores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinical_snapshots" ADD CONSTRAINT "clinical_snapshots_labPanelId_fkey" FOREIGN KEY ("labPanelId") REFERENCES "lab_panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "treatment_courses" ADD CONSTRAINT "treatment_courses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_treatmentCourseId_fkey" FOREIGN KEY ("treatmentCourseId") REFERENCES "treatment_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "imaging_studies" ADD CONSTRAINT "imaging_studies_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
