import { CreateLoanProductComponent } from './create-loan-product.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Optional loan product steps', () => {
  it.each([
    'Currency',
    'InterestRefund'
  ])('returns null for absent %s step', (name) => {
    const getter = Object.getOwnPropertyDescriptor(
      CreateLoanProductComponent.prototype,
      `loanProduct${name}Form`
    )!.get!;
    expect(getter.call({})).toBeNull();
    const form = {};
    expect(getter.call({ [`loanProduct${name}Step`]: { [`loanProduct${name}Form`]: form } })).toBe(form);
  });
});
