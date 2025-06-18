import type { ReadableStream } from 'node:stream/web';

import type { DocumentElement, ParseOptions, ValidationResult } from '../../domain/types';

export interface ParseDocumentUseCase {
  execute(
    source: Buffer | ReadableStream,
    options?: ParseOptions
  ): AsyncGenerator<DocumentElement>;
}

export interface ExtractContentUseCase {
  extractText(
    source: Buffer | ReadableStream,
    options?: { preserveFormatting?: boolean }
  ): Promise<string>;

  extractImages(
    source: Buffer | ReadableStream
  ): AsyncGenerator<DocumentElement>;

  extractMetadata(
    source: Buffer | ReadableStream
  ): Promise<DocumentElement['content']>;
}

export interface ValidateDocumentUseCase {
  validate(source: Buffer | ReadableStream): Promise<ValidationResult>;
}

export interface StreamProcessUseCase {
  processStream(
    stream: ReadableStream,
    options?: ParseOptions
  ): AsyncGenerator<DocumentElement>;

  processBuffer(
    buffer: Buffer,
    options?: ParseOptions
  ): AsyncGenerator<DocumentElement>;
}

export interface ParseDocumentToArrayUseCase {
  execute(
    source: Buffer | ReadableStream,
    options?: ParseOptions
  ): Promise<DocumentElement[]>;
}
