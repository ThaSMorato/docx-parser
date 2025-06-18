import type { ReadableStream } from 'node:stream/web';

import { DocxParseError, type ValidationResult } from '../../domain/types';
import type { ValidateDocumentUseCase } from '../interfaces/use-cases';


export class ValidateDocumentUseCaseImpl implements ValidateDocumentUseCase {
  async validate(source: Buffer | ReadableStream): Promise<ValidationResult> {
    try {
      const errors: ValidationResult['errors'] = [];

      // Basic validation
      if (!source) {
        errors.push({
          code: 'INVALID_SOURCE',
          message: 'Source cannot be null or undefined',
          severity: 'error',
        });
      }

      // Validate buffer size if it's a Buffer
      if (source instanceof Buffer) {
        if (source.length === 0) {
          errors.push({
            code: 'EMPTY_BUFFER',
            message: 'Buffer is empty',
            severity: 'error',
          });
        }

        if (source.length > 100 * 1024 * 1024) { // 100MB
          errors.push({
            code: 'LARGE_FILE',
            message: 'File size exceeds 100MB limit',
            severity: 'warning',
          });
        }

        // Check for ZIP signature (DOCX is a ZIP file)
        if (!this.hasValidZipSignature(source)) {
          errors.push({
            code: 'INVALID_ZIP_SIGNATURE',
            message: 'File does not appear to be a valid ZIP archive',
            severity: 'error',
          });
        }
      }

      // TODO: Add more sophisticated validation
      // - Check for required DOCX structure (/word/document.xml, etc.)
      // - Validate XML content
      // - Check for corrupted entries

      return {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
      };
    } catch (error) {
      throw new DocxParseError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private hasValidZipSignature(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    // Check for ZIP local file header signature (PK\x03\x04)
    return (
      buffer[0] === 0x50 && // P
      buffer[1] === 0x4B && // K
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }
}
