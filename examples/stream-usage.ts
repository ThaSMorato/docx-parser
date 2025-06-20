/**
 * Practical example: Using normal ReadStream with DOCX Parser library
 *
 * This example demonstrates:
 * - How to use Node.js ReadStream (fs.createReadStream)
 * - How to use StreamAdapter for manual conversions
 * - Differences between parseDocxStream and parseDocxWebStream
 */

import { createReadStream, readFileSync } from 'fs';
import { Readable, Transform } from 'stream';

import { parseDocxFile, parseDocxHttpStream, parseDocxReadable, parseDocxStream, parseDocxWebStream } from '../src';
import type { DocumentElement } from '../src/domain/types';
import { StreamAdapter } from '../src/infrastructure/adapters/stream-adapter';

// Example 1: Using normal ReadStream (Node.js)
async function normalReadStreamExample() {
  console.log('=== Example: Normal ReadStream (Node.js) ===');

  // Creates a Node.js ReadStream (fs)
  const fileStream = createReadStream('./example.docx');

  // Uses parseDocxStream which accepts Node.js ReadStream
  console.log('📁 Processing file with normal ReadStream...');

  try {
    for await (const element of parseDocxStream(fileStream)) {
      console.log(`Type: ${element.type}`);

      if (element.type === 'paragraph') {
        console.log(`  Text: ${element.content}`);
      } else if (element.type === 'image') {
        console.log(`  Image: ${element.metadata?.filename || 'unnamed'}`);
      }
    }
  } catch (error) {
    console.log('⚠️ File not found - this is expected in this example');
  }
}

// Example 2: Manual conversion using StreamAdapter
async function manualConversionExample() {
  console.log('\n=== Example: Manual Conversion with StreamAdapter ===');

  const fileStream = createReadStream('./example.docx');

  // Manually converts ReadStream to web ReadableStream
  const webStream = StreamAdapter.toWebStream(fileStream);

  console.log('🔄 Converting ReadStream to web ReadableStream...');

  try {
    // Uses parseDocxWebStream which accepts web ReadableStream
    for await (const element of parseDocxWebStream(webStream)) {
      console.log(`Element: ${element.type}`);
    }
  } catch (error) {
    console.log('⚠️ File not found - this is expected in this example');
  }
}

// Example 3: Comparing both approaches
async function comparisonExample() {
  console.log('\n=== Example: Approach Comparison ===');

  console.log('📋 Method 1 - Direct ReadStream:');
  console.log('const stream = createReadStream("file.docx");');
  console.log('parseDocxStream(stream); // Uses Node.js ReadStream');

  console.log('\n📋 Method 2 - Web ReadableStream:');
  console.log('const nodeStream = createReadStream("file.docx");');
  console.log('const webStream = StreamAdapter.toWebStream(nodeStream);');
  console.log('parseDocxWebStream(webStream); // Uses web ReadableStream');

  console.log('\n💡 Recommendation: Use parseDocxStream for normal ReadStream');
  console.log('   It\'s simpler and more efficient for basic cases');
}

// Example 4: StreamAdapter utilities
async function streamUtilitiesExample() {
  console.log('\n=== Example: StreamAdapter Utilities ===');

  const buffer = Buffer.from('Example content');

  // Converts Buffer to ReadableStream
  const streamFromBuffer = StreamAdapter.fromBuffer(buffer);
  console.log('✅ Buffer converted to ReadableStream');

  // Converts ReadableStream back to Buffer
  const bufferFromStream = await StreamAdapter.toBuffer(streamFromBuffer);
  console.log('✅ ReadableStream converted to Buffer');
  console.log(`📄 Content: ${bufferFromStream.toString()}`);
}

/**
 * Example: Using parseDocxHttpStream with HTTP requests (axios, etc)
 */
