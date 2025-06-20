import { readFileSync } from 'fs';

import { describe, expect, it } from 'vitest';

import { extractImages } from '../../src';
import type { DocumentElement } from '../../src/domain/types';

describe('E2E: extractImages with no images', () => {
  // Use a file we know has no images (text-only)
  const TEXT_ONLY_DOCX = './tests/e2e/text-only.docx';

  it('should handle documents without images gracefully', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);
    const images: DocumentElement[] = [];

    // Test iteration over the result
    try {
      for await (const image of extractImages(buffer)) {
        images.push(image);
        console.log(`Found image: ${image.type}`);
      }

      // Should complete without error, even without images
      expect(images).toHaveLength(0);
      console.log(`✅ Successfully iterated over extractImages result: ${images.length} images found`);
    } catch (error) {
      console.error('❌ Error during iteration:', error);
      throw error;
    }
  });

  it('should return empty generator when no images exist', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);

    // Verify that the generator works even when empty
    const generator = extractImages(buffer);

    // Test first next()
    const firstResult = await generator.next();
    expect(firstResult.done).toBe(true);
    expect(firstResult.value).toBeUndefined();

    console.log('✅ Generator correctly indicates completion when no images exist');
  });

  it('should work with async iteration patterns', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);
    let iterationCount = 0;

    // Test different iteration patterns
    for await (const image of extractImages(buffer)) {
      iterationCount++;
      expect(image.type).toBe('image'); // Should never execute
    }

    expect(iterationCount).toBe(0);
    console.log('✅ Async iteration completed successfully with 0 iterations');
  });

  it('should work with manual iteration', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);
    const generator = extractImages(buffer);
    const results: DocumentElement[] = [];

    // Manual iteration
    let done = false;
    while (!done) {
      const result = await generator.next();
      done = result.done ?? false;

      if (!done && result.value) {
        results.push(result.value);
      }
    }

    expect(results).toHaveLength(0);
    console.log('✅ Manual iteration completed successfully');
  });

  it('should work with Array.from conversion', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);

    // Convert generator to array
    const imagesArray: DocumentElement[] = [];
    for await (const image of extractImages(buffer)) {
      imagesArray.push(image);
    }

    expect(Array.isArray(imagesArray)).toBe(true);
    expect(imagesArray).toHaveLength(0);
    console.log('✅ Array conversion completed successfully');
  });

  it('should handle ReadStream input without images', async () => {
    const { createReadStream } = await import('fs');
    const stream = createReadStream(TEXT_ONLY_DOCX);
    const images: DocumentElement[] = [];

    try {
      const imgInterator = extractImages(stream)
      for await (const image of imgInterator) {
        images.push(image);
      }

      expect(images).toHaveLength(0);
      console.log('✅ ReadStream input handled successfully');
    } catch (error) {
      console.error('❌ Error with ReadStream:', error);
      throw error;
    }
  });

  it('should not throw errors during empty iteration', async () => {
    const buffer = readFileSync(TEXT_ONLY_DOCX);

    // Multiple iterations to ensure stability
    for (let i = 0; i < 3; i++) {
      const images: DocumentElement[] = [];

      for await (const image of extractImages(buffer)) {
        images.push(image);
      }

      expect(images).toHaveLength(0);
    }

    console.log('✅ Multiple iterations completed without errors');
  });
});
