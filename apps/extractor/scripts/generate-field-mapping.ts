import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderFieldMapping, summariseMapping } from '../src/domain/field-mapping';

const summary = summariseMapping();
if (summary.unaccounted.length > 0) {
  console.error('Unaccounted registry fields:', summary.unaccounted.map((f) => `${f.model}.${f.field}`).join(', '));
  process.exit(1);
}
const target = join(__dirname, '..', '..', '..', 'docs', 'extractor', 'field_mapping.md');
writeFileSync(target, renderFieldMapping() + '\n', 'utf8');
console.log(`Wrote ${target}`);
