/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ReportViewerComponent } from 'app/shared/report-viewer/report-viewer.component';
import { UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Custom Services */
import { ReportsService } from 'app/reports/reports.service';
import { Dates } from 'app/core/utils/dates';
import { SettingsService } from 'app/settings/settings.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Export Client Loans Transactions Component
 */
@Component({
  selector: 'mifosx-export-transactions',
  templateUrl: './export-transactions.component.html',
  styleUrls: ['./export-transactions.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    ReportViewerComponent
  ]
})
export class ExportTransactionsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private formBuilder = inject(UntypedFormBuilder);
  private dateUtils = inject(Dates);
  private route = inject(ActivatedRoute);
  private settingsService = inject(SettingsService);

  /** Minimum date allowed. */
  minDate = new Date(2000, 0, 1);
  /** Maximum date allowed. */
  maxDate = new Date();
  /** Transactions Report Form */
  transactionsReportForm: any;
  /** substitute for resolver */
  hideOutput = true;
  reportResponse: HttpResponse<ArrayBuffer> | null = null;
  /** Loans Account Id */
  loansAccountId: any;

  /**
   * Fetches loans account data from grandparent's `resolve`
   * @param {ReportsService} reportsService Reports Service
   * @param {FormBuilder} formBuilder Form Builder
   * @param {Dates} dateUtils Date Utils
   * @param {ActivatedRoute} route Activated Route
   * @param {SettingsService} settingsService Settings Service
   */
  constructor() {
    this.route.parent.parent.data.subscribe((data: { loanDetailsData: any }) => {
      this.loansAccountId = data.loanDetailsData.accountNo;
    });
  }

  ngOnInit() {
    this.maxDate = this.settingsService.businessDate;
    this.createTransactionsReportForm();
  }

  /**
   * Creates the transactions report form.
   */
  createTransactionsReportForm() {
    this.transactionsReportForm = this.formBuilder.group({
      fromDate: [
        '',
        Validators.required
      ],
      toDate: [
        this.settingsService.businessDate,
        Validators.required
      ]
    });
  }

  /**
   * Generates client loans transactions report.
   */
  generate() {
    const dateFormat = this.settingsService.dateFormat;
    const data = {
      'output-type': 'PDF',
      R_startDate: this.dateUtils.formatDate(this.transactionsReportForm.value.fromDate, dateFormat),
      R_endDate: this.dateUtils.formatDate(this.transactionsReportForm.value.toDate, dateFormat),
      R_selectLoan: this.loansAccountId
    };
    this.reportsService
      .getPentahoRunReportData('Client Loan Account Schedule', data, 'default', 'en', dateFormat)
      .subscribe((res: any) => {
        this.reportResponse = res;
        this.hideOutput = false;
      });
  }
}
