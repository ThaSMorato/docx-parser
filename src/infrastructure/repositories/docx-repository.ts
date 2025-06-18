import type { ReadableStream } from 'node:stream/web';

import type { DocumentRepository } from '../../domain/repositories';
import { type DocumentElement, DocxParseError, type ParseOptions } from '../../domain/types';
import { XmlAdapter } from '../adapters/xml-adapter';
import { ZipAdapter } from '../adapters/zip-adapter';

export class DocxRepository implements DocumentRepository {
  private zipAdapter: ZipAdapter;
  private xmlAdapter: XmlAdapter;

  constructor() {
    this.zipAdapter = new ZipAdapter();
    this.xmlAdapter = new XmlAdapter();
  }

  async* parse(
    source: Buffer | ReadableStream,
    options: ParseOptions = {}
  ): AsyncGenerator<DocumentElement> {
    try {
      // Convert ReadableStream to Buffer if needed
      const buffer = source instanceof Buffer
        ? source
        : await this.streamToBuffer(source as ReadableStream);

      // Set default options
      const opts: Required<ParseOptions> = {
        includeMetadata: options.includeMetadata ?? true,
        includeImages: options.includeImages ?? true,
        includeTables: options.includeTables ?? true,
        includeHeaders: options.includeHeaders ?? false,
        includeFooters: options.includeFooters ?? false,
        imageFormat: options.imageFormat ?? 'buffer',
        maxImageSize: options.maxImageSize ?? 10 * 1024 * 1024, // 10MB
        preserveFormatting: options.preserveFormatting ?? true,
        normalizeWhitespace: options.normalizeWhitespace ?? true,
        chunkSize: options.chunkSize ?? 64 * 1024, // 64KB
        concurrent: options.concurrent ?? false,
      };

      let elementId = 0;
      const getNextId = () => `element_${++elementId}`;

      // Extract metadata first if requested
      if (opts.includeMetadata) {
        yield* this.extractMetadata(buffer, getNextId);
      }

      // Extract document content
      yield* this.extractContent(buffer, opts, getNextId);

      // Extract headers if requested
      if (opts.includeHeaders) {
        yield* this.extractHeaders(buffer, getNextId);
      }

      // Extract footers if requested
      if (opts.includeFooters) {
        yield* this.extractFooters(buffer, getNextId);
      }

      // Extract footnotes
      yield* this.extractFootnotes(buffer, getNextId);

      // Extract images if requested
      if (opts.includeImages) {
        yield* this.extractImages(buffer, opts, getNextId);
      }
    } catch (error) {
      throw new DocxParseError(
        `Failed to parse DOCX document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return Buffer.concat(chunks);
  }

  private async* extractMetadata(
    buffer: Buffer,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      // Extract core properties (metadata)
      const corePropsBuffer = await this.zipAdapter.extractFile(buffer, 'docProps/core.xml');

      if (corePropsBuffer) {
        const corePropsXml = corePropsBuffer.toString('utf-8');

        // Simple regex-based metadata extraction
        const title = this.extractMetadataValue(corePropsXml, 'dc:title');
        const author = this.extractMetadataValue(corePropsXml, 'dc:creator');
        const subject = this.extractMetadataValue(corePropsXml, 'dc:subject');
        const created = this.extractMetadataDate(corePropsXml, 'dcterms:created');
        const modified = this.extractMetadataDate(corePropsXml, 'dcterms:modified');

        yield {
          type: 'metadata',
          id: getNextId(),
          position: { page: 0, section: 0, order: 0 },
          content: {
            title: title || undefined,
            author: author || undefined,
            subject: subject || undefined,
            created: created || undefined,
            modified: modified || undefined,
          },
        } as DocumentElement;
      } else {
        // Fallback metadata
        yield {
          type: 'metadata',
          id: getNextId(),
          position: { page: 0, section: 0, order: 0 },
          content: {
            title: 'Unknown Document',
            author: 'Unknown',
          },
        } as DocumentElement;
      }
    } catch (error) {
      // If metadata extraction fails, yield empty metadata
      yield {
        type: 'metadata',
        id: getNextId(),
        position: { page: 0, section: 0, order: 0 },
        content: {},
      } as DocumentElement;
    }
  }

  private async* extractContent(
    buffer: Buffer,
    options: Required<ParseOptions>,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      const documentBuffer = await this.zipAdapter.extractFile(buffer, 'word/document.xml');

      if (!documentBuffer) {
        throw new DocxParseError('Main document XML not found');
      }

      const documentXml = documentBuffer.toString('utf-8');

      // Extract paragraphs with formatting information to detect headers and checkboxes
      const elements = this.xmlAdapter.extractParagraphsWithFormattingFromXml(documentXml);
      let order = 1;

      for (const element of elements) {
        const content = options.normalizeWhitespace
          ? element.text.replace(/\s+/g, ' ').trim()
          : element.text;

        if (element.type === 'header') {
          yield {
            type: 'header',
            id: getNextId(),
            position: { page: 1, section: 1, order: order++ },
            content,
            level: element.level || 1,
            formatting: {
              fontFamily: 'Calibri',
              fontSize: 12,
              ...element.formatting,
            },
          } as DocumentElement;
        } else {
          const documentElement: DocumentElement = {
            type: 'paragraph',
            id: getNextId(),
            position: { page: 1, section: 1, order: order++ },
            content,
            formatting: {
              fontFamily: 'Calibri',
              fontSize: 12,
              ...element.formatting,
            },
          };

          // Add checkbox information if strike formatting is present
          if (element.formatting?.strike) {
            (documentElement as any).checkbox = {
              checked: true
            };
          }

          yield documentElement;
        }
      }

      // Extract tables if requested
      if (options.includeTables) {
        yield* this.extractTables(documentXml, options, getNextId, order);
      }
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async* extractTables(
    documentXml: string,
    options: Required<ParseOptions>,
    getNextId: () => string,
    startOrder: number
  ): AsyncGenerator<DocumentElement> {
    try {
      const tables = this.xmlAdapter.extractTablesFromXml(documentXml);
      let order = startOrder;

      for (const table of tables) {
        const tableRows = table.rows.map(row => ({
          cells: row.cells.map(cellText => ({
            content: options.normalizeWhitespace
              ? cellText.replace(/\s+/g, ' ').trim()
              : cellText,
          })),
          isHeader: false,
        }));

        yield {
          type: 'table',
          id: getNextId(),
          position: { page: 1, section: 1, order: order++ },
          content: tableRows,
        } as DocumentElement;
      }
    } catch (error) {
      // If table extraction fails, continue without tables
      console.warn('Failed to extract tables:', error);
    }
  }

  private async* extractImages(
    buffer: Buffer,
    options: Required<ParseOptions>,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      // Extract media files (images)
      const mediaFiles = await this.zipAdapter.extractFiles(buffer, /^word\/media\//);
      let order = 1000; // Start images at higher order

      for (const [filename, imageBuffer] of mediaFiles) {
        if (imageBuffer.length > options.maxImageSize) {
          continue; // Skip large images
        }

        const format = this.getImageFormat(filename);
        if (!format) continue;

        const filenameOnly = filename.split('/').pop() || 'unknown.img';

        yield {
          type: 'image',
          id: getNextId(),
          position: { page: 1, section: 1, order: order++ },
          content: imageBuffer,
          metadata: {
            filename: filenameOnly,
            format,
            width: 0, // TODO: Extract actual dimensions
            height: 0,
          },
          positioning: {
            inline: true,
          },
        } as DocumentElement;
      }
    } catch (error) {
      // If image extraction fails, continue without images
      console.warn('Failed to extract images:', error);
    }
  }

  private extractMetadataValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim() || null;
  }

  private extractMetadataDate(xml: string, tagName: string): Date | null {
    const dateStr = this.extractMetadataValue(xml, tagName);
    return dateStr ? new Date(dateStr) : null;
  }

  private getImageFormat(filename: string): 'png' | 'jpg' | 'gif' | 'svg' | 'wmf' | 'emf' | null {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'png': return 'png';
      case 'jpg':
      case 'jpeg': return 'jpg';
      case 'gif': return 'gif';
      case 'svg': return 'svg';
      case 'wmf': return 'wmf';
      case 'emf': return 'emf';
      default: return null;
    }
  }

  private async* extractHeaders(
    buffer: Buffer,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      // Extract header files
      const headerFiles = await this.zipAdapter.extractFiles(buffer, /^word\/header\d*\.xml$/);
      let order = 2000; // Start headers at higher order

      for (const [, headerBuffer] of headerFiles) {
        const headerXml = headerBuffer.toString('utf-8');
        const headerInfo = this.xmlAdapter.extractHeaderFromXml(headerXml);

        if (headerInfo) {
          const element: DocumentElement = {
            type: 'header',
            id: getNextId(),
            position: { page: 1, section: 1, order: order++ },
            content: headerInfo.text,
            level: 1,
          };

          // Add additional properties
          if (headerInfo.hasPageNumber) {
            (element as any).hasPageNumber = true;
          }
          if (headerInfo.watermark) {
            (element as any).watermark = headerInfo.watermark;
          }

          yield element;
        }
      }
    } catch (error) {
      // If header extraction fails, continue without headers
      console.warn('Failed to extract headers:', error);
    }
  }

  private async* extractFooters(
    buffer: Buffer,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      // Extract footer files
      const footerFiles = await this.zipAdapter.extractFiles(buffer, /^word\/footer\d*\.xml$/);
      let order = 3000; // Start footers at higher order

      for (const [, footerBuffer] of footerFiles) {
        const footerXml = footerBuffer.toString('utf-8');
        const footerInfo = this.xmlAdapter.extractFooterFromXml(footerXml);

        if (footerInfo) {
          const element: DocumentElement = {
            type: 'footer',
            id: getNextId(),
            position: { page: 1, section: 1, order: order++ },
            content: footerInfo.text,
          };

          // Add additional properties
          if (footerInfo.hasPageNumber) {
            (element as any).hasPageNumber = true;
          }

          yield element;
        }
      }
    } catch (error) {
      // If footer extraction fails, continue without footers
      console.warn('Failed to extract footers:', error);
    }
  }

  private async* extractFootnotes(
    buffer: Buffer,
    getNextId: () => string
  ): AsyncGenerator<DocumentElement> {
    try {
      // Extract footnotes file
      const footnotesBuffer = await this.zipAdapter.extractFile(buffer, 'word/footnotes.xml');

      if (footnotesBuffer) {
        const footnotesXml = footnotesBuffer.toString('utf-8');
        const footnotes = this.xmlAdapter.extractFootnotesFromXml(footnotesXml);
        let order = 4000; // Start footnotes at higher order

        for (const footnote of footnotes) {
          // Use paragraph type for footnotes since footnote type doesn't exist in DocumentElement
          const element: DocumentElement = {
            type: 'paragraph',
            id: getNextId(),
            position: { page: 1, section: 1, order: order++ },
            content: footnote.text,
            formatting: {
              fontFamily: 'Calibri',
              fontSize: 10,
            },
          };

          // Add footnote metadata
          (element as any).footnoteId = footnote.id;
          (element as any).isFootnote = true;

          yield element;
        }
      }
    } catch (error) {
      // If footnote extraction fails, continue without footnotes
      console.warn('Failed to extract footnotes:', error);
    }
  }
}
