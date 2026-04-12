export function buildChangedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  dto: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> {
  const result: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(dto)) {
    if (dto[key] === undefined) continue;
    if (key === 'version') continue;
    result[key] = { before: before[key], after: after[key] };
  }
  return result;
}
