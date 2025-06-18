import type { ReadableStream } from 'node:stream/web';

import { type DocumentElement, DocxParseError, type ParseOptions } from '../../domain/types';
import { DocxRepository } from '../../infrastructure/repositories/docx-repository';
import type { ParseDocumentUseCase } from '../interfaces/use-cases';

export class ParseDocumentUseCaseImpl implements ParseDocumentUseCase {
  private docxRepository: DocxRepository;

  constructor(docxRepository?: DocxRepository) {
    this.docxRepository = docxRepository || new DocxRepository();
  }

  async* execute(
    source: Buffer | ReadableStream,
    options: ParseOptions = {}
  ): AsyncGenerator<DocumentElement> {
    try {
      // Validate source
      if (!source) {
        throw new DocxParseError('Source cannot be null or undefined');
      }

      // Delegate to repository
      yield* this.docxRepository.parse(source, options);
    } catch (error) {
      if (error instanceof DocxParseError) {
        throw error;
      }
      throw new DocxParseError(
        `Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
