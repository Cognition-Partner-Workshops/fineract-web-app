/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DOCUMENTATION_PATHS } from './documentation-links';

describe('DOCUMENTATION_PATHS', () => {
  const absoluteLinks = Object.entries(DOCUMENTATION_PATHS).filter(
    ([
      ,
      url
    ]) => /^[a-z]+:\/\//i.test(url)
  );

  it('has absolute external links to check', () => {
    expect(absoluteLinks.length).toBeGreaterThan(0);
  });

  it.each(absoluteLinks)('%s uses https', (_page, url) => {
    expect(url.startsWith('https://')).toBe(true);
  });
});
