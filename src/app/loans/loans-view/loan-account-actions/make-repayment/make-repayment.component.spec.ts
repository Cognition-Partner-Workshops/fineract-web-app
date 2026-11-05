/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TestBed } from '@angular/core/testing';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { MakeRepaymentComponent } from './make-repayment.component';
import { LoansService } from 'app/loans/loans.service';
import { SettingsService } from 'app/settings/settings.service';
import { Dates } from 'app/core/utils/dates';
import { PenaltyManagementService } from 'app/loans/services/penalty-management.service';

// The template's shared UI imports pull in ESM-only @material/web, which this Jest setup cannot load;
// these specs exercise form logic only, so the template imports are stubbed.
jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as unknown[] }));
jest.mock('app/shared/input-amount/input-amount.component', () => ({ InputAmountComponent: class {} }));

describe('MakeRepaymentComponent transactionAmount validation', () => {
  const outstandingAmount = 150;

  function createComponent(command: string): MakeRepaymentComponent {
    TestBed.configureTestingModule({
      providers: [
        UntypedFormBuilder,
        { provide: LoansService, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { loanId: '1' } } } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: Dates, useValue: {} },
        { provide: SettingsService, useValue: { businessDate: new Date(2025, 0, 15) } },
        { provide: PenaltyManagementService, useValue: { loadPenalties: jest.fn(() => of([])) } }]
    });
    const component = TestBed.runInInjectionContext(() => new MakeRepaymentComponent());
    component.dataObject = {
      type: { code: `loanTransactionType.${command}` },
      amount: outstandingAmount,
      paymentTypeOptions: [],
      classificationOptions: []
    };
    component.ngOnInit();
    return component;
  }

  function amountErrors(component: MakeRepaymentComponent, value: number) {
    const control = component.repaymentLoanForm.controls['transactionAmount'];
    control.setValue(value);
    return control.errors;
  }

  afterEach(() => TestBed.resetTestingModule());

  it.each([
    'repayment',
    'capitalizedIncome',
    'buyDownFee'
  ])('should require a positive transactionAmount for %s', (command) => {
    const component = createComponent(command);

    expect(component.repaymentLoanForm.controls['transactionAmount'].value).toBe(outstandingAmount);
    expect(amountErrors(component, null)).toEqual({ required: true });
    expect(amountErrors(component, 0)).toEqual({ min: { min: 0.001, actual: 0 } });
    expect(amountErrors(component, 10)).toBeNull();
  });

  it('should cap capitalized income at the outstanding amount', () => {
    const component = createComponent('capitalizedIncome');

    expect(amountErrors(component, outstandingAmount + 1)).toEqual({
      max: { max: outstandingAmount, actual: outstandingAmount + 1 }
    });
  });

  it('should not cap a regular repayment at the outstanding amount', () => {
    const component = createComponent('repayment');

    expect(amountErrors(component, outstandingAmount + 1)).toBeNull();
  });

  it('should add classificationId only for capitalized income and buy down fee', () => {
    expect(createComponent('repayment').repaymentLoanForm.contains('classificationId')).toBe(false);
    TestBed.resetTestingModule();
    expect(createComponent('capitalizedIncome').repaymentLoanForm.contains('classificationId')).toBe(true);
    TestBed.resetTestingModule();
    expect(createComponent('buyDownFee').repaymentLoanForm.contains('classificationId')).toBe(true);
  });
});
