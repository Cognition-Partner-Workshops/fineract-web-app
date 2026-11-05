import { CreateGlimAccountComponent } from './create-glim-account.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('jspdf-autotable', () => jest.fn());

describe('GLIM loan payload', () => {
  it('preserves partial-period interest', () => {
    const payload = CreateGlimAccountComponent.prototype.setData.call(
      {
        settingsService: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' },
        loansAccount: { allowPartialPeriodInterestCalculation: true },
        loansAccountTemplate: { group: { id: 1 } },
        dateUtils: { formatDate: () => '' }
      },
      { id: 2, principal: 100 },
      1
    );
    expect(JSON.parse(payload).allowPartialPeriodInterestCalculation).toBe(true);
  });
});
