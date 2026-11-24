import {
  generateCustomerReferenceId,
  generateServiceReferenceId,
  generateInquiryReferenceId,
  generateReviewReferenceId,
  generateFeedbackReferenceId,
  generateFaqReferenceId,
} from './reference-id.util';

describe('reference-id.util', () => {
  describe('generateCustomerReferenceId', () => {
    it('should generate a reference ID starting with IKISAKI- followed by 6 clean chars', () => {
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

  describe('generateServiceReferenceId', () => {
    it('should generate a reference ID starting with SRV- followed by 8 clean chars', () => {
      const id = generateServiceReferenceId();
      expect(id).toMatch(/^SRV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    it('should not contain ambiguous characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateServiceReferenceId();
        const code = id.replace('SRV-', '');
        expect(code).not.toMatch(/[0O1I]/);
        expect(code.length).toBe(8);
      }
    });
  });

  describe('generateInquiryReferenceId', () => {
    it('should generate a reference ID starting with INQ- followed by 8 clean chars', () => {
      const id = generateInquiryReferenceId();
      expect(id).toMatch(/^INQ-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    it('should not contain ambiguous characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateInquiryReferenceId();
        const code = id.replace('INQ-', '');
        expect(code).not.toMatch(/[0O1I]/);
        expect(code.length).toBe(8);
      }
    });
  });

  describe('generateReviewReferenceId', () => {
    it('should generate a reference ID starting with REV- followed by 8 clean chars', () => {
      const id = generateReviewReferenceId();
      expect(id).toMatch(/^REV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    it('should not contain ambiguous characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateReviewReferenceId();
        const code = id.replace('REV-', '');
        expect(code).not.toMatch(/[0O1I]/);
        expect(code.length).toBe(8);
      }
    });
  });

  describe('generateFeedbackReferenceId', () => {
    it('should generate a reference ID starting with FDB- followed by 8 clean chars', () => {
      const id = generateFeedbackReferenceId();
      expect(id).toMatch(/^FDB-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    });

    it('should not contain ambiguous characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateFeedbackReferenceId();
        const code = id.replace('FDB-', '');
        expect(code).not.toMatch(/[0O1I]/);
        expect(code.length).toBe(8);
      }
    });
  });

  describe('generateFaqReferenceId', () => {
    it('should generate a reference ID starting with FAQ- followed by 6 clean chars', () => {
      const id = generateFaqReferenceId();
      expect(id).toMatch(/^FAQ-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    });

    it('should not contain ambiguous characters', () => {
      for (let i = 0; i < 50; i++) {
        const id = generateFaqReferenceId();
        const code = id.replace('FAQ-', '');
        expect(code).not.toMatch(/[0O1I]/);
        expect(code.length).toBe(6);
      }
    });
  });
});
