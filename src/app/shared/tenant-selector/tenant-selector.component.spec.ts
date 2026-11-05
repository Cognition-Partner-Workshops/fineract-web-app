import { UntypedFormControl } from '@angular/forms';
import { TenantSelectorComponent } from './tenant-selector.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Tenant selector initialization', () => {
  it.each([
    1,
    2
  ])('sets control availability for %s tenants', (count) => {
    const tenantSelector = new UntypedFormControl({ value: '', disabled: count === 2 });
    TenantSelectorComponent.prototype.ngOnInit.call({
      tenantSelector,
      tenants: Array(count).fill('tenant'),
      settingsService: { tenantIdentifier: 'tenant' }
    });
    expect(tenantSelector.disabled).toBe(count === 1);
    expect(tenantSelector.value).toBe('tenant');
  });
});
