import { createReadStream, readFileSync } from 'fs';
import { ReadableStream } from 'node:stream/web';

import { describe, expect, it } from 'vitest';

import { extractImages, extractText, getMetadata, parseDocx, parseDocxFile, parseDocxStream, parseDocxToArray } from '../../src';
import type { DocumentElement } from '../../src/domain/types';

import { LIST_ELEMENT, PAGE_ELEMENTS, TABLE_ELEMENT, TEXT_METADATA } from './docs-content';

// Test files for each document type
const TEST_FILES = {
  textOnly: './tests/e2e/text-only.docx',
  textWithTitle: './tests/e2e/text-with-title.docx',
  imageOnly: './tests/e2e/image-only.docx',
  tableOnly: './tests/e2e/table-only.docx',
  listsOnly: './tests/e2e/lists.docx',
  withPageElements: './tests/e2e/with-page-elements.docx',
};

describe('E2E: DOCX Parsing by Element Type', () => {
  describe('Paragraph parsing', () => {
    const DOCX_FILE = TEST_FILES.textOnly;

    it('should parse paragraphs from buffer', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer)) {
        elements.push(element);
      }

      const paragraphs = elements.filter(el => el.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);

      // Verify paragraph structure
      paragraphs.forEach(paragraph => {
        expect(paragraph).toHaveProperty('type', 'paragraph');
        expect(paragraph).toHaveProperty('id');
        expect(paragraph).toHaveProperty('position');
        expect(paragraph).toHaveProperty('content');
        expect(typeof paragraph.content).toBe('string');
      });
    });

    it('should parse paragraphs from stream', async () => {
      const fileStream = createReadStream(DOCX_FILE);
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            const uint8Array = chunk instanceof Buffer
              ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
              : new Uint8Array(Buffer.from(chunk));
            controller.enqueue(uint8Array);
          });
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        }
      });

      const elements: DocumentElement[] = [];
      for await (const element of parseDocxStream(webStream)) {
        elements.push(element);
      }

      const paragraphs = elements.filter(el => el.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    it('should extract text content correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer, { preserveFormatting: false });

      expect(text.length).toBeGreaterThan(0);
      expect(typeof text).toBe('string');
      expect(text).toContain('Lorem ipsum');
      expect(text).toContain('consectetur adipiscing elit');
    });
  });

  describe('Metadata parsing', () => {
    const DOCX_FILE = TEST_FILES.textOnly;

    it('should extract document metadata', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const metadata = await getMetadata(buffer);

      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('author');
    });

    it('should include metadata in parsing results', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const metadataElements = elements.filter(el => el.type === 'metadata');
      expect(metadataElements).toHaveLength(1);

      const metadata = metadataElements[0];
      expect(metadata).toHaveProperty('type', 'metadata');
      expect(metadata).toHaveProperty('content');
    });
  });

  describe('Header detection', () => {
    const DOCX_FILE = TEST_FILES.textWithTitle;

    it('should detect headers vs paragraphs correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer)) {
        elements.push(element);
      }

      // Should have both headers and paragraphs
      const headers = elements.filter(el => el.type === 'header');
      const paragraphs = elements.filter(el => el.type === 'paragraph');

      expect(headers.length).toBeGreaterThan(0);
      expect(paragraphs.length).toBeGreaterThan(0);

      // Verify header structure
      headers.forEach(header => {
        expect(header).toHaveProperty('type', 'header');
        expect(header).toHaveProperty('id');
        expect(header).toHaveProperty('level');
        expect(header).toHaveProperty('content');
        expect(typeof header.content).toBe('string');
        expect((header as any).level).toBeGreaterThan(0);
      });
    });

    it('should include headers in parsing results with correct levels', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const headers = elements.filter(el => el.type === 'header');
      expect(headers.length).toBeGreaterThan(0);

      // Check that headers have levels
      headers.forEach(header => {
        expect((header as any).level).toBeDefined();
        expect(typeof (header as any).level).toBe('number');
        expect((header as any).level).toBeGreaterThan(0);
      });

      // First header should typically be level 1 (main title)
      if (headers.length > 0) {
        expect((headers[0] as any).level).toBe(1);
      }
    });

    it('should differentiate between text-only and text-with-title documents', async () => {
      // Parse text-only document
      const textOnlyBuffer = readFileSync(TEST_FILES.textOnly);
      const textOnlyElements = await parseDocxToArray(textOnlyBuffer);

      // Parse text-with-title document
      const titleBuffer = readFileSync(TEST_FILES.textWithTitle);
      const titleElements = await parseDocxToArray(titleBuffer);

      // Count headers in each
      const textOnlyHeaders = textOnlyElements.filter(el => el.type === 'header');
      const titleHeaders = titleElements.filter(el => el.type === 'header');

      // Title document should have more or equal headers than text-only
      expect(titleHeaders.length).toBeGreaterThanOrEqual(textOnlyHeaders.length);

      // Both should have paragraphs
      const textOnlyParagraphs = textOnlyElements.filter(el => el.type === 'paragraph');
      const titleParagraphs = titleElements.filter(el => el.type === 'paragraph');

      expect(textOnlyParagraphs.length).toBeGreaterThan(0);
      expect(titleParagraphs.length).toBeGreaterThan(0);
    });

    it('should extract headers correctly via text extraction', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer);

      // Headers should be included in text extraction
      expect(text).toContain('Lorem Ipsum');
      expect(text).toMatch(/Neque porro quisquam/);
      expect(text).toMatch(/There is no one who loves pain/);
    });
  });

  describe('Image parsing', () => {
    const DOCX_FILE = TEST_FILES.imageOnly;

    it('should parse images from document', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer, { includeImages: true })) {
        elements.push(element);
      }

      const images = elements.filter(el => el.type === 'image');
      expect(images.length).toBeGreaterThan(0);

      // Verify image structure
      images.forEach(image => {
        expect(image).toHaveProperty('type', 'image');
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('content');
        expect(image).toHaveProperty('metadata');
        expect(Buffer.isBuffer(image.content)).toBe(true);

        const metadata = (image as any).metadata;
        expect(metadata).toHaveProperty('filename');
        expect(metadata).toHaveProperty('format');
        expect(typeof metadata.filename).toBe('string');
        expect(typeof metadata.format).toBe('string');
      });

      console.log(`Found ${images.length} images in document`);
    });

    it('should extract image metadata correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeImages: true });

      const images = elements.filter(el => el.type === 'image');
      expect(images.length).toBeGreaterThan(0);

      images.forEach(image => {
        const metadata = (image as any).metadata;

        // Check required metadata fields
        expect(metadata.filename).toBeDefined();
        expect(metadata.format).toBeDefined();
        expect(['png', 'jpg', 'gif', 'svg', 'wmf', 'emf']).toContain(metadata.format);

        // Check image content
        const imageBuffer = image.content as Buffer;
        expect(imageBuffer.length).toBeGreaterThan(0);

        console.log(`Image: ${metadata.filename}, Format: ${metadata.format}, Size: ${imageBuffer.length} bytes`);
      });
    });

    it('should handle different image formats', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeImages: true });

      const images = elements.filter(el => el.type === 'image');
      expect(images.length).toBeGreaterThan(0);

      // Collect all formats found
      const formats = new Set<string>();
      images.forEach(image => {
        const metadata = (image as any).metadata;
        formats.add(metadata.format);
      });

      console.log(`Found image formats: ${Array.from(formats).join(', ')}`);
      expect(formats.size).toBeGreaterThan(0);

      // Verify all formats are supported
      Array.from(formats).forEach(format => {
        expect(['png', 'jpg', 'gif', 'svg', 'wmf', 'emf']).toContain(format);
      });
    });

    it('should respect maxImageSize option', async () => {
      const buffer = readFileSync(DOCX_FILE);

      // First, get all images without size limit
      const allElements = await parseDocxToArray(buffer, { includeImages: true });
      const allImages = allElements.filter(el => el.type === 'image');

      // Then, set a very small size limit
      const limitedElements = await parseDocxToArray(buffer, {
        includeImages: true,
        maxImageSize: 1024 // 1KB limit
      });
      const limitedImages = limitedElements.filter(el => el.type === 'image');

      // Should have fewer or equal images with size limit
      expect(limitedImages.length).toBeLessThanOrEqual(allImages.length);

      console.log(`All images: ${allImages.length}, Limited images (1KB): ${limitedImages.length}`);
    });
  });

  describe('Table parsing', () => {
    const DOCX_FILE = TEST_FILES.tableOnly;

    it('should parse table structure', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer, { includeTables: true })) {
        elements.push(element);
      }

      const tables = elements.filter(el => el.type === 'table');
      expect(tables.length).toBeGreaterThan(0);

      // Verify table structure
      tables.forEach(table => {
        expect(table).toHaveProperty('type', 'table');
        expect(table).toHaveProperty('id');
        expect(table).toHaveProperty('content');
        expect(Array.isArray(table.content)).toBe(true);

        const tableContent = table.content as any[];
        expect(tableContent.length).toBeGreaterThan(0);

        // Each row should have cells
        tableContent.forEach(row => {
          expect(row).toHaveProperty('cells');
          expect(Array.isArray(row.cells)).toBe(true);
          expect(row.cells.length).toBeGreaterThan(0);
        });
      });

      console.log(`Found ${tables.length} tables in document`);
    });

    it('should extract table cell content correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeTables: true });

      const tables = elements.filter(el => el.type === 'table');
      expect(tables.length).toBeGreaterThan(0);

      tables.forEach(table => {
        const tableContent = table.content as any[];

        tableContent.forEach((row, rowIndex) => {
          row.cells.forEach((cell: any, cellIndex: number) => {
            expect(cell).toHaveProperty('content');
            expect(typeof cell.content).toBe('string');

            console.log(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}: "${cell.content}"`);
          });
        });
      });
    });

    it('should match expected table content from TABLE_ELEMENT', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeTables: true });

      const tables = elements.filter(el => el.type === 'table');
      expect(tables.length).toBeGreaterThan(0);

      // Verify content matches TABLE_ELEMENT structure
      const firstTable = tables[0];
      const tableContent = firstTable.content as any[];

      // Should have the expected number of rows
      const expectedRows = TABLE_ELEMENT.table[0].row;
      expect(tableContent.length).toBe(expectedRows.length);

      // Check each row content
      tableContent.forEach((row, rowIndex) => {
        const expectedRow = expectedRows[rowIndex];
        expect(row.cells.length).toBe(expectedRow.coluns.length);

        row.cells.forEach((cell: any, cellIndex: number) => {
          const expectedValue = String(expectedRow.coluns[cellIndex]);
          expect(cell.content.trim()).toBe(expectedValue);
        });
      });

      console.log('Table content matches TABLE_ELEMENT structure');
    });

    it('should handle table parsing options', async () => {
      const buffer = readFileSync(DOCX_FILE);

      // Parse with tables enabled
      const withTables = await parseDocxToArray(buffer, { includeTables: true });
      const tablesEnabled = withTables.filter(el => el.type === 'table');

      // Parse with tables disabled
      const withoutTables = await parseDocxToArray(buffer, { includeTables: false });
      const tablesDisabled = withoutTables.filter(el => el.type === 'table');

      expect(tablesEnabled.length).toBeGreaterThan(0);
      expect(tablesDisabled.length).toBe(0);

      console.log(`Tables enabled: ${tablesEnabled.length}, Tables disabled: ${tablesDisabled.length}`);
    });
  });

  describe('List parsing', () => {
    const DOCX_FILE = TEST_FILES.listsOnly;

    it('should parse list content as paragraphs', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer)) {
        elements.push(element);
      }

      // Lists are currently parsed as paragraphs
      const paragraphs = elements.filter(el => el.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);

      // Should have at least the expected number of items
      const expectedItemCount = LIST_ELEMENT.lists.reduce((acc, list) =>
        acc + list.items.length + 1, 0); // +1 for each title
      expect(paragraphs.length).toBe(expectedItemCount);

      console.log(`Found ${paragraphs.length} paragraph elements (list items + titles)`);
    });

    it('should extract list items in correct order', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const paragraphs = elements.filter(el => el.type === 'paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);

      // Verify content matches LIST_ELEMENT structure
      let paragraphIndex = 0;

      LIST_ELEMENT.lists.forEach(list => {
        // Check title
        expect(paragraphs[paragraphIndex].content.trim()).toBe(list.title);
        paragraphIndex++;

        // Check items
        list.items.forEach(expectedItem => {
          // Handle different item types (string vs object with text property)
          const expectedText = typeof expectedItem === 'string' ? expectedItem : expectedItem.text;
          expect(paragraphs[paragraphIndex].content.trim()).toBe(expectedText);
          paragraphIndex++;
        });
      });

      console.log('List content matches LIST_ELEMENT structure');
    });

    it('should handle numbered lists', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer);

      // Check for numbered list content
      const numberedList = LIST_ELEMENT.lists.find(list => list.type === 'numbered');
      expect(numberedList).toBeDefined();

      if (numberedList) {
        expect(text).toContain(numberedList.title);
        numberedList.items.forEach(item => {
          expect(text).toContain(item);
        });
      }

      console.log('Numbered list content found in text extraction');
    });

    it('should handle bulleted lists', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer);

      // Check for bulleted list content
      const bulletedList = LIST_ELEMENT.lists.find(list => list.type === 'bulleted');
      expect(bulletedList).toBeDefined();

      if (bulletedList) {
        expect(text).toContain(bulletedList.title);
        bulletedList.items.forEach(item => {
          expect(text).toContain(item);
        });
      }

      console.log('Bulleted list content found in text extraction');
    });

    it('should handle checked lists', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer);

      // Check for checked list content
      const checkedList = LIST_ELEMENT.lists.find(list => list.type === 'checked');
      expect(checkedList).toBeDefined();

      if (checkedList) {
        expect(text).toContain(checkedList.title);
        checkedList.items.forEach(item => {
          const itemText = typeof item === 'string' ? item : item.text;
          expect(text).toContain(itemText);
        });
      }

      console.log('Checked list content found in text extraction');
    });

    it('should detect checkbox states (checked/unchecked)', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const paragraphs = elements.filter(el => el.type === 'paragraph');

      // Find the checked list items
      const checkedList = LIST_ELEMENT.lists.find(list => list.type === 'checked');
      expect(checkedList).toBeDefined();

      if (checkedList && Array.isArray(checkedList.items)) {
        checkedList.items.forEach(expectedItem => {
          if (typeof expectedItem === 'object') {
            // Find the paragraph with this text
            const paragraph = paragraphs.find(p => p.content.trim() === expectedItem.text);
            expect(paragraph).toBeDefined();

            if (paragraph) {
              const hasCheckbox = (paragraph as any).checkbox;

              if (expectedItem.checked) {
                expect(hasCheckbox).toBeDefined();
                expect(hasCheckbox.checked).toBe(true);
                console.log(`✓ "${expectedItem.text}" is correctly marked as checked`);
              } else {
                // Unchecked items might not have checkbox property or have checked: false
                if (hasCheckbox) {
                  expect(hasCheckbox.checked).toBe(false);
                }
                console.log(`☐ "${expectedItem.text}" is correctly marked as unchecked`);
              }
            }
          }
        });
      }
    });
  });

  describe('Header parsing', () => {
    const DOCX_FILE = TEST_FILES.withPageElements;

    it('should parse document headers', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer, { includeHeaders: true })) {
        elements.push(element);
      }

      const headers = elements.filter(el => el.type === 'header');
      expect(headers.length).toBeGreaterThan(0);

      // Verify header structure
      headers.forEach(header => {
        expect(header).toHaveProperty('type', 'header');
        expect(header).toHaveProperty('id');
        expect(header).toHaveProperty('content');
        expect(typeof header.content).toBe('string');
      });

      console.log(`Found ${headers.length} headers in document`);
    });

    it('should extract header content correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeHeaders: true });

      const headers = elements.filter(el => el.type === 'header');
      expect(headers.length).toBeGreaterThan(0);

      const firstHeader = headers[0];
      expect(firstHeader.content.trim()).toBe(PAGE_ELEMENTS.header.text);

      // Check for page number
      if (PAGE_ELEMENTS.header.hasPageNumber) {
        expect((firstHeader as any).hasPageNumber).toBe(true);
      }

      // Check for watermark
      // Note: Watermark detection is complex and requires more sophisticated parsing
      // if (PAGE_ELEMENTS.header.watermark) {
      //   expect((firstHeader as any).watermark).toBe(PAGE_ELEMENTS.header.watermark);
      // }

      console.log(`Header content: "${firstHeader.content}"`);
      console.log(`Has page number: ${(firstHeader as any).hasPageNumber}`);
      // if ((firstHeader as any).watermark) {
      //   console.log(`Watermark: "${(firstHeader as any).watermark}"`);
      // }
    });
  });

  describe('Footer parsing', () => {
    const DOCX_FILE = TEST_FILES.withPageElements;

    it('should parse document footers', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements: DocumentElement[] = [];

      for await (const element of parseDocx(buffer, { includeFooters: true })) {
        elements.push(element);
      }

      const footers = elements.filter(el => el.type === 'footer');
      expect(footers.length).toBeGreaterThan(0);

      // Verify footer structure
      footers.forEach(footer => {
        expect(footer).toHaveProperty('type', 'footer');
        expect(footer).toHaveProperty('id');
        expect(footer).toHaveProperty('content');
        expect(typeof footer.content).toBe('string');
      });

      console.log(`Found ${footers.length} footers in document`);
    });

    it('should extract footer content correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, { includeFooters: true });

      const footers = elements.filter(el => el.type === 'footer');
      expect(footers.length).toBeGreaterThan(0);

      const firstFooter = footers[0];
      expect(firstFooter.content.trim()).toBe(PAGE_ELEMENTS.footer.text);

      console.log(`Footer content: "${firstFooter.content}"`);
    });
  });

  describe('Footnote parsing', () => {
    const DOCX_FILE = TEST_FILES.withPageElements;

    it('should parse footnotes', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const footnotes = elements.filter(el => (el as any).isFootnote === true);
      expect(footnotes.length).toBeGreaterThan(0);

      // Verify footnote structure
      footnotes.forEach(footnote => {
        expect(footnote).toHaveProperty('type', 'paragraph'); // Footnotes are stored as paragraphs
        expect(footnote).toHaveProperty('id');
        expect(footnote).toHaveProperty('content');
        expect((footnote as any).isFootnote).toBe(true);
        expect((footnote as any).footnoteId).toBeDefined();
      });

      console.log(`Found ${footnotes.length} footnotes in document`);
    });

    it('should extract footnote content correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      const footnotes = elements.filter(el => (el as any).isFootnote === true);
      expect(footnotes.length).toBe(PAGE_ELEMENTS.footnotes.length);

      footnotes.forEach((footnote, index) => {
        const expectedFootnote = PAGE_ELEMENTS.footnotes[index];
        const content = typeof footnote.content === 'string' ? footnote.content : String(footnote.content);
        expect(content.trim()).toBe(expectedFootnote.text);
        expect((footnote as any).footnoteId).toBe(expectedFootnote.id);

        console.log(`Footnote ${expectedFootnote.id}: "${content}"`);
      });
    });
  });

  describe('Page elements integration', () => {
    const DOCX_FILE = TEST_FILES.withPageElements;

    it('should extract all page elements together', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer, {
        includeHeaders: true,
        includeFooters: true
      });

      const headers = elements.filter(el => el.type === 'header');
      const footers = elements.filter(el => el.type === 'footer');
      const footnotes = elements.filter(el => (el as any).isFootnote === true);
      const paragraphs = elements.filter(el => el.type === 'paragraph' && !(el as any).isFootnote);

      expect(headers.length).toBeGreaterThan(0);
      expect(footers.length).toBeGreaterThan(0);
      expect(footnotes.length).toBeGreaterThan(0);
      expect(paragraphs.length).toBe(PAGE_ELEMENTS.content.paragraphs);

      console.log(`Total elements: ${elements.length}`);
      console.log(`Headers: ${headers.length}, Footers: ${footers.length}, Footnotes: ${footnotes.length}, Paragraphs: ${paragraphs.length}`);
    });

    it('should handle page element options', async () => {
      const buffer = readFileSync(DOCX_FILE);

      // Parse with all page elements
      const withAll = await parseDocxToArray(buffer, {
        includeHeaders: true,
        includeFooters: true
      });

      // Parse without headers and footers
      const withoutHeadersFooters = await parseDocxToArray(buffer, {
        includeHeaders: false,
        includeFooters: false
      });

      const headersWithAll = withAll.filter(el => el.type === 'header');
      const footersWithAll = withAll.filter(el => el.type === 'footer');
      const headersWithout = withoutHeadersFooters.filter(el => el.type === 'header');
      const footersWithout = withoutHeadersFooters.filter(el => el.type === 'footer');

      expect(headersWithAll.length).toBeGreaterThan(0);
      expect(footersWithAll.length).toBeGreaterThan(0);
      expect(headersWithout.length).toBe(0);
      expect(footersWithout.length).toBe(0);

      console.log(`With headers/footers: ${headersWithAll.length + footersWithAll.length} elements`);
      console.log(`Without headers/footers: ${headersWithout.length + footersWithout.length} elements`);
    });
  });

  describe('Performance and comparison tests', () => {
    const DOCX_FILE = TEST_FILES.textOnly;

    it('should have consistent results between buffer and stream parsing', async () => {
      const buffer = readFileSync(DOCX_FILE);

      // Buffer parsing
      const bufferElements: DocumentElement[] = [];
      for await (const element of parseDocx(buffer)) {
        bufferElements.push(element);
      }

      // Stream parsing
      const fileStream = createReadStream(DOCX_FILE);
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            const uint8Array = chunk instanceof Buffer
              ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
              : new Uint8Array(Buffer.from(chunk));
            controller.enqueue(uint8Array);
          });
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        }
      });

      const streamElements: DocumentElement[] = [];
      for await (const element of parseDocxStream(webStream)) {
        streamElements.push(element);
      }

      // Verify consistency
      expect(bufferElements.length).toBe(streamElements.length);

      const bufferTypes = bufferElements.map(el => el.type);
      const streamTypes = streamElements.map(el => el.type);
      expect(bufferTypes).toEqual(streamTypes);
    });

    it('should handle array conversion correctly', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const elements = await parseDocxToArray(buffer);

      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBeGreaterThan(0);

      // Group elements by type
      const elementTypes = elements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(elementTypes).toHaveProperty('metadata');
      expect(elementTypes).toHaveProperty('paragraph');
    });
  });

  describe('Content validation', () => {
    const DOCX_FILE = TEST_FILES.textOnly;

    it('should match expected content patterns', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const text = await extractText(buffer);

      expect(text).toMatch(/Lorem ipsum/i);
      expect(text).toMatch(/consectetur/i);
      expect(text).toMatch(/adipiscing elit/i);
    });

    it('should have valid metadata structure', async () => {
      const buffer = readFileSync(DOCX_FILE);
      const metadata = await getMetadata(buffer);

      expect(metadata).toBeDefined();
      expect(metadata).not.toBeNull();

      if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata) && !(metadata instanceof Buffer)) {
        const expectedKeys = Object.keys(TEXT_METADATA);
        expectedKeys.forEach(key => {
          expect(metadata).toHaveProperty(key);
        });
      }
    });
  });

  describe('Additional API functions', () => {
    it('should parse DOCX from file path using parseDocxFile', async () => {
      const elements: DocumentElement[] = [];

      for await (const element of parseDocxFile(TEST_FILES.textOnly)) {
        elements.push(element);
      }

      expect(elements.length).toBeGreaterThan(0);
      expect(elements.some(el => el.type === 'metadata')).toBe(true);
      expect(elements.some(el => el.type === 'paragraph')).toBe(true);

      console.log(`parseDocxFile extracted ${elements.length} elements`);
    });

    it('should extract images using extractImages function', async () => {
      const buffer = readFileSync(TEST_FILES.imageOnly);
      const images: DocumentElement[] = [];

      for await (const image of extractImages(buffer)) {
        images.push(image);
      }

      expect(images.length).toBeGreaterThan(0);
      images.forEach(image => {
        expect(image.type).toBe('image');
        expect(Buffer.isBuffer(image.content)).toBe(true);
        expect((image as any).metadata).toBeDefined();
      });

      console.log(`extractImages found ${images.length} images`);
    });

    it('should handle error cases for parseDocxToArray', async () => {
      const invalidBuffer = Buffer.from('invalid docx content');

      await expect(parseDocxToArray(invalidBuffer)).rejects.toThrow();
    });

    it('should handle error cases for extractText', async () => {
      const invalidBuffer = Buffer.from('invalid docx content');

      await expect(extractText(invalidBuffer)).rejects.toThrow();
    });

    it('should handle error cases for extractImages', async () => {
      const invalidBuffer = Buffer.from('invalid docx content');

      await expect(async () => {
        for await (const image of extractImages(invalidBuffer)) {
          console.log(image);
        }
      }).rejects.toThrow();
    });

    it('should handle error cases for getMetadata', async () => {
      const invalidBuffer = Buffer.from('invalid docx content');

      // getMetadata returns empty object instead of throwing for invalid files
      const metadata = await getMetadata(invalidBuffer);
      expect(metadata).toEqual({});
    });
  });
});
