/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseTemplate, TmplAstElement, TmplAstNode } from '@angular/compiler';
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

function templates(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? templates(path) : path.endsWith('.html') ? [path] : [];
  });
}

function children(node: TmplAstNode): TmplAstNode[] {
  const container = node as unknown as Record<string, unknown>;
  return [
    'children',
    'branches',
    'cases',
    'empty',
    'placeholder',
    'loading',
    'error'
  ].flatMap((key) => {
    const value = container[key];
    return Array.isArray(value) ? value : value ? [value] : [];
  });
}

function elements(
  nodes: TmplAstNode[],
  ancestors: TmplAstElement[] = []
): { element: TmplAstElement; ancestors: TmplAstElement[] }[] {
  return nodes.flatMap((node) => {
    const element = node instanceof TmplAstElement ? node : undefined;
    return [
      ...(element ? [{ element, ancestors }] : []),
      ...elements(
        children(node),
        element ? [
              ...ancestors,
              element
            ] : ancestors
      )
    ];
  });
}

function violations(source: string, file: string): string[] {
  const parsed = parseTemplate(source, file);
  if (parsed.errors?.length) {
    throw new Error(parsed.errors.map((error) => error.toString()).join('\n'));
  }
  const all = elements(parsed.nodes);
  const attribute = (element: TmplAstElement, name: string) =>
    element.attributes.find((attr) => attr.name === name)?.value;
  const contains = (element: TmplAstElement, name: string) =>
    elements(element.children).some((item) => item.element.name === name);
  return all.flatMap(({ element, ancestors }) => {
    let issue: string | undefined;
    if (element.name === 'table' && !contains(element, 'th')) {
      issue = 'table has no th';
    }
    if ([
        'input',
        'textarea',
        'select'
      ].includes(element.name) && !(element.name === 'input' && [
          'hidden',
          'submit',
          'button',
          'reset',
          'image'
        ].includes(attribute(element, 'type') || ''))) {
      const named = [
          'aria-label',
          'aria-labelledby'
        ].some(
          (name) => !!attribute(element, name)?.trim() || element.inputs.some((input) => input.name === name)
        ) || all.some((item) => item.element.name === 'label' && !!attribute(element, 'id') && attribute(item.element, 'for') === attribute(element, 'id')) || ancestors.some((ancestor) => ancestor.name === 'label' || (ancestor.name === 'mat-form-field' && contains(ancestor, 'mat-label')));
      if (!named) issue = `${element.name} has no accessible name`;
    }
    return issue ? [`${file}:${element.sourceSpan.start.line + 1}: ${issue}`] : [];
  });
}

describe('template accessibility', () => {
  it('gives every table headers and every form control an accessible name', () => {
    const failures = templates(join(process.cwd(), 'src/app')).flatMap((file) =>
      violations(readFileSync(file, 'utf8'), relative(process.cwd(), file))
    );
    if (failures.length) {
      throw new Error(`${failures.length} violations\n${failures.join('\n')}`);
    }
  });

  it('walks control flow and rejects presentation tables and placeholder-only controls', () => {
    expect(
      violations(
        '@if (ready) { <table role="presentation"><tr><td>Value</td></tr></table><input placeholder="Name"> }',
        'example.html'
      )
    ).toHaveLength(2);
    expect(violations('', 'empty.html')).toEqual([]);
    expect(
      violations('<table><tr><th scope="row">Name</th><td><label><input></label></td></tr></table>', 'valid.html')
    ).toEqual([]);
    expect(() => violations('@if (', 'invalid.html')).toThrow();
  });

  it('accepts supported names and non-text input types', () => {
    const source = `
      <input aria-label="Name"><input [attr.aria-label]="name">
      <textarea aria-labelledby="title"></textarea><select [attr.aria-labelledby]="title"></select>
      <label for="name">Name</label><input id="name">
      <label><textarea></textarea></label>
      <mat-form-field><mat-label>Name</mat-label><input></mat-form-field>
      <input type="hidden"><input type="submit"><input type="button"><input type="reset"><input type="image">
      <table mat-table><ng-container><th mat-header-cell>Heading</th></ng-container></table>
    `;
    expect(violations(source, 'names.html')).toEqual([]);
  });

  it('checks loop, switch, deferred and empty blocks', () => {
    const source = `
      @for (item of items; track item) { <input> } @empty { <textarea></textarea> }
      @switch (mode) { @case ('one') { <select></select> } @default { <table></table> } }
      @defer { <input> } @placeholder { <input> } @loading { <input> } @error { <input> }
    `;
    expect(violations(source, 'blocks.html')).toHaveLength(8);
    expect(
      violations(
        '<input aria-label=""><input placeholder="Name"><input type="file"><table role="none"></table>',
        'missing.html'
      )
    ).toHaveLength(4);
  });
});
