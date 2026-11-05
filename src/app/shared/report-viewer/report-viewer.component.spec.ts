/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { TextDecoder, TextEncoder } from 'util';
import { ReportViewerComponent } from './report-viewer.component';

describe('ReportViewerComponent', () => {
  let fixture: ComponentFixture<ReportViewerComponent>;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let trustResourceUrl: jest.SpyInstance;

  function show(content: string, contentType?: string) {
    const encoded = new TextEncoder().encode(content);
    const body = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(body).set(encoded);
    fixture.componentRef.setInput(
      'response',
      new HttpResponse({
        body,
        headers: new HttpHeaders(contentType ? { 'Content-Type': contentType } : {})
      })
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: TextDecoder });
    createObjectURL = jest.fn(() => `blob:local-report-${createObjectURL.mock.calls.length}`);
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    await TestBed.configureTestingModule({
      imports: [
        ReportViewerComponent,
        TranslateModule.forRoot()
      ]
    }).compileComponents();
    trustResourceUrl = jest.spyOn(TestBed.inject(DomSanitizer), 'bypassSecurityTrustResourceUrl');
    fixture = TestBed.createComponent(ReportViewerComponent);
  });

  afterEach(() => {
    fixture.destroy();
    jest.restoreAllMocks();
  });

  it('should sanitize server HTML rather than trusting an HTML blob resource', () => {
    show(
      '<table><tr><td>Balance £25</td></tr></table><script>alert(1)</script>' +
        '<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>' +
        '<iframe src="https://attacker.invalid"></iframe><base href="https://attacker.invalid">',
      'text/html; charset=UTF-8'
    );
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('td')?.textContent).toBe('Balance £25');
    expect(element.querySelector('script, iframe, base')).toBeNull();
    expect(element.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(element.querySelector('a')?.getAttribute('href')).toBe('unsafe:javascript:alert(1)');
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(trustResourceUrl).not.toHaveBeenCalled();
  });

  it('should trust only a locally generated PDF blob with a PDF signature', () => {
    show('%PDF-1.7\nreport', 'Application/PDF; charset=binary');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob: Blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe(15);
    expect(trustResourceUrl).toHaveBeenCalledWith('blob:local-report-1');
    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe.getAttribute('src')).toBe('blob:local-report-1');
    expect(iframe.style.height).toBe('750px');
  });

  it.each([
    '<script>alert(1)</script>',
    'https://attacker.invalid/report',
    '%PDF'
  ])('should reject a PDF MIME header without PDF bytes: %s', (body) => {
    show(body, 'application/pdf');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(trustResourceUrl).not.toHaveBeenCalled();
  });

  it.each([
    [
      'text/csv',
      'report.csv'
    ],
    [
      'application/csv',
      'report.csv'
    ],
    [
      'application/vnd.ms-excel',
      'report.xls'
    ],
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'report.xlsx'
    ],
    [
      'image/svg+xml',
      'report'
    ],
    [
      'application/xhtml+xml',
      'report'
    ],
    [
      '',
      'report'
    ]
  ])('should offer %s as an inert download, not an executable iframe', (mimeType, name) => {
    show('<script>alert(1)</script>', mimeType);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('blob:local-report-1');
    expect(link.download).toBe(name);
    expect(createObjectURL.mock.calls[0][0].type).toBe('application/octet-stream');
    expect(fixture.nativeElement.querySelector('iframe, script')).toBeNull();
    expect(trustResourceUrl).not.toHaveBeenCalled();
  });

  it('should revoke PDF and download URLs when the response changes and on destruction', () => {
    show('%PDF-1.7\nreport', 'application/pdf');
    show('balance,25', 'text/csv');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-report-1');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    fixture.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-report-2');
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('should clear stale trusted output before rendering an HTML response', () => {
    show('%PDF-1.7\nreport', 'application/pdf');
    show('<p>New report</p>', 'text/html');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-report-1');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('New report');
  });

  it.each([
    null,
    new HttpResponse({ body: new ArrayBuffer(0) }),
    new HttpResponse({ body: 'javascript:alert(1)' })
  ])('should reject missing, empty, or non-binary response bodies', (response) => {
    fixture.componentRef.setInput('response', response);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe, a')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(trustResourceUrl).not.toHaveBeenCalled();
  });
});
