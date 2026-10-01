import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIELD_CATALOGUE } from './field-catalogue';
import { renderFieldMapping, summariseMapping } from './field-mapping';
import { REGISTRY_CLINICAL_MODELS, REGISTRY_ONLY, parseRegistrySchema } from './registry-schema';
import { DOCUMENT_CLASSES, ENTITY_TYPES } from './vocab';

const registry = parseRegistrySchema();
const registryKeys = new Set(registry.map((f) => `${f.model}.${f.field}`));

describe('registry field mapping', () => {
  it('parses the real registry schema', () => {
    for (const model of REGISTRY_CLINICAL_MODELS) {
      expect(registry.some((f) => f.model === model)).toBe(true);
    }
    expect(registryKeys.has('MaaStudy.lungShuntFraction')).toBe(true);
    expect(registryKeys.has('Episode.patient')).toBe(false); // relation navigation is not a column
  });

  it('accounts for every in-scope registry field (fed by extractor or explicitly registry-only)', () => {
    const { unaccounted } = summariseMapping(registry);
    expect(unaccounted.map((f) => `${f.model}.${f.field}`)).toEqual([]);
  });

  it('only targets registry columns that actually exist', () => {
    const bad = FIELD_CATALOGUE.flatMap((d) => d.registryTargets.filter((t) => !registryKeys.has(t)).map((t) => `${d.entity}.${d.key} → ${t}`));
    expect(bad).toEqual([]);
  });

  it('has no stale registry-only annotations', () => {
    expect(Object.keys(REGISTRY_ONLY).filter((k) => !registryKeys.has(k))).toEqual([]);
  });

  it('never marks a registry column as both extractor-fed and registry-only', () => {
    const fed = new Set(FIELD_CATALOGUE.flatMap((d) => d.registryTargets));
    expect(Object.keys(REGISTRY_ONLY).filter((k) => fed.has(k))).toEqual([]);
  });

  it('has unique (entity, key) pairs and valid vocab references', () => {
    const seen = new Set<string>();
    for (const d of FIELD_CATALOGUE) {
      const k = `${d.entity}.${d.key}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
      expect(ENTITY_TYPES).toContain(d.entity);
      for (const s of d.sources) expect(DOCUMENT_CLASSES).toContain(s);
      if (d.method === 'CALCULATE') expect(d.formulaId).toBeTruthy();
    }
  });

  it('never routes predicted dosimetry into delivered registry columns', () => {
    for (const d of FIELD_CATALOGUE.filter((x) => /predicted|planned|prescribed/.test(x.key))) {
      expect(d.registryTargets).not.toContain('TreatmentSession.administeredActivityGbq');
      expect(d.registryTargets).not.toContain('LesionDoseInjection.deliveredActivityGbq');
      expect(d.registryTargets).not.toContain('LesionDoseInjection.deliveredDoseGy');
    }
  });

  it('covers every completeness item named in the brief', () => {
    const required = (entity: string, key: string) => FIELD_CATALOGUE.find((d) => d.entity === entity && d.key === key)?.required;
    expect(required('baseline_assessment', 'diagnosis')).toBe(true);
    expect(required('baseline_assessment', 'ecog')).toBe(true);
    expect(required('laboratory_episode', 'bilirubin')).toBe(true);
    expect(required('laboratory_episode', 'albumin')).toBe(true);
    expect(required('laboratory_episode', 'inr')).toBe(true);
    expect(required('maa_study', 'lung_shunt_fraction_percent')).toBe(true);
    expect(required('dosimetry_plan', 'prescribed_activity_gbq')).toBe(true);
    expect(required('y90_treatment', 'delivered_activity_gbq')).toBe(true);
  });

  it('committed field_mapping.md is up to date with the catalogue and registry schema', () => {
    const committed = readFileSync(join(__dirname, '..', '..', '..', '..', 'docs', 'extractor', 'field_mapping.md'), 'utf8');
    expect(committed.trim()).toBe(renderFieldMapping(registry).trim());
  });
});
