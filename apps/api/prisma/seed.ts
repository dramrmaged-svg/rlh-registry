import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DIAGNOSIS_TUMOUR_TYPE } from '../src/vocabularies/seed-data/diagnosis-tumour-type';
import { AETIOLOGY } from '../src/vocabularies/seed-data/aetiology';
import { PVTT } from '../src/vocabularies/seed-data/pvtt';
import { LIRADS } from '../src/vocabularies/seed-data/lirads';
import { MICHELS_ANATOMY } from '../src/vocabularies/seed-data/michels-anatomy';
import { EMBOLIC_MATERIAL_MAPPING } from '../src/vocabularies/seed-data/embolic-material-mapping';
import { EMBOLIC_MATERIAL_TREATMENT } from '../src/vocabularies/seed-data/embolic-material-treatment';
import { PLANNING_MODEL } from '../src/vocabularies/seed-data/planning-model';
import { PARTICLE_PRODUCT } from '../src/vocabularies/seed-data/particle-product';
import { PROGRESSION_REASON } from '../src/vocabularies/seed-data/progression-reason';
import { REILD_GRADE } from '../src/vocabularies/seed-data/reild-grade';
import { OUTCOME_STATUS } from '../src/vocabularies/seed-data/outcome-status';
import { MDT_DECISION } from '../src/vocabularies/seed-data/mdt-decision';

const prisma = new PrismaClient();

const VOCABULARIES = [
  DIAGNOSIS_TUMOUR_TYPE,
  AETIOLOGY,
  PVTT,
  LIRADS,
  MICHELS_ANATOMY,
  EMBOLIC_MATERIAL_MAPPING,
  EMBOLIC_MATERIAL_TREATMENT,
  PLANNING_MODEL,
  PARTICLE_PRODUCT,
  PROGRESSION_REASON,
  REILD_GRADE,
  OUTCOME_STATUS,
  MDT_DECISION,
];

// Bootstrap-only: without at least one user, nobody can log in to create
// further users (POST /users requires ADMIN). Configurable via env so a
// real deployment isn't stuck with this literal default password —
// override SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD before seeding anywhere
// beyond local dev.
async function seedAdminUser(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@rlh-registry.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user '${email}' already exists, skipping.`);
    return;
  }
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);
  // createdById is left null: this account is a system bootstrap, not created by another user.
  await prisma.user.create({
    data: { email, passwordHash, firstName: 'Registry', lastName: 'Administrator', role: 'ADMIN', isActive: true },
  });
  console.log(`Seeded admin user '${email}' — CHANGE THIS PASSWORD before any real deployment.`);
}

async function main(): Promise<void> {
  await seedAdminUser();
  for (const vocab of VOCABULARIES) {
    await prisma.vocabulary.upsert({
      where: { key: vocab.key },
      update: { label: vocab.label },
      create: { key: vocab.key, label: vocab.label },
    });
    const record = await prisma.vocabulary.findUniqueOrThrow({ where: { key: vocab.key } });
    for (const [index, option] of vocab.options.entries()) {
      await prisma.vocabularyOption.upsert({
        where: { vocabularyId_code: { vocabularyId: record.id, code: option.code } },
        update: { label: option.label, sortOrder: index },
        create: { vocabularyId: record.id, code: option.code, label: option.label, sortOrder: index },
      });
    }
    console.log(`Seeded vocabulary '${vocab.key}' (${vocab.options.length} options)`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
