/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClientsService } from '../clients.service';
import { ClientsViewComponent } from './clients-view.component';

jest.mock('app/shared/m3-ui/m3-button/m3-button.component', () => ({}));

describe('ClientsViewComponent profile image', () => {
  const getClientProfileImage = jest.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsViewComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ clientViewData: { id: 1 } }) } },
        { provide: Router, useValue: {} },
        { provide: MatDialog, useValue: {} },
        { provide: ClientsService, useValue: { getClientProfileImage } }
      ]
    })
      .overrideComponent(ClientsViewComponent, {
        set: { imports: [], template: '<img [src]="clientImage || \'assets/images/user_placeholder.png\'" />' }
      })
      .compileComponents();
  });

  it('should let Angular sanitize a server-provided executable image URL', () => {
    getClientProfileImage.mockReturnValue(of('javascript:alert(document.domain)'));
    const fixture = TestBed.createComponent(ClientsViewComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'unsafe:javascript:alert(document.domain)'
    );
  });

  it('should display a base64 profile image without a trust wrapper', () => {
    const image = 'data:image/png;base64,iVBORw0KGgo=';
    getClientProfileImage.mockReturnValue(of(image));
    const fixture = TestBed.createComponent(ClientsViewComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.clientImage).toBe(image);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(image);
  });

  it.each([
    of(null),
    throwError(() => new Error('unavailable'))
  ])('should retain the placeholder for missing images or errors', (result) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getClientProfileImage.mockReturnValue(result);
    const fixture = TestBed.createComponent(ClientsViewComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('assets/images/user_placeholder.png');
    jest.restoreAllMocks();
  });
});
