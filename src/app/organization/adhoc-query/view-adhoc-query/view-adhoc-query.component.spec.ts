import { ViewAdhocQueryComponent } from './view-adhoc-query.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Report run frequency', () => {
  it.each([
    [[]],
    [[{ id: 1, value: 'Daily' }]]
  ])('returns empty string for unmatched frequency', (reportRunFrequencies) => {
    const getter = Object.getOwnPropertyDescriptor(ViewAdhocQueryComponent.prototype, 'reportRunFrequency')!.get!;
    expect(getter.call({ adhocQueryData: { reportRunFrequencies, reportRunFrequency: 2 } })).toBe('');
  });

  it('returns a matching frequency', () => {
    const getter = Object.getOwnPropertyDescriptor(ViewAdhocQueryComponent.prototype, 'reportRunFrequency')!.get!;
    expect(
      getter.call({ adhocQueryData: { reportRunFrequencies: [{ id: 1, value: 'Daily' }], reportRunFrequency: 1 } })
    ).toBe('Daily');
  });
});
