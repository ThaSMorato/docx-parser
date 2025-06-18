import { ReadableStream } from 'node:stream/web';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ParseDocumentUseCaseImpl } from '../../../src/application/use-cases/parse-document.use-case';
import { DocxParseError } from '../../../src/domain/types';

// Mock the DocxRepository
const mockDocxRepository = {
  parse: vi.fn()
};

vi.mock('../../../src/infrastructure/repositories/docx-repository', () => ({
  DocxRepository: vi.fn().mockImplementation(() => mockDocxRepository)
}));

describe('ParseDocumentUseCase', () => {
  let useCase: ParseDocumentUseCaseImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ParseDocumentUseCaseImpl();

    // Default mock implementation
    mockDocxRepository.parse.mockImplementation(async function* (source, options) {
      if (!source) {
        throw new DocxParseError('Invalid source');
      }

      // Mock metadata
      if (options?.includeMetadata !== false) {
        yield {
          type: 'metadata',
          id: 'meta_1',
          position: { page: 0, section: 0, order: 0 },
          content: {
            title: 'Sample Document',
            author: 'Unknown',
          },
        };
      }

      // Mock paragraph
      yield {
        type: 'paragraph',
        id: 'p1',
        position: { page: 1, section: 1, order: 1 },
        content: 'This is a sample paragraph from buffer parsing.',
        formatting: {
          bold: false,
          italic: false,
          fontSize: 12,
          fontFamily: 'Calibri',
        },
      };
    });
  });

  describe('execute', () => {
    it('should throw error for null source', async () => {
      await expect(async () => {
        for await (const element of useCase.execute(null as any)) {
          console.log(element); // Use the variable
        }
      }).rejects.toThrow(DocxParseError);
    });

    it('should throw error for undefined source', async () => {
      await expect(async () => {
        for await (const element of useCase.execute(undefined as any)) {
          console.log(element); // Use the variable
        }
      }).rejects.toThrow(DocxParseError);
    });

    it('should yield metadata when includeMetadata is true', async () => {
      const buffer = Buffer.from('test content');
      const options = { includeMetadata: true };

      const elements: any[] = [];
      for await (const element of useCase.execute(buffer, options)) {
        elements.push(element);
      }

      expect(elements).toHaveLength(2); // metadata + sample paragraph
      expect(elements[0].type).toBe('metadata');
      expect(elements[0].content).toMatchObject({
        title: 'Sample Document',
        author: 'Unknown',
      });
    });

    it('should not yield metadata when includeMetadata is false', async () => {
      const buffer = Buffer.from('test content');
      const options = { includeMetadata: false };

      const elements: any[] = [];
      for await (const element of useCase.execute(buffer, options)) {
        elements.push(element);
      }

      expect(elements).toHaveLength(1); // only sample paragraph
      expect(elements[0].type).toBe('paragraph');
    });

    it('should yield paragraph element from buffer', async () => {
      const buffer = Buffer.from('test content');

      const elements: any[] = [];
      for await (const element of useCase.execute(buffer)) {
        elements.push(element);
      }

      const paragraphElement = elements.find(e => e.type === 'paragraph');
      expect(paragraphElement).toBeDefined();
      expect(paragraphElement?.content).toBe('This is a sample paragraph from buffer parsing.');
      expect(paragraphElement?.formatting).toMatchObject({
        bold: false,
        italic: false,
        fontSize: 12,
        fontFamily: 'Calibri',
      });
    });

    it('should use default options when none provided', async () => {
      const buffer = Buffer.from('test content');

      const elements: any[] = [];
      for await (const element of useCase.execute(buffer)) {
        elements.push(element);
      }

      // Should include metadata by default
      expect(elements.some(e => e.type === 'metadata')).toBe(true);
    });

    it('should handle ReadableStream input', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          controller.close();
        },
      }) as any; // Type assertion to avoid compatibility issues

      const elements: any[] = [];
      for await (const element of useCase.execute(stream)) {
        elements.push(element);
      }

      expect(elements.length).toBeGreaterThan(0);
    });

    it('should propagate DocxParseError', async () => {
      const buffer = Buffer.from('test');

      // Mock repository to throw DocxParseError
      mockDocxRepository.parse.mockImplementationOnce(async function* () {
        throw new DocxParseError('Test error');
        yield; // eslint-disable-line no-unreachable
      });

      await expect(async () => {
        for await (const element of useCase.execute(buffer)) {
          console.log(element); // Use the variable
        }
      }).rejects.toThrow(DocxParseError);
    });

    it('should wrap non-DocxParseError in DocxParseError', async () => {
      const buffer = Buffer.from('test');

      // Mock repository to throw generic Error
      mockDocxRepository.parse.mockImplementationOnce(async function* () {
        throw new Error('Generic error');
        yield; // eslint-disable-line no-unreachable
      });

      await expect(async () => {
        for await (const element of useCase.execute(buffer)) {
          console.log(element); // Use the variable
        }
      }).rejects.toThrow(DocxParseError);
    });
  });
});
