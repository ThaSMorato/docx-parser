import { createReadStream, type ReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import { ExtractContentUseCaseImpl, ParseDocumentToArrayUseCaseImpl, ParseDocumentUseCaseImpl } from '../application/use-cases';
import type { DocumentElement, ParseOptions } from '../domain/types';
import { StreamAdapter } from '../infrastructure/adapters/stream-adapter';

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
 * Parse a DOCX document from a ReadStream (Node.js), yielding elements incrementally
 */
export async function* parseDocxStream(
  stream: ReadStream,
  options?: ParseOptions
): AsyncGenerator<DocumentElement> {
  const useCase = new ParseDocumentUseCaseImpl();
  const webStream = StreamAdapter.toWebStream(stream);
  yield* useCase.execute(webStream, options);
}

/**
 * Parse a DOCX document from a Node.js Readable stream (como de requisições HTTP), yielding elements incrementally
 */
export async function* parseDocxHttpStream(
  stream: Readable,
  options?: ParseOptions
): AsyncGenerator<DocumentElement> {
  const useCase = new ParseDocumentUseCaseImpl();
  const webStream = StreamAdapter.nodeToWebStream(stream);
  yield* useCase.execute(webStream, options);
}

/**
 * Parse a DOCX document from a ReadableStream (Web API), yielding elements incrementally
 */
export async function* parseDocxWebStream(
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
  yield* parseDocxStream(stream, options);
}

/**
 * Parse a DOCX document and return all elements as an array (non-streaming)
 */
export async function parseDocxToArray(
  source: Buffer | ReadStream | ReadableStream | Readable,
  options?: ParseOptions
): Promise<DocumentElement[]> {
  const useCase = new ParseDocumentToArrayUseCaseImpl();

  if (source instanceof Buffer) {
    return useCase.execute(source, options);
  } else if ('readable' in source && 'path' in source) {
    // ReadStream do Node.js (arquivo)
    const webStream = StreamAdapter.toWebStream(source as ReadStream);
    return useCase.execute(webStream, options);
  } else if (typeof (source as any).getReader === 'function') {
    // ReadableStream da web
    return useCase.execute(source as ReadableStream, options);
  } else if (typeof (source as any).read === 'function' && typeof (source as any).on === 'function') {
    // Node.js Readable stream (HTTP requests, etc)
    const webStream = StreamAdapter.nodeToWebStream(source as Readable);
    return useCase.execute(webStream, options);
  } else {
    throw new Error('Unsupported source type');
  }
}

/**
 * Extract only text content from a DOCX document
 */
export async function extractText(
  source: Buffer | ReadStream | ReadableStream | Readable,
  options?: { preserveFormatting?: boolean }
): Promise<string> {
  const useCase = new ExtractContentUseCaseImpl();

  if (source instanceof Buffer) {
    return useCase.extractText(source, options);
  } else if ('readable' in source && 'path' in source) {
    // ReadStream do Node.js (arquivo)
    const webStream = StreamAdapter.toWebStream(source as ReadStream);
    return useCase.extractText(webStream, options);
  } else if (typeof (source as any).getReader === 'function') {
    // ReadableStream da web
    return useCase.extractText(source as ReadableStream, options);
  } else if (typeof (source as any).read === 'function' && typeof (source as any).on === 'function') {
    // Node.js Readable stream (HTTP requests, etc)
    const webStream = StreamAdapter.nodeToWebStream(source as Readable);
    return useCase.extractText(webStream, options);
  } else {
    throw new Error('Unsupported source type');
  }
}

/**
 * Extract only images from a DOCX document
 */
export async function* extractImages(
  source: Buffer | ReadStream | ReadableStream | Readable
): AsyncGenerator<DocumentElement> {
  const useCase = new ExtractContentUseCaseImpl();

  if (source instanceof Buffer) {
    yield* useCase.extractImages(source);
  } else if ('readable' in source && 'path' in source) {
    // ReadStream do Node.js (arquivo)
    const webStream = StreamAdapter.toWebStream(source as ReadStream);
    yield* useCase.extractImages(webStream);
  } else if (typeof (source as any).getReader === 'function') {
    // ReadableStream da web
    yield* useCase.extractImages(source as ReadableStream);
  } else if (typeof (source as any).read === 'function' && typeof (source as any).on === 'function') {
    // Node.js Readable stream (HTTP requests, etc)
    const webStream = StreamAdapter.nodeToWebStream(source as Readable);
    yield* useCase.extractImages(webStream);
  } else {
    throw new Error('Unsupported source type');
  }
}

/**
 * Get document metadata only
 */
export async function getMetadata(
  source: Buffer | ReadStream | ReadableStream | Readable
): Promise<DocumentElement['content']> {
  const useCase = new ExtractContentUseCaseImpl();

  if (source instanceof Buffer) {
    return useCase.extractMetadata(source);
  } else if ('readable' in source && 'path' in source) {
    // ReadStream do Node.js (arquivo)
    const webStream = StreamAdapter.toWebStream(source as ReadStream);
    return useCase.extractMetadata(webStream);
  } else if (typeof (source as any).getReader === 'function') {
    // ReadableStream da web
    return useCase.extractMetadata(source as ReadableStream);
  } else if (typeof (source as any).read === 'function' && typeof (source as any).on === 'function') {
    // Node.js Readable stream (HTTP requests, etc)
    const webStream = StreamAdapter.nodeToWebStream(source as Readable);
    return useCase.extractMetadata(webStream);
  } else {
    throw new Error('Unsupported source type');
  }
}
