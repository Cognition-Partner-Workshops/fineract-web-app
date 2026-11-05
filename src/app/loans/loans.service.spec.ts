import { LoansService } from './loans.service';

describe('Loan request payload', () => {
  it.each([
    true,
    false
  ])('preserves partial-period interest: %s', (allowPartialPeriodInterestCalculation) => {
    const payload = LoansService.prototype.buildLoanRequestPayload.call(
      { dateUtils: { formatDate: () => '' } },
      { allowPartialPeriodInterestCalculation, disbursementData: [], principalAmount: 100 },
      { clientId: 1 },
      [],
      'en',
      'dd MMMM yyyy'
    );
    expect(payload.allowPartialPeriodInterestCalculation).toBe(allowPartialPeriodInterestCalculation);
  });
});
