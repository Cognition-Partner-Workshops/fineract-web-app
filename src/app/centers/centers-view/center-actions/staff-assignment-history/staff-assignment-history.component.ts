/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Angular Imports */
import { Component, OnInit, Input, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ReportViewerComponent } from 'app/shared/report-viewer/report-viewer.component';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Custom Services */
import { CentersService } from '../../../centers.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Staff Assignment History Component
 */
@Component({
  selector: 'mifosx-staff-assignment-history',
  templateUrl: './staff-assignment-history.component.html',
  styleUrls: ['./staff-assignment-history.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    ReportViewerComponent
  ]
})
export class StaffAssignmentHistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);

  /** Staff Assignment History Data */
  staffAssignmentHistoryData: any;
  reportResponse: HttpResponse<ArrayBuffer> | null = null;

  constructor() {
    this.route.data.subscribe((data: { centersActionData: any }) => {
      this.staffAssignmentHistoryData = data.centersActionData;
    });
  }

  ngOnInit() {
    this.reportResponse = this.staffAssignmentHistoryData;
  }
}
