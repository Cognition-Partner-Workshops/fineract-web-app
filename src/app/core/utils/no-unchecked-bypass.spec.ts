/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

describe('security trust boundary', () => {
  it('has no unchecked sanitizer bypass calls outside the report URL utility', () => {
    const root = join(process.cwd(), 'src/app');
    const unchecked = sourceFiles(root)
      .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.endsWith('/report-blob-url.ts'))
      .filter((path) => /\bbypassSecurityTrust\w*\s*\(/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(root, path));
    expect(unchecked).toEqual([]);
  });
});
