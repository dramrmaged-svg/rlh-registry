import { Prisma } from '@prisma/client';
import { serializeDecimals } from './decimal.helper';

describe('serializeDecimals', () => {
  it('converts Decimal instances to strings', () => {
    const record = { a: new Prisma.Decimal('12.34'), b: 'text' };
    const result = serializeDecimals(record);
    expect(result.a).toBe('12.34');
    expect(typeof result.a).toBe('string');
  });

  it('leaves null, undefined, numbers, and plain values untouched', () => {
    const record = { a: null, b: undefined, c: 5, d: 'x', e: true };
    expect(serializeDecimals(record)).toEqual(record);
  });

  it('does not mutate the original record', () => {
    const record = { a: new Prisma.Decimal('1') };
    serializeDecimals(record);
    expect(record.a).toBeInstanceOf(Prisma.Decimal);
  });
});
