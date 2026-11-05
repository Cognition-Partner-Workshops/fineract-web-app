import { TestBed } from '@angular/core/testing';
import { TenantSelectorComponent } from './tenant-selector.component';
import { SettingsService } from 'app/settings/settings.service';
import { AlertService } from 'app/core/alert/alert.service';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('TenantSelectorComponent', () => {
  it.each([
    [],
    ['default'],
    [
      'default',
      'other'
    ]
  ])('sets selection availability for tenants %j', (...tenants) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsService, useValue: { tenantIdentifiers: tenants, tenantIdentifier: 'default' } },
        { provide: AlertService, useValue: {} }
      ]
    });
    const component = TestBed.runInInjectionContext(() => new TenantSelectorComponent());
    if (tenants.length > 1) {
      component.tenantSelector.disable();
    }
    component.ngOnInit();
    expect(component.tenantSelector.disabled).toBe(tenants.length <= 1);
    expect(component.tenantSelector.value).toBe('default');
  });
});
