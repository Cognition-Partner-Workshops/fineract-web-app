import { UntypedFormBuilder } from '@angular/forms';
import { CloseAsRescheduledComponent } from './close-as-rescheduled.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('CloseAsRescheduledComponent transactionDate', () => {
  it.each([
    undefined,
    null,
    ''
  ])('defaults an absent date (%s) to today', (date) => {
    const component = Object.assign(Object.create(CloseAsRescheduledComponent.prototype), {
      formBuilder: new UntypedFormBuilder(),
      dataObject: { date }
    });
    const before = Date.now();
    component.createCloseForm();
    const value = component.closeLoanForm.get('transactionDate').value;
    expect(value).toBeInstanceOf(Date);
    expect(value.getTime()).toBeGreaterThanOrEqual(before);
    expect(value.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('uses the supplied date', () => {
    const component = Object.assign(Object.create(CloseAsRescheduledComponent.prototype), {
      formBuilder: new UntypedFormBuilder(),
      dataObject: { date: '2026-11-05' }
    });
    component.createCloseForm();
    expect(component.closeLoanForm.get('transactionDate').value).toEqual(new Date('2026-11-05'));
  });
});
