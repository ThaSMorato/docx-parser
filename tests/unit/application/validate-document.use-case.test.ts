import { beforeEach, describe, expect, it } from 'vitest';

import { ValidateDocumentUseCaseImpl } from '../../../src/application/use-cases/validate-document.use-case';
import { DocxParseError } from '../../../src/domain/types';

describe('ValidateDocumentUseCase', () => {
  let useCase: ValidateDocumentUseCaseImpl;

  beforeEach(() => {
    useCase = new ValidateDocumentUseCaseImpl();
  });

  describe('validate', () => {
    it('should return error for null source', async () => {
      const result = await useCase.validate(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_SOURCE');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should return error for empty buffer', async () => {
      const buffer = Buffer.alloc(0);
      const result = await useCase.validate(buffer);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'EMPTY_BUFFER')).toBe(true);
    });

    it('should return warning for large file', async () => {
      const buffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
      const result = await useCase.validate(buffer);

      expect(result.errors.some(e => e.code === 'LARGE_FILE' && e.severity === 'warning')).toBe(true);
    });

    it('should return error for invalid ZIP signature', async () => {
      const buffer = Buffer.from('invalid content');
      const result = await useCase.validate(buffer);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_ZIP_SIGNATURE')).toBe(true);
    });

    it('should return valid for proper ZIP signature', async () => {
      // Create buffer with ZIP signature (PK\x03\x04)
      const buffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, ...Array(100).fill(0)]);
      const result = await useCase.validate(buffer);

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Mock hasValidZipSignature to throw an error
      const originalMethod = (useCase as any).hasValidZipSignature;
      (useCase as any).hasValidZipSignature = () => {
        throw new Error('Test error');
      };

      await expect(useCase.validate(Buffer.from('test'))).rejects.toThrow(DocxParseError);

      // Restore original method
      (useCase as any).hasValidZipSignature = originalMethod;
    });
  });
});
