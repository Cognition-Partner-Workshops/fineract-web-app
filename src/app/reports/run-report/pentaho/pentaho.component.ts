/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Component, OnChanges, Input, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ReportViewerComponent } from 'app/shared/report-viewer/report-viewer.component';

/** Custom Services */
import { ReportsService } from '../../reports.service';
import { SettingsService } from 'app/settings/settings.service';
import { ProgressBarService } from 'app/core/progress-bar/progress-bar.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Pentaho Component
 */
@Component({
  selector: 'mifosx-pentaho',
  templateUrl: './pentaho.component.html',
  styleUrls: ['./pentaho.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    ReportViewerComponent
  ]
})
export class PentahoComponent implements OnChanges {
  private reportsService = inject(ReportsService);
  private settingsService = inject(SettingsService);
  private progressBarService = inject(ProgressBarService);

  /** Run Report Data */
  @Input() dataObject: any;

  /** substitute for resolver */
  hideOutput = true;
  reportResponse: HttpResponse<ArrayBuffer> | null = null;

  /**
   * Fetches run report data post changes in run report form.
   */
  ngOnChanges() {
    this.hideOutput = true;
    this.getRunReportData();
  }

  getRunReportData() {
    this.reportsService
      .getPentahoRunReportData(
        this.dataObject.report.name,
        this.dataObject.formData,
        'default',
        this.settingsService.language.code,
        this.settingsService.dateFormat
      )
      .subscribe((res: any) => {
        this.reportResponse = res;
        this.hideOutput = false;
        this.progressBarService.decrease();
      });
  }
}
