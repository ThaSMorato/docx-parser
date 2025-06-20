import { readFileSync } from 'fs';
import { PassThrough, Readable, Transform } from 'stream';

import { parseDocxReadable } from '../src';

/**
 * Example demonstrating parseDocxReadable with different types of Node.js Readable streams
 */
async function demonstrateReadableStreams() {
  console.log('🚀 parseDocxReadable - Node.js Readable Stream Examples\n');

  const buffer = readFileSync('./tests/e2e/text-only.docx');

  // 1. Basic Readable stream
  console.log('1. 📦 Basic Readable Stream:');
  const basicStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null); // End stream
    }
  });

  let count = 0;
  for await (const element of parseDocxReadable(basicStream)) {
    if (element.type === 'paragraph') {
      console.log(`   Paragraph ${++count}: ${element.content.substring(0, 60)}...`);
    }
  }

  // 2. Chunked Readable stream (simulates network/file reading)
  console.log('\n2. 🌊 Chunked Readable Stream:');
  let position = 0;
  const chunkSize = 512; // Small chunks to simulate real-world streaming

  const chunkedStream = new Readable({
    read() {
      if (position >= buffer.length) {
        this.push(null);
        return;
      }

      const chunk = buffer.subarray(position, Math.min(position + chunkSize, buffer.length));
      position += chunk.length;
      console.log(`   📥 Reading chunk: ${chunk.length} bytes (${position}/${buffer.length})`);
      this.push(chunk);
    }
  });

  count = 0;
  for await (const element of parseDocxReadable(chunkedStream)) {
    if (element.type === 'paragraph') {
      console.log(`   📄 Paragraph ${++count}: ${element.content.substring(0, 60)}...`);
    }
  }

  // 3. Transform stream pipeline
  console.log('\n3. 🔄 Transform Stream Pipeline:');
  const sourceStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    }
  });

  // Transform that adds logging
  const loggingTransform = new Transform({
    transform(chunk, encoding, callback) {
      console.log(`   🔍 Transform processing: ${chunk.length} bytes`);
      // Pass through unchanged
      callback(null, chunk);
    }
  });

  // Create pipeline
  const transformedStream = sourceStream.pipe(loggingTransform);

  count = 0;
  for await (const element of parseDocxReadable(transformedStream)) {
    if (element.type === 'paragraph') {
      console.log(`   📝 Transformed paragraph ${++count}: ${element.content.substring(0, 60)}...`);
    }
  }

  // 4. PassThrough stream (useful for middleware)
  console.log('\n4. 🚇 PassThrough Stream:');
  const passThroughStream = new PassThrough();

  // Write data to PassThrough
  passThroughStream.write(buffer);
  passThroughStream.end();

  count = 0;
  for await (const element of parseDocxReadable(passThroughStream)) {
    if (element.type === 'paragraph') {
      console.log(`   ➡️ PassThrough paragraph ${++count}: ${element.content.substring(0, 60)}...`);
    }
  }

  // 5. Custom stream with async data generation
  console.log('\n5. ⚡ Async Data Generation Stream:');
  class AsyncDataStream extends Readable {
    private sent = false;

    _read() {
      if (!this.sent) {
        // Simulate async data loading
        process.nextTick(() => {
          console.log('   🔄 Async loading complete');
          this.push(buffer);
          this.push(null);
        });
        this.sent = true;
      }
    }
  }

  const asyncStream = new AsyncDataStream();
  count = 0;
  for await (const element of parseDocxReadable(asyncStream)) {
    if (element.type === 'paragraph') {
      console.log(`   🚀 Async paragraph ${++count}: ${element.content.substring(0, 60)}...`);
    }
  }

  console.log('\n✅ All parseDocxReadable examples completed successfully!');
}

// Error handling example
async function demonstrateErrorHandling() {
  console.log('\n🚨 Error Handling Example:');

  const errorStream = new Readable({
    read() {
      // Simulate an error after a delay
      process.nextTick(() => {
        this.emit('error', new Error('Simulated stream error'));
      });
    }
  });

  try {
    for await (const element of parseDocxReadable(errorStream)) {
      void element; // Acknowledge we're not using the element
    }
  } catch (error) {
    console.log(`   ❌ Caught error as expected: ${(error as Error).message}`);
  }
}

// Performance comparison
async function performanceComparison() {
  console.log('\n⚡ Performance Comparison:');

  const buffer = readFileSync('./tests/e2e/text-only.docx');
  const iterations = 3;

  // Test parseDocxReadable
  console.log('   Testing parseDocxReadable performance...');
  const start1 = Date.now();

  for (let i = 0; i < iterations; i++) {
    const stream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });

    let elementCount = 0;
    for await (const element of parseDocxReadable(stream)) {
      void element; // Count elements without using the actual element
      elementCount++;
    }
    console.log(`   Iteration ${i + 1}: ${elementCount} elements`);
  }

  const end1 = Date.now();
  console.log(`   parseDocxReadable: ${end1 - start1}ms (${iterations} iterations)`);
}

// Main execution
async function main() {
  try {
    await demonstrateReadableStreams();
    await demonstrateErrorHandling();
    await performanceComparison();

    console.log('\n🎉 All examples completed successfully!');
    console.log('\n📖 Key takeaways:');
    console.log('   • parseDocxReadable works with any Node.js Readable stream');
    console.log('   • Supports chunked data, transforms, and custom implementations');
    console.log('   • Handles errors gracefully');
    console.log('   • Perfect for HTTP streams, file streams, and custom data sources');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

export { demonstrateReadableStreams, demonstrateErrorHandling, performanceComparison, main };
