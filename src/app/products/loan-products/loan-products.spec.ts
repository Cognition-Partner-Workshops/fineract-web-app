import { LoanProducts } from './loan-products';

describe('Loan product payload', () => {
  it.each([
    true,
    false
  ])('preserves partial-period interest: %s', (allowPartialPeriodInterestCalculation) => {
    const payload = LoanProducts.prototype.buildPayload.call(
      { settingsService: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' } },
      { allowPartialPeriodInterestCalculation, charges: [] },
      []
    );
    expect(payload.allowPartialPeriodInterestCalculation).toBe(allowPartialPeriodInterestCalculation);
  });
});
