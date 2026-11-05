import { of } from 'rxjs';
import { EditLoansAccountComponent } from './edit-loans-account.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('jspdf-autotable', () => jest.fn());

describe('Edit loan payload', () => {
  it.each([
    true,
    false
  ])('sends partial-period interest: %s', (allowPartialPeriodInterestCalculation) => {
    const updateLoansAccount = jest.fn().mockReturnValue(of({}));
    EditLoansAccountComponent.prototype.submit.call({
      settingsService: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' },
      loansAccount: { allowPartialPeriodInterestCalculation, collateral: [], disbursementData: [] },
      loansAccountAndTemplate: { clientId: 1 },
      dateUtils: { formatDate: () => '' },
      loansService: { updateLoansAccount },
      loanId: '1',
      router: { navigate: jest.fn() }
    });
    expect(updateLoansAccount).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ allowPartialPeriodInterestCalculation })
    );
  });
});
