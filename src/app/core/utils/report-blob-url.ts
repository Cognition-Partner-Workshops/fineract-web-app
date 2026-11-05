/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const PASSIVE_REPORT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream'
]);

const HTML_CSP =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data: blob: https: http:; font-src data:">';

export function createReportObjectUrl(body: BlobPart, contentType: string | null): string {
  const mime = (contentType ?? '').split(';')[0].trim().toLowerCase();
  const type = mime === 'text/html' || PASSIVE_REPORT_TYPES.has(mime) ? mime : 'application/octet-stream';
  const parts = mime === 'text/html' ? [
          HTML_CSP,
          body
        ] : [body];
  return URL.createObjectURL(new Blob(parts, { type }));
}

export function trustReportObjectUrl(sanitizer: DomSanitizer, url: string): SafeResourceUrl {
  if (!url.startsWith('blob:')) {
    throw new Error('Report resource URL must be a blob URL');
  }
  return sanitizer.bypassSecurityTrustResourceUrl(url);
}

export function toSafeImageDataUrl(value: unknown): string | null {
  return typeof value === 'string' && /^data:image\/(png|jpe?g|gif|webp|bmp);base64,[A-Za-z0-9+/=\s]+$/i.test(value)
    ? value
    : null;
}
