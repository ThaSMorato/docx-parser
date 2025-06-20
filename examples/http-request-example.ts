import type { Readable } from 'node:stream';

import axios from 'axios';

import { parseDocxHttpStream, parseDocxToArray } from '../src';
import type { DocumentElement } from '../src/domain/types';

/**
 * Practical example: How to use the library with HTTP requests
 */

// Example 1: Using parseDocxHttpStream with generator
async function parseDocxFromUrl(url: string) {
  try {
    console.log(`Downloading from: ${url}`);

    // Making request with axios and responseType: 'stream'
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'  // Important: use 'stream' not 'buffer'
    });

    console.log('Processing DOCX document...');

    // Using the generator to process incrementally
    const elements: DocumentElement[] = [];
    for await (const element of parseDocxHttpStream(response.data)) {
      elements.push(element);

      // Process each element as needed
      if (element.type === 'paragraph') {
        console.log(`Paragraph: ${element.content}`);
      } else if (element.type === 'image') {
        console.log(`Image found: ${(element as any).metadata?.filename}`);
      }
    }

    console.log(`Processing completed: ${elements.length} elements`);
    return elements;

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Example 2: Using parseDocxToArray to get all elements at once
async function parseDocxToArrayFromUrl(url: string) {
  try {
    console.log(`Downloading from: ${url}`);

    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });

    console.log('Converting to array...');

    // Using parseDocxToArray which now supports Node.js streams automatically
    const elements = await parseDocxToArray(response.data, {
      includeImages: true,
      includeTables: true
    });

    console.log(`Array generated: ${elements.length} elements`);

    // Group by type
    const grouped = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Elements by type:', grouped);
    return elements;

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Example 3: Automatic handling of different stream types
async function parseFromAnySource(source: string | Buffer | Readable) {
  try {
    if (typeof source === 'string') {
      // It's a URL
      const response = await axios({
        method: 'get',
        url: source,
        responseType: 'stream'
      });

      // parseDocxToArray automatically detects the stream type
      return await parseDocxToArray(response.data);

    } else {
      // It's a Buffer or Stream
      return await parseDocxToArray(source);
    }

  } catch (error) {
    console.error('Error processing source:', error);
    throw error;
  }
}

// Usage demonstration
async function demonstrateUsage() {
  try {
    console.log('=== Configured usage examples ===');
    console.log('1. parseDocxFromUrl(url) - Generator-based parsing');
    console.log('2. parseDocxToArrayFromUrl(url) - Array conversion');
    console.log('3. parseFromAnySource(source) - Automatic source');

    console.log('\n✅ All examples have been configured correctly!');
    console.log('To use, call the functions with your real URLs.');

  } catch (error) {
    console.error('Error in demonstration:', error);
  }
}

// Execute demonstration
demonstrateUsage();

export {
  parseDocxFromUrl,
  parseDocxToArrayFromUrl,
  parseFromAnySource
};
