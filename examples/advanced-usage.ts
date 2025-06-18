/**
 * Advanced DOCX Parser Usage Examples
 *
 * This file demonstrates advanced usage patterns:
 * - Selective content processing
 * - Image extraction and saving
 * - Streaming for large files
 * - Complex table analysis
 * - Performance optimization
 */

import { parseDocx } from '../src';

async function selectiveProcessingExample() {
  console.log('=== Selective Content Processing ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // const buffer = readFileSync('./document-with-images.docx');
    const buffer = Buffer.from('sample content');

    // Example 1: Only text content (no images, no tables)
    console.log('📝 Text-only processing:');
    for await (const element of parseDocx(buffer, {
      includeImages: false,
      includeTables: false,
      includeMetadata: false,
      normalizeWhitespace: true
    })) {
      if (element.type === 'paragraph') {
        console.log(`   "${element.content}"`);
      }
    }

    // Example 2: Only tables (for data analysis)
    console.log('\n📊 Table-only processing:');
    for await (const element of parseDocx(buffer, {
      includeImages: false,
      includeTables: true,
      includeMetadata: false
    })) {
      if (element.type === 'table') {
        console.log(`   Table with ${(element.content as any[]).length} rows`);
        // Process table data here
      }
    }

  } catch (error) {
    console.error('❌ Error in selective processing:', error);
  }
}

async function imageExtractionExample() {
  console.log('\n=== Image Extraction and Saving ===');

  try {
    console.log('🖼️  Extracting images...');

    const imageCount = 0;
    // Note: To extract images, uncomment the following code:
    // import { readFileSync, writeFileSync } from 'fs';
    // import { extractImages } from '../src';
    // const buffer = readFileSync('./document-with-images.docx');
    // for await (const image of extractImages(buffer)) {
    //   imageCount++;
    //   const filename = image.metadata?.filename || `extracted_image_${imageCount}.${image.metadata?.format}`;
    //
    //   console.log(`   Found image: ${filename}`);
    //   console.log(`   Format: ${image.metadata?.format}`);
    //   console.log(`   Size: ${image.content.length} bytes`);
    //
    //   // Save image to file
    //   writeFileSync(`./output/${filename}`, image.content);
    //   console.log(`   ✅ Saved as: ./output/${filename}`);
    // }

    console.log(`💡 To extract images, uncomment the code above and provide a DOCX file with images`);
    console.log(`   Total images found: ${imageCount}`);

  } catch (error) {
    console.error('❌ Error in image extraction:', error);
  }
}

async function streamingExample() {
  console.log('\n=== Streaming for Large Files ===');

  try {
    console.log('🚀 Streaming configuration:');
    console.log('   Chunk size: 128KB');
    console.log('   Concurrent processing: enabled');
    console.log('   Images: disabled for performance');

    // Note: To use streaming, uncomment the following code:
    // import { parseDocxFile } from '../src';
    // const streamingOptions = {
    //   chunkSize: 128 * 1024,      // 128KB chunks
    //   concurrent: true,           // Parallel processing
    //   includeImages: false,       // Skip images for performance
    //   normalizeWhitespace: true   // Clean up text
    // };
    // for await (const element of parseDocxFile('./large-document.docx', streamingOptions)) {
    //   // Process element immediately to avoid memory buildup
    //   await processElementImmediately(element);
    // }

    console.log('💡 Use this pattern for documents > 10MB');

  } catch (error) {
    console.error('❌ Error in streaming:', error);
  }
}

async function complexTableAnalysisExample() {
  console.log('\n=== Complex Table Analysis ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // const buffer = readFileSync('./document-with-tables.docx');
    const buffer = Buffer.from('sample content');

    console.log('📊 Analyzing tables...');

    const tableStats = {
      totalTables: 0,
      totalRows: 0,
      totalCells: 0,
      largestTable: 0
    };

    for await (const element of parseDocx(buffer, {
      includeImages: false,
      includeTables: true,
      includeMetadata: false
    })) {
      if (element.type === 'table') {
        const table = element.content as any[];
        const rowCount = table.length;
        const cellCount = table.reduce((sum, row) => sum + row.cells.length, 0);

        tableStats.totalTables++;
        tableStats.totalRows += rowCount;
        tableStats.totalCells += cellCount;
        tableStats.largestTable = Math.max(tableStats.largestTable, rowCount);

        console.log(`   Table ${tableStats.totalTables}:`);
        console.log(`     Rows: ${rowCount}`);
        console.log(`     Cells: ${cellCount}`);

        // Example: Extract data from first row (headers)
        if (table.length > 0) {
          const headers = table[0].cells.map((cell: any) => cell.content);
          console.log(`     Headers: ${headers.join(' | ')}`);
        }
      }
    }

    console.log('\n📈 Table Statistics:');
    console.log(`   Total tables: ${tableStats.totalTables}`);
    console.log(`   Total rows: ${tableStats.totalRows}`);
    console.log(`   Total cells: ${tableStats.totalCells}`);
    console.log(`   Largest table: ${tableStats.largestTable} rows`);

  } catch (error) {
    console.error('❌ Error in table analysis:', error);
  }
}

async function performanceOptimizationExample() {
  console.log('\n=== Performance Optimization ===');

  try {
    console.log('⚡ Performance-optimized configuration:');
    console.log('   - Metadata: disabled');
    console.log('   - Images: disabled');
    console.log('   - Formatting: disabled');
    console.log('   - Chunk size: 256KB');
    console.log('   - Concurrent: enabled');

    const startTime = Date.now();

    // Note: To test performance, uncomment the following code:
    // const fastOptions = {
    //   includeMetadata: false,     // Skip metadata parsing
    //   includeImages: false,       // Skip image processing
    //   includeTables: true,        // Keep tables (needed for analysis)
    //   includeHeaders: false,      // Skip headers/footers
    //   includeFooters: false,
    //   preserveFormatting: false,  // Skip formatting parsing
    //   normalizeWhitespace: true,  // Clean text
    //   chunkSize: 256 * 1024,      // Large chunks
    //   concurrent: true            // Parallel processing
    // };
    // let elementCount = 0;
    // for await (const element of parseDocx(buffer, fastOptions)) {
    //   elementCount++;
    //   // Minimal processing for speed
    // }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Processing completed in ${duration}ms`);
    console.log('💡 Use these settings when you only need text content');

  } catch (error) {
    console.error('❌ Error in performance optimization:', error);
  }
}

async function main() {
  console.log('🚀 DOCX Parser - Advanced Usage Examples\n');

  await selectiveProcessingExample();
  await imageExtractionExample();
  await streamingExample();
  await complexTableAnalysisExample();
  await performanceOptimizationExample();

  console.log('\n✅ All advanced examples completed!');
  console.log('\n💡 Advanced Tips:');
  console.log('   - Use selective processing to improve performance');
  console.log('   - Stream large files to avoid memory issues');
  console.log('   - Disable features you don\'t need (images, formatting, etc.)');
  console.log('   - Process elements immediately in streaming mode');
  console.log('   - Adjust chunk sizes based on your system\'s memory');
}

// Run examples
main().catch(console.error);
