import { createReadStream } from 'node:fs';
import { ReadableStream } from 'node:stream/web';

import { ExtractContentUseCaseImpl, ParseDocumentToArrayUseCaseImpl, ParseDocumentUseCaseImpl } from '../application/use-cases';
import type { DocumentElement, ParseOptions } from '../domain/types';

// Main parser functions following the API specified in REQUIREMENTS.md

/**
 * Parse a DOCX document from a Buffer, yielding elements incrementally
 */
export async function* parseDocx(
  buffer: Buffer,
  options?: ParseOptions
): AsyncGenerator<DocumentElement> {
  const useCase = new ParseDocumentUseCaseImpl();
  yield* useCase.execute(buffer, options);
}

/**
 * Parse a DOCX document from a ReadableStream, yielding elements incrementally
 */
export async function* parseDocxStream(
  stream: ReadableStream,
  options?: ParseOptions
): AsyncGenerator<DocumentElement> {
  const useCase = new ParseDocumentUseCaseImpl();
  yield* useCase.execute(stream, options);
}

/**
 * Parse a DOCX document from a file path, yielding elements incrementally
 */
export async function* parseDocxFile(
  filePath: string,
  options?: ParseOptions
): AsyncGenerator<DocumentElement> {
  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => {
        const uint8Array = chunk instanceof Buffer
          ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          : new Uint8Array(Buffer.from(chunk));
        controller.enqueue(uint8Array);
      });

      stream.on('end', () => {
        controller.close();
      });

      stream.on('error', (err) => {
        controller.error(err);
      });
    }
  });

  yield* parseDocxStream(webStream, options);
}

/**
 * Parse a DOCX document and return all elements as an array (non-streaming)
 */
export async function parseDocxToArray(
  source: Buffer | ReadableStream,
  options?: ParseOptions
): Promise<DocumentElement[]> {
  const useCase = new ParseDocumentToArrayUseCaseImpl();
  return useCase.execute(source, options);
}

/**
 * Extract only text content from a DOCX document
 */
export async function extractText(
  source: Buffer | ReadableStream,
  options?: { preserveFormatting?: boolean }
): Promise<string> {
  const useCase = new ExtractContentUseCaseImpl();
  return useCase.extractText(source, options);
}

/**
 * Extract only images from a DOCX document
 */
export async function* extractImages(
  source: Buffer | ReadableStream
): AsyncGenerator<DocumentElement> {
  const useCase = new ExtractContentUseCaseImpl();
  yield* useCase.extractImages(source);
}

/**
 * Get document metadata only
 */
export async function getMetadata(
  source: Buffer | ReadableStream
): Promise<DocumentElement['content']> {
  const useCase = new ExtractContentUseCaseImpl();
  return useCase.extractMetadata(source);
}
