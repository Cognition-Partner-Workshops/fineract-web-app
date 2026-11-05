import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { RunReportComponent } from './run-report.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));
jest.mock('exceljs', () => ({}));

describe('RunReportComponent runReportAndExport', () => {
  function setup(data: any[]) {
    const alert = jest.fn();
    const component = Object.assign(Object.create(RunReportComponent.prototype), {
      alertService: { alert },
      reportsService: { getRunReportData: jest.fn(() => of({ data, columnHeaders: [{ columnName: 'value' }] })) },
      report: { name: 'Loan report' },
      reportForm: new UntypedFormGroup({}),
      decimalChoice: new UntypedFormControl(2)
    });
    jest.spyOn(component, 'formatUserResponse').mockReturnValue({});
    return { component, alert };
  }

  it('alerts when XLS export rejects without leaving an unhandled rejection', async () => {
    const { component, alert } = setup([{ row: [1] }]);
    const exportError = new Error('Export failed');
    jest.spyOn(component, 'exportToXLS').mockRejectedValue(exportError);
    component.runReportAndExport({ stopPropagation: jest.fn() } as unknown as Event);
    await Promise.resolve();
    expect(alert).toHaveBeenCalledWith({
      type: 'Report generation',
      message: 'Report: Loan report export failed'
    });
    expect(component.isProcessing).toBe(false);
  });

  it('exports generated data', async () => {
    const { component, alert } = setup([{ row: [1] }]);
    const exportToXLS = jest.spyOn(component, 'exportToXLS').mockResolvedValue(undefined);
    component.runReportAndExport({ stopPropagation: jest.fn() } as unknown as Event);
    await Promise.resolve();
    expect(exportToXLS).toHaveBeenCalledWith('Loan report', [{ row: [1] }], ['value']);
    expect(alert).toHaveBeenCalledWith({
      type: 'Report generation',
      message: 'Report: Loan report data generated'
    });
  });

  it('does not export empty data', () => {
    const { component, alert } = setup([]);
    const exportToXLS = jest.spyOn(component, 'exportToXLS');
    component.runReportAndExport({ stopPropagation: jest.fn() } as unknown as Event);
    expect(exportToXLS).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith({
      type: 'Report generation',
      message: 'Report: Loan report without data generated'
    });
  });
});
