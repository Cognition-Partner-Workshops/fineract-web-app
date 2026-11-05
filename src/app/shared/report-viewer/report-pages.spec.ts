/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { of } from 'rxjs';
import { StaffAssignmentHistoryComponent } from 'app/centers/centers-view/center-actions/staff-assignment-history/staff-assignment-history.component';
import { ProgressBarService } from 'app/core/progress-bar/progress-bar.service';
import { Dates } from 'app/core/utils/dates';
import { ExportTransactionsComponent as LoanExportComponent } from 'app/loans/loans-view/transactions/export-transactions/export-transactions.component';
import { ViewRecieptComponent as LoanReceiptComponent } from 'app/loans/loans-view/transactions/view-reciept/view-reciept.component';
import { ReportsService } from 'app/reports/reports.service';
import { PentahoComponent } from 'app/reports/run-report/pentaho/pentaho.component';
import { ExportTransactionsComponent as SavingsExportComponent } from 'app/savings/savings-account-view/transactions-tab/export-transactions/export-transactions.component';
import { ViewRecieptComponent as SavingsReceiptComponent } from 'app/savings/savings-account-view/transactions/view-reciept/view-reciept.component';
import { SettingsService } from 'app/settings/settings.service';

jest.mock('app/shared/m3-ui/m3-button/m3-button.component', () => ({}));

describe('Report page trust boundary', () => {
  const response = new HttpResponse({
    body: new ArrayBuffer(8),
    headers: new HttpHeaders({ 'Content-Type': 'text/html' })
  });
  const bypass = jest.fn();
  const route = {
    data: of({
      centersActionData: response,
      loansTransactionReciept: response,
      savingsTransactionReciept: response
    }),
    parent: { parent: { data: of({ loanDetailsData: { accountNo: '1' }, savingsAccountData: { accountNo: '2' } }) } }
  };

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:report') });
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustResourceUrl: bypass } },
        { provide: ReportsService, useValue: { getPentahoRunReportData: jest.fn(() => of(response)) } },
        {
          provide: SettingsService,
          useValue: { language: { code: 'en' }, dateFormat: 'yyyy-MM-dd', businessDate: new Date() }
        },
        { provide: ProgressBarService, useValue: { decrease: jest.fn() } },
        { provide: Dates, useValue: { formatDate: jest.fn(() => '2026-01-01') } },
        UntypedFormBuilder
      ]
    });
  });

  const pages = [
    {
      component: StaffAssignmentHistoryComponent,
      path: 'centers/centers-view/center-actions/staff-assignment-history/staff-assignment-history',
      action: 'ngOnInit'
    },
    {
      component: LoanReceiptComponent,
      path: 'loans/loans-view/transactions/view-reciept/view-reciept',
      action: 'ngOnInit'
    },
    {
      component: SavingsReceiptComponent,
      path: 'savings/savings-account-view/transactions/view-reciept/view-reciept',
      action: 'ngOnInit'
    },
    {
      component: LoanExportComponent,
      path: 'loans/loans-view/transactions/export-transactions/export-transactions',
      action: 'generate'
    },
    {
      component: SavingsExportComponent,
      path: 'savings/savings-account-view/transactions-tab/export-transactions/export-transactions',
      action: 'generate'
    },
    { component: PentahoComponent, path: 'reports/run-report/pentaho/pentaho', action: 'getRunReportData' }
  ];

  it.each(pages)(
    'should delegate $path to the shared viewer without trusting response content',
    ({ component, path, action }) => {
      const page: any = TestBed.runInInjectionContext(() => new component());
      if (action === 'generate') {
        page.ngOnInit();
      }
      if (action === 'getRunReportData') {
        page.dataObject = { report: { name: 'Report' }, formData: { 'output-type': 'HTML' } };
      }
      page[action]();

      expect(bypass).not.toHaveBeenCalled();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(page.reportResponse).toBe(response);
      const template = readFileSync(resolve(__dirname, '../../', `${path}.component.html`), 'utf8');
      expect(template).toMatch(/<mifosx-report-viewer\s+\[response\]="reportResponse"/);
      expect(template).not.toContain('<iframe');
    }
  );
});
