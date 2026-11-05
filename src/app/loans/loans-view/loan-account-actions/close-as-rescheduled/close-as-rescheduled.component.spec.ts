import { UntypedFormBuilder } from '@angular/forms';
import { CloseAsRescheduledComponent } from './close-as-rescheduled.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Close loan transaction date', () => {
  it.each([
    undefined,
    '2025-01-02'
  ])('creates a valid date for %s', (date) => {
    const context: any = { dataObject: { date }, formBuilder: new UntypedFormBuilder() };
    CloseAsRescheduledComponent.prototype.createCloseForm.call(context);
    const transactionDate = context.closeLoanForm.value.transactionDate;
    expect(transactionDate).toBeInstanceOf(Date);
    expect(Number.isNaN(transactionDate.getTime())).toBe(false);
    if (date) {
      expect(transactionDate).toEqual(new Date(date));
    }
  });
});
