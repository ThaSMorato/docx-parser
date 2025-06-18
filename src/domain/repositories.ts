import type { ReadableStream } from 'node:stream/web';

import type { DocumentElement, ParseOptions } from './types';

export interface DocumentRepository {
  parse(source: Buffer | ReadableStream, options?: ParseOptions): AsyncGenerator<DocumentElement>;
}

export interface ZipRepository {
  extractFile(buffer: Buffer, filename: string): Promise<Buffer | null>;
  extractFiles(buffer: Buffer, pattern: RegExp): Promise<Map<string, Buffer>>;
}

export interface XmlRepository {
  parseXml(xmlContent: string): globalThis.Document;
  extractText(xmlDoc: globalThis.Document): string;
  extractElements(xmlDoc: globalThis.Document, tagName: string): globalThis.Element[];
}
