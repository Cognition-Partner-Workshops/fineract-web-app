import { of } from 'rxjs';
import { RunReportComponent } from './run-report.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));
jest.mock('exceljs', () => ({ Workbook: jest.fn() }));

describe('Report export', () => {
  it('alerts when spreadsheet export fails', async () => {
    const alert = jest.fn();
    const context: any = {
      report: { name: 'Test report' },
      reportForm: { value: {} },
      decimalChoice: { value: 2 },
      formatUserResponse: () => ({}),
      reportsService: { getRunReportData: () => of({ data: [{ row: [1] }], columnHeaders: [{ columnName: 'a' }] }) },
      alertService: { alert },
      exportToXLS: jest.fn().mockRejectedValue(new Error('Export failed'))
    };
    RunReportComponent.prototype.runReportAndExport.call(context, { stopPropagation: jest.fn() });
    await Promise.resolve();
    expect(alert).toHaveBeenCalledWith({ type: 'Report generation', message: 'Report: Test report export failed' });
  });
});
