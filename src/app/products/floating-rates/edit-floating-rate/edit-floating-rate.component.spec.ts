import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { EMPTY } from 'rxjs';
import { EditFloatingRateComponent } from './edit-floating-rate.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('EditFloatingRateComponent submit', () => {
  it.each([
    true,
    false
  ])('sends sanitized ratePeriods (has periods: %s)', (hasPeriods) => {
    const updateFloatingRate = jest.fn((_id: string, _payload: any) => EMPTY);
    const component = Object.assign(Object.create(EditFloatingRateComponent.prototype), {
      productsService: { updateFloatingRate },
      route: { snapshot: { paramMap: { get: () => '5' } } },
      settingsService: { language: { code: 'en' } },
      dateFormat: 'dd MMMM yyyy',
      dateUtils: { formatDate: jest.fn(() => '05 November 2026') },
      floatingRateForm: new UntypedFormGroup({ name: new UntypedFormControl('Rate') }),
      floatingRatePeriodsData: hasPeriods
        ? [
            {
              fromDate: new Date(2026, 10, 5),
              interestRate: 3,
              isDifferentialToBaseLendingRate: false,
              id: 1,
              createdBy: 'creator',
              modifiedBy: 'modifier',
              createdOn: 'date',
              modifiedOn: 'date',
              isActive: true
            }
          ]
        : []
    });
    component.submit();
    const payload = updateFloatingRate.mock.calls[0][1];
    if (hasPeriods) {
      expect(JSON.parse(JSON.stringify(payload.ratePeriods))).toEqual([
        {
          fromDate: '05 November 2026',
          interestRate: 3,
          isDifferentialToBaseLendingRate: false,
          locale: 'en',
          dateFormat: 'dd MMMM yyyy'
        }
      ]);
    } else {
      expect(payload.ratePeriods).toBeUndefined();
    }
  });
});
