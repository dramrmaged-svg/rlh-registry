CREATE TYPE "ChestXrayFindingType" AS ENUM (
  'CARDIOMEGALY',
  'PLEURAL_EFFUSION',
  'PNEUMOTHORAX',
  'CONSOLIDATION',
  'ATELECTASIS',
  'PULMONARY_OEDEMA',
  'NODULE_MASS',
  'PNEUMOPERITONEUM',
  'RIB_FRACTURE',
  'SPINE_FRACTURE',
  'NO_FINDING'
);

CREATE TYPE "ChestXrayLaterality" AS ENUM ('LEFT', 'RIGHT', 'BILATERAL', 'NA');

CREATE TYPE "AiReviewStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'AMENDED');

CREATE TABLE "chest_xray_ai_reports" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId"      TEXT NOT NULL,
  "imagingStudyId" TEXT,
  "studyDate"      DATE NOT NULL,
  "aiModelName"    TEXT NOT NULL,
  "aiModelVersion" TEXT NOT NULL,
  "processedAt"    TIMESTAMP(3) NOT NULL,
  "rawOutputJson"  JSONB,
  "reviewStatus"   "AiReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewedById"   TEXT,
  "reviewedAt"     TIMESTAMP(3),
  "reviewNotes"    TEXT,
  "version"        INTEGER NOT NULL DEFAULT 1,
  "createdById"    TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chest_xray_ai_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chest_xray_ai_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id"),
  CONSTRAINT "chest_xray_ai_reports_imagingStudyId_fkey" FOREIGN KEY ("imagingStudyId") REFERENCES "imaging_studies"("id")
);

CREATE INDEX "chest_xray_ai_reports_patientId_studyDate_idx" ON "chest_xray_ai_reports"("patientId", "studyDate" DESC);
CREATE INDEX "chest_xray_ai_reports_reviewStatus_idx" ON "chest_xray_ai_reports"("reviewStatus");

CREATE TABLE "chest_xray_ai_findings" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "reportId"        TEXT NOT NULL,
  "findingType"     "ChestXrayFindingType" NOT NULL,
  "laterality"      "ChestXrayLaterality" NOT NULL DEFAULT 'NA',
  "confidenceScore" DECIMAL(5,4) NOT NULL,
  "isPresent"       BOOLEAN NOT NULL,
  "severity"        TEXT,
  "radiologistNote" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chest_xray_ai_findings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chest_xray_ai_findings_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "chest_xray_ai_reports"("id") ON DELETE CASCADE
);

CREATE INDEX "chest_xray_ai_findings_reportId_idx" ON "chest_xray_ai_findings"("reportId");
