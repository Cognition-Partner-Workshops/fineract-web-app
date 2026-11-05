import { LoanProducts } from './loan-products';

describe('LoanProducts buildPayload', () => {
  const products = Object.assign(Object.create(LoanProducts.prototype), {
    settingsService: { dateFormat: 'dd MMMM yyyy', language: { code: 'en' } }
  });

  it.each([
    true,
    false
  ])('preserves allowPartialPeriodInterestCalculation=%s', (value) => {
    const payload = products.buildPayload({ allowPartialPeriodInterestCalculation: value, charges: [] }, []);
    expect(payload.allowPartialPeriodInterestCalculation).toBe(value);
  });
});
