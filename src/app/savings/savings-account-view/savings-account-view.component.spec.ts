/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SavingsAccountViewComponent } from './savings-account-view.component';
import { SavingsService } from '../savings.service';
import { SettingsService } from 'app/settings/settings.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

describe('SavingsAccountViewComponent account overview', () => {
  let fixture: ComponentFixture<SavingsAccountViewComponent>;

  // Branch scenario: deposits 1,000.00 + 50.00, withdrawals 200.00 + 25.00.
  // The customer's balance is 1,050.00 - 225.00 = 825.00.
  const savingsAccountData: any = {
    id: 1,
    clientId: 1,
    clientName: 'Before Walk',
    clientAccountNo: '000000001',
    savingsProductName: 'Branch Passbook Savings',
    accountNo: '000000001',
    status: { id: 300, code: 'savingsAccountStatusType.active', value: 'Active', active: true },
    subStatus: { none: true },
    currency: { code: 'USD', decimalPlaces: 2, displaySymbol: '$' },
    summary: {
      totalDeposits: 1050,
      totalWithdrawals: 225,
      accountBalance: 825,
      availableBalance: 825
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SavingsAccountViewComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: { getCredentials: jest.fn(() => ({ permissions: ['ALL_FUNCTIONS'] })) }
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: SavingsService, useValue: {} },
        { provide: SettingsService, useValue: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' } },
        {
          provide: ActivatedRoute,
          useFactory: () =>
            Object.assign(inject(Router).routerState.root, { data: of({ savingsAccountData, savingsDatatables: [] }) })
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(SavingsAccountViewComponent);
    fixture.detectChanges();
  });

  it('quotes the net account balance, not total deposits, as the current balance', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('table.account-overview tr')) as HTMLElement[];
    const currentBalance = rows.find((row) => row.textContent?.includes('Current Balance'));

    expect(currentBalance?.querySelector('td.r-amount')?.textContent?.trim()).toBe('$825.00');
  });
});
