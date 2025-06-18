import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExtractContentUseCaseImpl } from '../../../src/application/use-cases/extract-content.use-case';
import { DocxParseError } from '../../../src/domain/types';

// Mock the ParseDocumentUseCaseImpl
const mockParseDocumentUseCase = {
  execute: vi.fn()
};

vi.mock('../../../src/application/use-cases/parse-document.use-case', () => ({
  ParseDocumentUseCaseImpl: vi.fn().mockImplementation(() => mockParseDocumentUseCase)
}));

describe('ExtractContentUseCase', () => {
  let useCase: ExtractContentUseCaseImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ExtractContentUseCaseImpl();

    // Default mock implementation
    mockParseDocumentUseCase.execute.mockImplementation(async function* (source, options) {
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

      // Mock paragraph for text extraction
      if (options?.includeImages === false) {
        yield {
          type: 'paragraph',
          id: 'p1',
          position: { page: 1, section: 1, order: 1 },
          content: 'Sample Document Content',
        };
      }

      // Mock image for image extraction
      if (options?.includeImages === true) {
        yield {
          type: 'image',
          id: 'img1',
          position: { page: 1, section: 1, order: 1000 },
          content: Buffer.from('fake image data'),
          metadata: {
            filename: 'image1.png',
            format: 'png',
            width: 100,
            height: 100,
          },
        };
      }
    });
  });

  describe('extractText', () => {
    it('should extract text from buffer', async () => {
      const buffer = Buffer.from('Sample DOCX content');

      const text = await useCase.extractText(buffer);

      expect(text).toBe('Sample Document Content');
    });

    it('should handle preserveFormatting option', async () => {
      // Mock specific response for preserveFormatting test
      mockParseDocumentUseCase.execute.mockImplementationOnce(async function* () {
        yield {
          type: 'paragraph',
          id: 'p1',
          position: { page: 1, section: 1, order: 1 },
          content: 'Sample Document Content',
        };
      });

      const buffer = Buffer.from('test content');
      const text = await useCase.extractText(buffer, { preserveFormatting: true });

      expect(text).toBe('Sample Document Content');
      expect(mockParseDocumentUseCase.execute).toHaveBeenCalledWith(
        buffer,
        expect.objectContaining({ preserveFormatting: true, includeImages: false })
      );
    });

    it('should handle errors gracefully', async () => {
      await expect(useCase.extractText(null as any)).rejects.toThrow(DocxParseError);
    });
  });

  describe('extractImages', () => {
    it('should extract images from buffer', async () => {
      const buffer = Buffer.from('test content');
      const images: any[] = [];

      for await (const image of useCase.extractImages(buffer)) {
        images.push(image);
      }

      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({
        type: 'image',
        metadata: {
          format: 'png',
          filename: 'image1.png',
        },
      });
    });

    it('should handle errors gracefully', async () => {
      await expect(async () => {
        for await (const image of useCase.extractImages(null as any)) {
          console.log(image);
        }
      }).rejects.toThrow(DocxParseError);
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from buffer', async () => {
      const buffer = Buffer.from('test content');
      const metadata = await useCase.extractMetadata(buffer);

      expect(metadata).toMatchObject({
        title: 'Sample Document',
        author: 'Unknown',
      });
    });

    it('should return empty metadata when none found', async () => {
      const buffer = Buffer.from('test content');

      // Mock to not yield metadata
      mockParseDocumentUseCase.execute.mockImplementationOnce(async function* () {
        yield {
          type: 'paragraph',
          id: 'p1',
          position: { page: 1, section: 1, order: 1 },
          content: 'Test paragraph',
        };
      });

      const metadata = await useCase.extractMetadata(buffer);
      expect(metadata).toEqual({});
    });

    it('should handle errors gracefully', async () => {
      await expect(useCase.extractMetadata(null as any)).rejects.toThrow(DocxParseError);
    });
  });
});
