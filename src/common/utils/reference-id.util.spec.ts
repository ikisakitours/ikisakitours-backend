import { generateCustomerReferenceId } from './reference-id.util';

describe('reference-id.util', () => {
  it('should generate a reference ID starting with IKISAKI-', () => {
    const id = generateCustomerReferenceId();
    expect(id).toMatch(/^IKISAKI-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  });

  it('should not contain ambiguous characters 0, O, 1, or I', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateCustomerReferenceId();
      const code = id.replace('IKISAKI-', '');
      expect(code).not.toMatch(/[0O1I]/);
      expect(code.length).toBe(6);
    }
  });
});
