import { EMPTY } from 'rxjs';
import { EditLoansAccountComponent } from './edit-loans-account.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));
jest.mock('app/loans/loans-account-stepper/loans-account-schedule-step/loans-account-schedule-step.component', () => ({
  LoansAccountScheduleStepComponent: class {}
}));

describe('EditLoansAccountComponent submit', () => {
  it.each([
    true,
    false
  ])('sends allowPartialPeriodInterestCalculation=%s to updateLoansAccount', (value) => {
    const updateLoansAccount = jest.fn(() => EMPTY);
    const component = Object.assign(Object.create(EditLoansAccountComponent.prototype), {
      settingsService: { dateFormat: 'dd MMMM yyyy', language: { code: 'en' } },
      dateUtils: { formatDate: jest.fn(() => '') },
      loansService: { updateLoansAccount },
      loanId: 7,
      loansAccountAndTemplate: { clientId: 1 }
    });
    Object.defineProperty(component, 'loansAccount', {
      value: {
        allowPartialPeriodInterestCalculation: value,
        interestCalculationPeriodType: 1,
        charges: [],
        collateral: [],
        disbursementData: []
      }
    });
    component.submit();
    expect(updateLoansAccount).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        allowPartialPeriodInterestCalculation: value
      })
    );
  });
});
