/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Validators } from '@angular/forms';

import { FormGroupService } from './form-group.service';
import { FormfieldBase } from './formfield/model/formfield-base';

describe('FormGroupService', () => {
  let service: FormGroupService;

  beforeEach(() => {
    service = new FormGroupService();
  });

  it('should make a required field invalid until it has a value', () => {
    const form = service.createFormGroup([new FormfieldBase({ controlName: 'name', required: true })]);
    const control = form.get('name');

    expect(control.hasValidator(Validators.required)).toBe(true);
    expect(control.valid).toBe(false);
    control.setValue('Head Office');
    expect(control.valid).toBe(true);
  });

  it('should leave an optional field valid when empty', () => {
    const form = service.createFormGroup([new FormfieldBase({ controlName: 'note', required: false })]);
    const control = form.get('note');

    expect(control.hasValidator(Validators.required)).toBe(false);
    expect(control.valid).toBe(true);
  });

  it('should apply custom validators to required and optional fields alike', () => {
    const maxLength = Validators.maxLength(3);
    const form = service.createFormGroup([
      new FormfieldBase({ controlName: 'code', required: true, validators: [maxLength], value: 'ABCD' }),
      new FormfieldBase({ controlName: 'alias', required: false, validators: [maxLength], value: 'ABCD' })
    ]);

    expect(form.get('code').hasValidator(maxLength)).toBe(true);
    expect(form.get('alias').hasValidator(maxLength)).toBe(true);
    expect(form.get('code').valid).toBe(false);
    expect(form.get('alias').valid).toBe(false);
  });

  it('should seed each control with the field value', () => {
    const form = service.createFormGroup([new FormfieldBase({ controlName: 'amount', value: 42 })]);

    expect(form.get('amount').value).toBe(42);
  });
});
