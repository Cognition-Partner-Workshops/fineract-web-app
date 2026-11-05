/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ASTWithSource,
  parseTemplate,
  TmplAstElement,
  TmplAstRecursiveVisitor,
  tmplAstVisitAll
} from '@angular/compiler';

class ElementCollector extends TmplAstRecursiveVisitor {
  readonly elements: TmplAstElement[] = [];

  override visitElement(element: TmplAstElement): void {
    this.elements.push(element);
    super.visitElement(element);
  }
}

function template(path: string): TmplAstElement[] {
  const source = readFileSync(join(process.cwd(), 'src/app', path), 'utf8');
  const parsed = parseTemplate(source, path);
  expect(parsed.errors).toBeNull();
  const collector = new ElementCollector();
  tmplAstVisitAll(collector, parsed.nodes);
  return collector.elements;
}

function contains(parent: TmplAstElement, child: TmplAstElement): boolean {
  return (
    parent.sourceSpan.start.offset < child.sourceSpan.start.offset &&
    parent.sourceSpan.end.offset >= child.sourceSpan.end.offset
  );
}

function attribute(element: TmplAstElement, name: string): string | undefined {
  return element.attributes.find((attr) => attr.name === name)?.value;
}

const tableTemplates = [
  'clients/clients-view/charges/view-charge/view-charge.component.html',
  'clients/clients-view/clients-view.component.html',
  'clients/clients-view/general-tab/general-tab.component.html',
  'deposits/fixed-deposits/fixed-deposit-account-view/fixed-deposit-account-view.component.html',
  'deposits/fixed-deposits/fixed-deposit-account-view/general-tab/general-tab.component.html',
  'deposits/recurring-deposits/recurring-deposits-account-view/general-tab/general-tab.component.html',
  'deposits/recurring-deposits/recurring-deposits-account-view/recurring-deposits-account-view.component.html',
  'loans/loans-view/external-asset-owner-tab/external-asset-owner-tab.component.html',
  'loans/loans-view/external-asset-owner-tab/external-asset-transfer/external-asset-transfer.component.html',
  'loans/loans-view/general-tab/general-tab.component.html',
  'loans/loans-view/loan-account-actions/view-guarantors/view-guarantors.component.html',
  'loans/loans-view/loan-collateral-tab/loan-collateral-tab.component.html',
  'loans/loans-view/loans-view.component.html',
  'login/login.component.html',
  'organization/bulk-loan-reassignmnet/bulk-loan-reassignmnet.component.html',
  'organization/investors/investors.component.html',
  'savings/savings-account-view/general-tab/general-tab.component.html',
  'savings/savings-account-view/savings-account-view.component.html',
  'shared/footer/footer.component.html',
  'shared/transaction-payment-detail/transaction-payment-detail.component.html',
  'shares/shares-account-view/general-tab/general-tab.component.html',
  'shares/shares-account-view/shares-account-view.component.html',
  'system/manage-jobs/scheduler-jobs/error-log-popover/error-log-popover.component.html'
];
const formControls: [string, number][] = [
  [
    'centers/centers.component.html',
    0
  ],
  [
    'centers/centers.component.html',
    1
  ],
  [
    'clients/clients-view/custom-dialogs/edit-notes-dialog/edit-notes-dialog.component.html',
    0
  ],
  [
    'clients/clients.component.html',
    0
  ],
  [
    'groups/groups.component.html',
    0
  ],
  [
    'loans/loans-account-stepper/loans-active-client-members/loans-active-client-members.component.html',
    0
  ],
  [
    'organization/sms-campaigns/sms-campaign-stepper/campaign-preview-step/campaign-preview-step.component.html',
    0
  ],
  [
    'organization/sms-campaigns/view-campaign/view-campaign.component.html',
    0
  ],
  [
    'shared/file-upload/file-upload.component.html',
    0
  ],
  [
    'shared/file-upload/file-upload.component.html',
    1
  ],
  [
    'shared/tabs/entity-datatable-tab/datatable-single-row/datatable-single-row.component.html',
    0
  ],
  [
    'shared/tabs/entity-notes-tab/entity-notes-tab.component.html',
    0
  ],
  [
    'system/manage-jobs/cob-workflow/loan-locked/loan-locked.component.html',
    0
  ],
  [
    'system/manage-jobs/scheduler-jobs/custom-parameters-popover/custom-parameters-table/custom-parameters-table.component.html',
    0
  ],
  [
    'system/manage-jobs/scheduler-jobs/custom-parameters-popover/custom-parameters-table/custom-parameters-table.component.html',
    1
  ],
  [
    'tasks/checker-inbox-and-tasks-tabs/checker-inbox/checker-inbox.component.html',
    0
  ],
  [
    'tasks/checker-inbox-and-tasks-tabs/client-approval/client-approval.component.html',
    0
  ],
  [
    'tasks/checker-inbox-and-tasks-tabs/loan-approval/loan-approval.component.html',
    0
  ],
  [
    'tasks/checker-inbox-and-tasks-tabs/loan-disbursal/loan-disbursal.component.html',
    0
  ],
  [
    'tasks/checker-inbox-and-tasks-tabs/reschedule-loan/reschedule-loan.component.html',
    0
  ]
];

describe('Accessible product templates', () => {
  it.each(tableTemplates)('%s associates data cells with native headers, not layout headings', (path) => {
    const elements = template(path);
    const tables = elements.filter((element) => element.name === 'table');
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      const ownHeaders = elements.filter(
        (element) =>
          element.name === 'th' &&
          contains(table, element) &&
          !tables.some((nested) => contains(table, nested) && contains(nested, element))
      );
      if (attribute(table, 'role') === 'presentation') {
        expect(ownHeaders).toHaveLength(0);
      } else {
        expect(ownHeaders.length).toBeGreaterThan(0);
        for (const header of ownHeaders) {
          if (header.attributes.some((attr) => attr.name === 'mat-cell')) {
            expect(attribute(header, 'scope')).toBe('row');
            expect(attribute(header, 'role')).toBe('rowheader');
          } else if (!header.attributes.some((attr) => attr.name === 'mat-header-cell')) {
            expect([
              undefined,
              'row',
              'col',
              'rowgroup',
              'colgroup'
            ]).toContain(attribute(header, 'scope'));
          }
        }
      }
    }
  });

  it.each(formControls)('%s control %i has a persistent accessible name', (path, index) => {
    const elements = template(path);
    const control = elements.filter((element) => [
        'input',
        'textarea'
      ].includes(element.name))[index];
    expect(control).toBeDefined();
    if (attribute(control, 'type') === 'file') {
      // The native chooser is hidden; the visible translated Browse button opens it.
      expect(
        control.inputs.some(
          (input) => input.name === 'display' && input.value instanceof ASTWithSource && input.value.source === "'none'"
        )
      ).toBe(true);
      return;
    }
    const labelledField = elements.some(
      (field) =>
        field.name === 'mat-form-field' &&
        contains(field, control) &&
        elements.some((label) => label.name === 'mat-label' && contains(field, label))
    );
    const explicitName = [
      'aria-label',
      'aria-labelledby'
    ].some(
      (name) =>
        !!attribute(control, name) ||
        control.inputs.some(
          (input) => input.name === name && input.value instanceof ASTWithSource && !!input.value.source
        )
    );
    expect(labelledField || explicitName).toBe(true);
  });
});
