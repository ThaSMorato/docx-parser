// Main entry point for DOCX Parser library

// Version export
export const VERSION = '1.0.0';

// Main parsing functions (Primary API)
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

// Essential types for TypeScript users
export type {
  DocumentElement,
  ParseOptions,
  ValidationResult,
  MetadataElement,
  ParagraphElement,
  ImageElement,
  TableElement,
  HeaderElement,
  FooterElement,
  ListElement,
  PageBreakElement,
  SectionElement,
} from './domain/types';

// Error handling
export { DocxParseError } from './domain/types';

// Utility for advanced users
export { StreamAdapter } from './infrastructure/adapters/stream-adapter';

// Validation utility
export { ValidateDocumentUseCaseImpl } from './application/use-cases/validate-document.use-case';
