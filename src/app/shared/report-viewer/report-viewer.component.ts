/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { HttpResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'mifosx-report-viewer',
  templateUrl: './report-viewer.component.html',
  styles: ':host { display: block; width: 100%; }',
  imports: [TranslatePipe]
})
export class ReportViewerComponent implements OnChanges, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private objectUrl: string | null = null;

  @Input() response: HttpResponse<ArrayBuffer> | null = null;
  @Input() height = '750px';

  pdfUrl: SafeResourceUrl | null = null;
  html: string | null = null;
  downloadUrl: string | null = null;
  downloadName = 'report';

  ngOnChanges() {
    this.releaseUrl();
    this.pdfUrl = null;
    this.html = null;
    this.downloadUrl = null;

    const body = this.response?.body;
    if (!(body instanceof ArrayBuffer) || body.byteLength === 0) {
      return;
    }

    const contentType = (this.response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (contentType === 'text/html') {
      this.html = new TextDecoder().decode(body);
    } else if (contentType === 'application/pdf') {
      const signature = String.fromCharCode(...new Uint8Array(body, 0, Math.min(5, body.byteLength)));
      if (signature !== '%PDF-') {
        return;
      }
      this.objectUrl = URL.createObjectURL(new Blob([body], { type: 'application/pdf' }));
      // Only locally created, PDF-typed blobs with a PDF signature cross the resource-URL trust boundary.
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
    } else {
      const downloadNames: Record<string, string> = {
        'text/csv': 'report.csv',
        'application/csv': 'report.csv',
        'application/vnd.ms-excel': 'report.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'report.xlsx'
      };
      this.downloadName = downloadNames[contentType] || 'report';
      this.objectUrl = URL.createObjectURL(new Blob([body], { type: 'application/octet-stream' }));
      this.downloadUrl = this.objectUrl;
    }
  }

  ngOnDestroy() {
    this.releaseUrl();
  }

  private releaseUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
