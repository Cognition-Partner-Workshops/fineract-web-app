/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DomSanitizer } from '@angular/platform-browser';
import { createReportObjectUrl, toSafeImageDataUrl, trustReportObjectUrl } from './report-blob-url';

describe('report blob URLs', () => {
  let blob: Blob;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn((value: Blob) => {
      blob = value;
      return 'blob:report';
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
  });

  function readBlob(value: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(value);
    });
  }

  it('prepends a restrictive CSP to HTML and preserves its MIME type', async () => {
    const body = '<script>alert(1)</script><p>Report</p>';
    expect(createReportObjectUrl(body, 'text/html')).toBe('blob:report');
    expect(blob.type).toBe('text/html');
    expect(await readBlob(blob)).toBe(
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data: blob: https: http:; font-src data:">' +
        body
    );
  });

  it.each([
    'image/svg+xml',
    'application/xml',
    'text/xml',
    'application/javascript',
    'unknown/type',
    '',
    null
  ])('coerces %s to octet-stream', (type) => {
    createReportObjectUrl('report', type);
    expect(blob.type).toBe('application/octet-stream');
  });

  it.each([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ])('preserves passive type %s', (type) => {
    createReportObjectUrl('report', type);
    expect(blob.type).toBe(type);
  });

  it('normalizes case and strips MIME parameters', () => {
    createReportObjectUrl('report', ' Application/PDF; charset=utf-8');
    expect(blob.type).toBe('application/pdf');
  });

  it('preserves an empty passive body', async () => {
    createReportObjectUrl('', 'text/plain');
    expect(await readBlob(blob)).toBe('');
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    'https://example.com',
    ''
  ])('rejects non-blob resource URL %s', (url) => {
    const bypassSecurityTrustResourceUrl = jest.fn();
    const sanitizer = { bypassSecurityTrustResourceUrl } as unknown as DomSanitizer;
    expect(() => trustReportObjectUrl(sanitizer, url)).toThrow('Report resource URL must be a blob URL');
    expect(bypassSecurityTrustResourceUrl).not.toHaveBeenCalled();
  });

  it('trusts blob resource URLs', () => {
    const bypassSecurityTrustResourceUrl = jest.fn().mockReturnValue('trusted');
    const sanitizer = { bypassSecurityTrustResourceUrl } as unknown as DomSanitizer;
    expect(trustReportObjectUrl(sanitizer, 'blob:report')).toBe('trusted');
    expect(bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('blob:report');
  });
});

describe('image data URLs', () => {
  it.each([
    'png',
    'jpeg',
    'jpg',
    'gif',
    'webp',
    'bmp'
  ])('accepts base64 %s images', (type) => {
    const value = `data:image/${type};base64,YWJjZA==`;
    expect(toSafeImageDataUrl(value)).toBe(value);
  });

  it('accepts case-insensitive MIME types and base64 whitespace', () => {
    const value = 'DATA:IMAGE/PNG;BASE64,YWJj ZA==\n';
    expect(toSafeImageDataUrl(value)).toBe(value);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html;base64,YWJj',
    'data:image/svg+xml;base64,YWJj',
    'data:image/png;base64,',
    'data:image/png;base64,<>',
    '',
    null,
    undefined,
    123,
    {}
  ])('rejects unsafe or invalid image input %p', (value) => {
    expect(toSafeImageDataUrl(value)).toBeNull();
  });
});
