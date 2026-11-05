import { UntypedFormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { LoansAccountTermsStepComponent } from './loans-account-terms-step.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('LoansAccountTermsStepComponent disbursement date', () => {
  it('initializes the disbursement dialog with the current date', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T12:00:00Z'));
    try {
      const open: jest.Mock = jest.fn(() => ({ afterClosed: () => of({}) }));
      const component = Object.assign(Object.create(LoansAccountTermsStepComponent.prototype), {
        loansAccountTermsForm: new UntypedFormBuilder().group({ principalAmount: 100 }),
        dialog: { open }
      });

      component.addDisbursementDataEntry();

      const field = open.mock.calls[0][1].data.formfields[0];
      expect(field.controlName).toBe('expectedDisbursementDate');
      expect(field.value).toEqual(new Date('2026-01-15T12:00:00Z'));
    } finally {
      jest.useRealTimers();
    }
  });
});
