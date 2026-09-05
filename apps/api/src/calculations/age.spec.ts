import { calculateAge } from './age';

describe('calculateAge', () => {
  it('computes whole years as of a given reference date', () => {
    const result = calculateAge({ dateOfBirth: '1965-04-12', asOfDate: '2024-04-11' });
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe(58); // one day before the birthday
  });

  it('rolls over on the exact birthday', () => {
    const result = calculateAge({ dateOfBirth: '1965-04-12', asOfDate: '2024-04-12' });
    expect(result.value).toBe(59);
  });

  it('defaults the reference date to today when no asOfDate is given', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 40);
    const result = calculateAge({ dateOfBirth: dob });
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe(40);
  });

  it('is NOT_CALCULABLE without a date of birth', () => {
    const result = calculateAge({ dateOfBirth: null });
    expect(result.status).toBe('NOT_CALCULABLE');
    expect(result.value).toBeNull();
    expect(result.missingFields).toContain('dateOfBirth');
  });

  it('is NOT_CALCULABLE with an invalid date of birth', () => {
    const result = calculateAge({ dateOfBirth: 'not-a-date' });
    expect(result.status).toBe('NOT_CALCULABLE');
  });
});
