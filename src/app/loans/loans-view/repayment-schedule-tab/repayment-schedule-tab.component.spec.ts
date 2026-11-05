/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import * as solidIcons from '@fortawesome/free-solid-svg-icons';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { of } from 'rxjs';
import { RepaymentScheduleTabComponent } from './repayment-schedule-tab.component';
import { RepaymentSchedule, RepaymentSchedulePeriod } from 'app/loans/models/loan-account.model';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('jspdf-autotable', () => ({ __esModule: true, default: jest.fn() }));

/** Builds a $1,200 loan, 3 monthly equal-principal installments, 12% p.a. declining balance (1% per month). */
function buildSchedule(paid: number[], waived: number[], totalOutstandingFromApi: number): RepaymentSchedule {
  const principal = 1200;
  const count = 3;
  const principalPerPeriod = principal / count;
  const periods: RepaymentSchedulePeriod[] = [
    { period: undefined, principalLoanBalanceOutstanding: principal } as unknown as RepaymentSchedulePeriod
  ];
  let balance = principal;
  for (let i = 0; i < count; i++) {
    const interest = balance * 0.01;
    balance -= principalPerPeriod;
    const due = principalPerPeriod + interest;
    periods.push({
      period: i + 1,
      principalDue: principalPerPeriod,
      interestDue: interest,
      totalDueForPeriod: due,
      totalPaidForPeriod: paid[i],
      totalWaivedForPeriod: waived[i],
      totalOutstandingForPeriod: due - paid[i] - waived[i],
      principalLoanBalanceOutstanding: balance
    } as unknown as RepaymentSchedulePeriod);
  }
  return {
    periods,
    totalPrincipalExpected: principal,
    totalInterestCharged: 24,
    totalRepaymentExpected: 1224,
    totalWaived: waived.reduce((a, b) => a + b, 0),
    totalOutstanding: totalOutstandingFromApi
  } as unknown as RepaymentSchedule;
}

describe('RepaymentScheduleTabComponent - schedule totals', () => {
  let fixture: ComponentFixture<RepaymentScheduleTabComponent>;
  let component: RepaymentScheduleTabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RepaymentScheduleTabComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { parent: { data: of({}) } } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        {
          provide: SettingsService,
          useValue: { businessDate: new Date(2026, 10, 5), dateFormat: 'dd MMMM yyyy', language: { code: 'en' } }
        },
        { provide: Dates, useValue: { formatDate: jest.fn((d: Date) => String(d)) } },
        provideNativeDateAdapter(),
        provideAnimationsAsync()
      ]
    }).compileComponents();

    const faIconLibrary = TestBed.inject(FaIconLibrary);
    faIconLibrary.addIcons(
      ...Object.keys(solidIcons)
        .filter((key) => key !== 'fas' && key !== 'prefix' && key.startsWith('fa'))
        .map((icon) => (solidIcons as any)[icon])
    );

    fixture = TestBed.createComponent(RepaymentScheduleTabComponent);
    component = fixture.componentInstance;
    component.currencyCode = 'USD';
  });

  const footerOutstanding = (): string => {
    const footerCells: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('td.mat-mdc-footer-cell'));
    return footerCells[footerCells.length - 1].textContent.trim();
  };

  it('shows the proposed schedule total outstanding as the sum of the installments, not the zero sent by the API', () => {
    component.repaymentScheduleDetails = buildSchedule(
      [
        0,
        0,
        0
      ],
      [
        0,
        0,
        0
      ],
      0
    );
    fixture.detectChanges();

    expect(component.totalOutstanding).toBe(412 + 408 + 404);
    expect(footerOutstanding()).toBe('$1,224.00');
  });

  it('shows the remaining outstanding after a partial repayment and an interest waiver', () => {
    // $200 repaid on installment 1 (interest 12 first, then principal 188); remaining interest 8 + 4 waived.
    component.repaymentScheduleDetails = buildSchedule(
      [
        200,
        0,
        0
      ],
      [
        0,
        8,
        4
      ],
      1012
    );
    fixture.detectChanges();

    expect(component.totalOutstanding).toBe(212 + 400 + 400);
    expect(footerOutstanding()).toBe('$1,012.00');
  });

  it('shows zero outstanding once every installment is fully paid', () => {
    component.repaymentScheduleDetails = buildSchedule(
      [
        412,
        400,
        400
      ],
      [
        0,
        8,
        4
      ],
      0
    );
    fixture.detectChanges();

    expect(component.totalOutstanding).toBe(0);
    expect(footerOutstanding()).toBe('$0.00');
  });
});
