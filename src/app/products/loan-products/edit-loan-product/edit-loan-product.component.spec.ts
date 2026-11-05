import { EditLoanProductComponent } from './edit-loan-product.component';

jest.mock('app/standalone-shared.module', () => ({ STANDALONE_SHARED_IMPORTS: [] as any[] }));

describe('Optional interest refund step', () => {
  it('returns null for an absent step', () => {
    const getter = Object.getOwnPropertyDescriptor(
      EditLoanProductComponent.prototype,
      'loanProductInterestRefundForm'
    )!.get!;
    expect(getter.call({})).toBeNull();
    const form = {};
    expect(getter.call({ loanProductInterestRefundStep: { loanProductInterestRefundForm: form } })).toBe(form);
  });
});