async function httpStreamExample() {
  try {
    console.log('\n=== HTTP Stream Example ===');

    // Simulation of how to use with axios
    // import axios from 'axios';
    // const response = await axios({
    //   method: 'get',
    //   url: 'https://example.com/document.docx',
    //   responseType: 'stream'
    // });

    // For this example, we'll simulate an HTTP stream using a local file
    const httpLikeStream = createReadStream('./tests/e2e/text-only.docx');

    console.log('Parsing DOCX from HTTP-like stream...');

    const elements: DocumentElement[] = [];
    for await (const element of parseDocxHttpStream(httpLikeStream)) {
      elements.push(element);
    }

    console.log(`HTTP stream parsing completed: ${elements.length} elements`);

    // Group by type
    const grouped = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Elements by type:', grouped);

  } catch (error) {
    console.error('HTTP stream error:', error);
  }
}

async function demonstrateStreamUsage() {
  console.log('🚀 DOCX Parser - Stream Usage Examples\n');

  // 1. File streams (ReadStream)
  console.log('1. 📁 File ReadStream:');
  const fileStream = createReadStream('./tests/e2e/text-only.docx');
  let count = 0;
  for await (const element of parseDocxStream(fileStream)) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
    }
  }

  // 2. Generic Readable streams
  console.log('\n2. 🔧 Generic Readable Stream:');
  const buffer = readFileSync('./tests/e2e/text-only.docx');
  const readableStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null); // End of stream
    }
  });

  count = 0;
  for await (const element of parseDocxReadable(readableStream)) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
    }
  }

  // 3. Custom Readable with chunked data
  console.log('\n3. 📦 Chunked Readable Stream:');
  let position = 0;
  const chunkSize = 1024;
  const chunkedStream = new Readable({
    read() {
      if (position >= buffer.length) {
        this.push(null);
        return;
      }

      const chunk = buffer.subarray(position, Math.min(position + chunkSize, buffer.length));
      position += chunk.length;
      this.push(chunk);
    }
  });

  count = 0;
  for await (const element of parseDocxReadable(chunkedStream)) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
    }
  }

  // 4. Transform streams
  console.log('\n4. 🔄 Transform Stream Pipeline:');
  const sourceStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      // Could apply transformations here if needed
      console.log(`   Processing chunk of ${chunk.length} bytes`);
      callback(null, chunk);
    }
  });

  // Create pipeline: source → transform → parseDocxReadable
  const transformedStream = sourceStream.pipe(transformStream);

  count = 0;
  for await (const element of parseDocxReadable(transformedStream)) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
    }
  }

  // 5. File parsing (convenience method)
  console.log('\n5. 📄 File Path Parsing:');
  count = 0;
  for await (const element of parseDocxFile('./tests/e2e/text-only.docx')) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
    }
  }

  console.log('\n✅ All stream examples completed successfully!');
}

// HTTP Request Example (commented out as it requires network)
async function httpExample() {
  console.log('\n6. 🌐 HTTP Stream Example (axios):');

  /*
  // Uncomment to test with real HTTP requests
  const axios = require('axios');

  try {
    const response = await axios({
      method: 'get',
      url: 'https://example.com/document.docx',
      responseType: 'stream'
    });

    let count = 0;
    for await (const element of parseDocxHttpStream(response.data)) {
      if (element.type === 'paragraph') {
        console.log(`   HTTP Paragraph ${++count}: ${element.content.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    console.log('   HTTP request failed:', error.message);
  }
  */

  console.log('   (HTTP example commented out - uncomment to test with real URLs)');
}

// Execute all examples
async function executeExamples() {
  console.log('🚀 Demonstration: ReadStream vs ReadableStream\n');

  await normalReadStreamExample();
  await manualConversionExample();
  await comparisonExample();
  await streamUtilitiesExample();
  await httpStreamExample();

  console.log('\n✨ Conclusion:');
  console.log('- Use parseDocxStream() for Node.js ReadStream (simpler)');
  console.log('- Use parseDocxWebStream() for web ReadableStream');
  console.log('- Use StreamAdapter for manual conversions when needed');
}

// Execute only if called directly (Node.js ESM)
if (import.meta.url === `file://${process.argv[1]}`) {
  executeExamples().catch(console.error);
}

export {
  normalReadStreamExample,
  manualConversionExample,
  comparisonExample,
  streamUtilitiesExample,
  httpStreamExample,
  demonstrateStreamUsage,
  httpExample,
};
