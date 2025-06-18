import type { ReadableStream } from 'node:stream/web';

import { type DocumentElement, DocxParseError, type ParseOptions } from '../../domain/types';
import type { ParseDocumentToArrayUseCase } from '../interfaces/use-cases';

import { ParseDocumentUseCaseImpl } from './parse-document.use-case';


export class ParseDocumentToArrayUseCaseImpl implements ParseDocumentToArrayUseCase {
  private parseDocumentUseCase: ParseDocumentUseCaseImpl;

  constructor() {
    this.parseDocumentUseCase = new ParseDocumentUseCaseImpl();
  }

  async execute(
    source: Buffer | ReadableStream,
    options?: ParseOptions
  ): Promise<DocumentElement[]> {
    try {
      const elements: DocumentElement[] = [];

      for await (const element of this.parseDocumentUseCase.execute(source, options)) {
        elements.push(element);
      }

      return elements;
    } catch (error) {
      throw new DocxParseError(
        `Failed to parse document to array: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
