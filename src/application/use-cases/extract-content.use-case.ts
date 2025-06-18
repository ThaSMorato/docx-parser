import type { ReadableStream } from 'node:stream/web';

import { type DocumentElement, DocxParseError } from '../../domain/types';
import type { ExtractContentUseCase } from '../interfaces/use-cases';

import { ParseDocumentUseCaseImpl } from './parse-document.use-case';


export class ExtractContentUseCaseImpl implements ExtractContentUseCase {
  private parseDocumentUseCase: ParseDocumentUseCaseImpl;

  constructor() {
    this.parseDocumentUseCase = new ParseDocumentUseCaseImpl();
  }

  async extractText(
    source: Buffer | ReadableStream,
    options: { preserveFormatting?: boolean } = {}
  ): Promise<string> {
    try {
      const textParts: string[] = [];

      const parseOptions = {
        includeMetadata: false,
        includeImages: false,
        includeTables: true,
        preserveFormatting: options.preserveFormatting ?? false,
      };

      for await (const element of this.parseDocumentUseCase.execute(source, parseOptions)) {
        if (element.type === 'paragraph') {
          textParts.push(element.content);
        } else if (element.type === 'table') {
          // Extract text from table cells
          const tableText = element.content
            .map(row => row.cells.map(cell => cell.content).join('\t'))
            .join('\n');
          textParts.push(tableText);
        } else if (element.type === 'header') {
          textParts.push(element.content);
        }
      }

      return textParts.join('\n');
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async* extractImages(
    source: Buffer | ReadableStream
  ): AsyncGenerator<DocumentElement> {
    try {
      const parseOptions = {
        includeMetadata: false,
        includeImages: true,
        includeTables: false,
        includeHeaders: false,
        includeFooters: false,
      };

      for await (const element of this.parseDocumentUseCase.execute(source, parseOptions)) {
        if (element.type === 'image') {
          yield element;
        }
      }
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async extractMetadata(
    source: Buffer | ReadableStream
  ): Promise<DocumentElement['content']> {
    try {
      const parseOptions = {
        includeMetadata: true,
        includeImages: false,
        includeTables: false,
        includeHeaders: false,
        includeFooters: false,
      };

      for await (const element of this.parseDocumentUseCase.execute(source, parseOptions)) {
        if (element.type === 'metadata') {
          return element.content;
        }
      }

      // Return empty metadata if none found
      return {};
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
