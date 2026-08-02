import { PrismaClient } from '@prisma/client';
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

async function main(): Promise<void> {
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
