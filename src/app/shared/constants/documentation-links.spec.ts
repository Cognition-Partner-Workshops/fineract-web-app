/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { DOCUMENTATION_PATHS } from './documentation-links';

describe('DOCUMENTATION_PATHS', () => {
  const absoluteLinks = Object.entries(DOCUMENTATION_PATHS).filter(
    ([
      ,
      url
    ]) => /^[a-z][a-z0-9+.-]*:/i.test(url)
  );

  it('contains external links', () => {
    expect(absoluteLinks.length).toBeGreaterThan(0);
  });

  it.each(absoluteLinks)('uses https for external link "%s"', (_key, url) => {
    expect(new URL(url).protocol).toBe('https:');
  });
});

describe('index.html', () => {
  it('does not link to clear-text http URLs', () => {
    const html = readFileSync(join(__dirname, '../../../index.html'), 'utf8');
    const httpLinks = html.match(/(?:href|src)\s*=\s*["']http:\/\/[^"']*/gi) ?? [];
    expect(httpLinks).toEqual([]);
  });
});
