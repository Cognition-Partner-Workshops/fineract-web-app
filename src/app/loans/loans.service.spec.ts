import { LoansService } from './loans.service';

describe('LoansService loan request payload', () => {
  const service = Object.assign(Object.create(LoansService.prototype), {
    dateUtils: { formatDate: jest.fn(() => '') }
  });

  it.each([
    true,
    false
  ])('preserves allowPartialPeriodInterestCalculation=%s', (value) => {
    const payload = service.buildLoanRequestPayload(
      { allowPartialPeriodInterestCalculation: value, interestCalculationPeriodType: 1, disbursementData: [] },
      { clientId: 1 },
      [],
      'en',
      'dd MMMM yyyy'
    );
    expect(payload.allowPartialPeriodInterestCalculation).toBe(value);
  });

  it('disables partial-period interest for daily calculation', () => {
    const payload = service.buildLoanRequestPayload(
      { allowPartialPeriodInterestCalculation: true, interestCalculationPeriodType: 0, disbursementData: [] },
      { clientId: 1 },
      [],
      'en',
      'dd MMMM yyyy'
    );
    expect(payload.allowPartialPeriodInterestCalculation).toBe(false);
  });
});
