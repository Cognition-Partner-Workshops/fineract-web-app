import { of } from 'rxjs';
import { GeneralTabComponent } from './general-tab.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Loan product general tab copyProduct', () => {
  it('copies the product without mutating the source or sending display-only fields', () => {
    const product = {
      id: 12,
      name: 'Original Product',
      allowPartialPeriodInterestCalculation: false,
      daysInMonthType: { value: 30 },
      daysInYearType: { value: 365 },
      amortizationType: { id: 1 }
    };
    const createLoanProduct: jest.Mock = jest.fn(() => of({ resourceId: 13 }));
    const navigate = jest.fn();
    const component = Object.assign(Object.create(GeneralTabComponent.prototype), {
      loanProduct: product,
      dialog: {
        open: () => ({
          afterClosed: () => of({ data: { value: { name: 'Copied Product', shortName: 'COPY' } } })
        })
      },
      settingsService: { language: { code: 'en' } },
      translateService: { instant: (key: string) => key },
      productsService: { createLoanProduct },
      router: { navigate }
    });

    component.copyProduct();

    const payload = createLoanProduct.mock.calls[0][0];
    expect(payload).toMatchObject({ name: 'Copied Product', shortName: 'COPY', daysInMonthType: 30 });
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('allowPartialPeriodInterestCalculation');
    expect(product.id).toBe(12);
    expect(product.allowPartialPeriodInterestCalculation).toBe(false);
    expect(navigate).toHaveBeenCalled();
  });
});
