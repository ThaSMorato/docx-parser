// Main entry point for DOCX Parser library
export * from './domain/index.js';
export * from './application/index.js';
export * from './infrastructure/index.js';
export * from './interfaces/index.js';

// Version export
export const VERSION = '1.0.0';

// Core library exports
export * from './domain';
export * from './application';
export * from './infrastructure';
export * from './interfaces';

// Re-export main types for convenience
export type {
  DocumentElement,
  ParseOptions,
  ValidationResult,
  MetadataElement,
  ParagraphElement,
  ImageElement,
  TableElement,
} from './domain/types';

// Re-export main Use Cases for convenience
export {
  ParseDocumentUseCaseImpl,
  ExtractContentUseCaseImpl,
  ValidateDocumentUseCaseImpl,
  ParseDocumentToArrayUseCaseImpl,
} from './application/use-cases';

// Re-export main parsing functions (recommended API)
export {
  parseDocx,
  parseDocxStream,
  parseDocxWebStream,
  parseDocxFile,
  parseDocxToArray,
  extractText,
  extractImages,
  getMetadata,
} from './interfaces/docx-parser';
