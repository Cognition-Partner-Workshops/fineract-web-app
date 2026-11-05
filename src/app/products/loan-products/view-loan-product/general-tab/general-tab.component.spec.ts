import { of } from 'rxjs';
import { GeneralTabComponent } from './general-tab.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Copy loan product', () => {
  it.each([
    true,
    false
  ])('sends partial-period interest: %s', (allowPartialPeriodInterestCalculation) => {
    const createLoanProduct = jest.fn().mockReturnValue(of({ resourceId: 2 }));
    const loanProduct = {
      name: 'Product',
      allowPartialPeriodInterestCalculation,
      daysInMonthType: { value: 30 },
      daysInYearType: { value: 365 },
      amortizationType: { id: 1 }
    };
    GeneralTabComponent.prototype.copyProduct.call({
      loanProduct,
      translateService: { instant: (value: string) => value },
      settingsService: { language: { code: 'en' } },
      dialog: { open: () => ({ afterClosed: () => of({ data: { value: { name: 'Copy', shortName: 'CP' } } }) }) },
      productsService: { createLoanProduct },
      router: { navigate: jest.fn() }
    });
    expect(createLoanProduct).toHaveBeenCalledWith(expect.objectContaining({ allowPartialPeriodInterestCalculation }));
    expect(loanProduct.allowPartialPeriodInterestCalculation).toBe(allowPartialPeriodInterestCalculation);
  });
});
