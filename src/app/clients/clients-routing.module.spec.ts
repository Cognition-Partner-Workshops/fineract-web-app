/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Route as NgRoute } from '@angular/router';

jest.mock('jspdf', () => jest.fn());
jest.mock('jspdf-autotable', () => jest.fn());

import { routes } from './clients-routing.module';
import { ClientSummaryResolver } from './common-resolvers/client-summary.resolver';
import { GeneralTabComponent } from './clients-view/general-tab/general-tab.component';

function findRoute(list: NgRoute[], predicate: (r: NgRoute) => boolean): NgRoute | undefined {
  for (const r of list) {
    if (predicate(r)) {
      return r;
    }
    const child = r.children ? findRoute(r.children, predicate) : undefined;
    if (child) {
      return child;
    }
  }
  return undefined;
}

describe('ClientsRoutingModule', () => {
  it('resolves the client summary for the client General tab (Performance History)', () => {
    const general = findRoute(routes, (r) => r.component === GeneralTabComponent);
    expect(general).toBeDefined();
    expect(general.resolve.clientSummary).toBe(ClientSummaryResolver);
  });
});
