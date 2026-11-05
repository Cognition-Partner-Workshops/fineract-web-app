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
import { LoansViewComponent } from './loans-view.component';
import { LoansService } from '../loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';

describe('LoansViewComponent account overview', () => {
  let fixture: ComponentFixture<LoansViewComponent>;

  // Branch scenario: 1,000.00 disbursed, 100.00 repaid (90.00 principal + 10.00 interest).
  // The customer still owes 910.00 principal + 20.00 interest = 930.00.
  const loanDetailsData: any = {
    id: 1,
    clientId: 1,
    clientName: 'Before Walk',
    clientAccountNo: '000000001',
    loanProductName: 'Branch Personal Loan',
    accountNo: '000000001',
    delinquent: {},
    overdueCharges: [],
    status: { id: 300, code: 'loanStatusType.active', value: 'Active', active: true },
    currency: { code: 'USD', decimalPlaces: 2, displaySymbol: '$' },
    transactions: [],
    disbursementDetails: [],
    summary: {
      principalDisbursed: 1000,
      principalPaid: 90,
      principalOutstanding: 910,
      interestCharged: 30,
      interestPaid: 10,
      interestWaived: 0,
      interestOutstanding: 20,
      totalRepayment: 100,
      totalOutstanding: 930,
      totalOverdue: 0
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoansViewComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: { getCredentials: jest.fn(() => ({ permissions: ['ALL_FUNCTIONS'] })) }
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        {
          provide: LoansService,
          useValue: { saveLoanDisbursementDetailsData: jest.fn(), getLoanAccountResource: jest.fn(() => of({})) }
        },
        { provide: SettingsService, useValue: { language: { code: 'en' }, dateFormat: 'dd MMMM yyyy' } },
        {
          provide: ActivatedRoute,
          useFactory: () =>
            Object.assign(inject(Router).routerState.root, {
              data: of({ loanDetailsData, loanDatatables: [], loanArrearsDelinquencyConfig: { value: 0 } })
            })
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture = TestBed.createComponent(LoansViewComponent);
    fixture.detectChanges();
  });

  it('quotes the total the customer owes as the current balance', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('table.account-overview tr')) as HTMLElement[];
    const currentBalance = rows.find((row) => row.textContent?.includes('Current Balance'));

    expect(currentBalance?.querySelector('td.r-amount')?.textContent?.trim()).toBe('$930.00');
  });
});
