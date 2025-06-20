import { readFileSync } from 'fs';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { parseDocxHttpStream, parseDocxToArray } from '../../../src';
import type { DocumentElement } from '../../../src/domain/types';
import { StreamAdapter } from '../../../src/infrastructure/adapters/stream-adapter';

describe('HTTP Stream Support', () => {
  // Helper to create a Node.js Readable stream from buffer (simulates HTTP response)
  function createHttpLikeStream(buffer: Buffer): Readable {
    let position = 0;
    const chunkSize = 1024; // 1KB chunks to simulate network

    return new Readable({
      read() {
        if (position >= buffer.length) {
          this.push(null); // End of stream
          return;
        }

        const chunk = buffer.subarray(position, Math.min(position + chunkSize, buffer.length));
        position += chunk.length;
        this.push(chunk);
      }
    });
  }

  describe('parseDocxHttpStream', () => {
    it('should parse DOCX from Node.js Readable stream (HTTP-like)', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');
      const httpStream = createHttpLikeStream(buffer);

      const elements: DocumentElement[] = [];
      for await (const element of parseDocxHttpStream(httpStream)) {
        elements.push(element);
      }

      expect(elements.length).toBeGreaterThan(0);
      expect(elements.some(el => el.type === 'metadata')).toBe(true);
      expect(elements.some(el => el.type === 'paragraph')).toBe(true);

      console.log(`parseDocxHttpStream processed ${elements.length} elements`);
    });

    it('should handle stream errors gracefully', async () => {
      const errorStream = new Readable({
        read() {
          // Emit error immediately
          this.emit('error', new Error('Network error'));
        }
      });

      await expect(async () => {
        for await (const element of parseDocxHttpStream(errorStream)) {
          console.log(element);
        }
      }).rejects.toThrow('Network error');
    });
  });

  describe('parseDocxToArray with HTTP streams', () => {
    it('should auto-detect Node.js Readable stream and convert', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');
      const httpStream = createHttpLikeStream(buffer);

      // parseDocxToArray should automatically detect it's a Node.js stream
      const elements = await parseDocxToArray(httpStream);

      expect(elements.length).toBeGreaterThan(0);
      expect(elements.some(el => el.type === 'metadata')).toBe(true);
      expect(elements.some(el => el.type === 'paragraph')).toBe(true);

      console.log(`Auto-detection processed ${elements.length} elements`);
    });
  });

  describe('StreamAdapter Node.js stream support', () => {
    it('should detect Node.js Readable stream correctly', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');
      const nodeStream = createHttpLikeStream(buffer);

      // Test the detection logic through public API
      const convertedBuffer = await StreamAdapter.toBuffer(nodeStream);

      expect(Buffer.isBuffer(convertedBuffer)).toBe(true);
      expect(convertedBuffer.length).toBe(buffer.length);
      expect(convertedBuffer.equals(buffer)).toBe(true);

      console.log(`Node.js stream converted: ${convertedBuffer.length} bytes`);
    });

    it('should convert Node.js stream to Web stream', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');
      const nodeStream = createHttpLikeStream(buffer);

      const webStream = StreamAdapter.nodeToWebStream(nodeStream);

      // Verify it's a proper Web ReadableStream
      expect(typeof webStream.getReader).toBe('function');

      const convertedBuffer = await StreamAdapter.toBuffer(webStream);
      expect(convertedBuffer.equals(buffer)).toBe(true);

      console.log(`Node → Web stream conversion: ${convertedBuffer.length} bytes`);
    });
  });

  describe('HTTP-like scenarios', () => {
    it('should simulate axios responseType: stream', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');

      // Simulate axios response.data when responseType: 'stream'
      const axiosLikeStream = createHttpLikeStream(buffer);

      // This is exactly how it would be used with axios
      const elements: DocumentElement[] = [];
      for await (const element of parseDocxHttpStream(axiosLikeStream)) {
        elements.push(element);
      }

      expect(elements.length).toBeGreaterThan(0);

      // Verify content structure
      const metadata = elements.find(el => el.type === 'metadata');
      const paragraphs = elements.filter(el => el.type === 'paragraph');

      expect(metadata).toBeDefined();
      expect(paragraphs.length).toBeGreaterThan(0);

      console.log(`Axios simulation: ${elements.length} elements (${paragraphs.length} paragraphs)`);
    });

    it('should preserve content integrity through HTTP stream', async () => {
      const buffer = readFileSync('./tests/e2e/text-only.docx');

      // Parse directly from buffer
      const directElements = await parseDocxToArray(buffer);

      // Parse through HTTP-like stream
      const httpStream = createHttpLikeStream(buffer);
      const streamElements = await parseDocxToArray(httpStream);

      // Content should be identical
      expect(streamElements.length).toBe(directElements.length);

      // Compare element types
      const directTypes = directElements.map(el => el.type);
      const streamTypes = streamElements.map(el => el.type);
      expect(streamTypes).toEqual(directTypes);

      console.log('Content integrity preserved through HTTP stream');
    });
  });
});
