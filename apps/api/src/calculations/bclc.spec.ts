import { calculateBclcStage } from './bclc';

describe('calculateBclcStage', () => {
  it('stages D when Child-Pugh is C', () => {
    const result = calculateBclcStage({ childPughGrade: 'C', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: false });
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe('D');
  });

  it('stages D when ECOG >= 4, regardless of Child-Pugh', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 4, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('D');
  });

  it('stages C for extrahepatic spread', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: true });
    expect(result.value).toBe('C');
  });

  it('stages C for main/lobar PVTT', () => {
    expect(calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: 'Main', extrahepaticSpread: false }).value).toBe('C');
    expect(calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: 'Lobar', extrahepaticSpread: false }).value).toBe('C');
  });

  it('stages C for ECOG >= 2 (and < 4)', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 2, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('C');
  });

  it('stages B for more than 3 tumours in Child-Pugh A/B', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 4, largestDiameterCm: 3, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('B');
  });

  it('stages B for Milan-ineligible burden outside the single-small-tumour rule', () => {
    // count=2, largest=4cm: fails Milan (count>1 && largest>3) and fails the single-lesion<=2cm rule
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 2, largestDiameterCm: 4, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('B');
  });

  it('stages A for a single lesion <= 2cm with no PVTT', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 1, largestDiameterCm: 2, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('A');
  });

  it('stages A (not 0) for Child-Pugh A single lesion <=2cm — the legacy "0" branch is unreachable dead code, preserved faithfully', () => {
    // Every input satisfying the legacy '0' condition (cp==='A' && count===1 && largest<=2 && !pvtt)
    // also satisfies the preceding 'A' condition, so '0' can never be returned. See bclc.ts doc comment.
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 1, largestDiameterCm: 1, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('A');
    expect(result.value).not.toBe('0');
  });

  it('stages A for Milan-eligible Child-Pugh A disease even with count/size beyond the single-lesion rule', () => {
    const result = calculateBclcStage({ childPughGrade: 'A', ecogScore: 0, tumourCount: 3, largestDiameterCm: 3, pvtt: '', extrahepaticSpread: false });
    expect(result.value).toBe('A');
  });

  it('is NOT_CALCULABLE with no data at all', () => {
    const result = calculateBclcStage({});
    expect(result.status).toBe('NOT_CALCULABLE');
    expect(result.value).toBeNull();
  });
});
