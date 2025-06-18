/**
 * Basic DOCX Parser Usage Examples
 *
 * This file demonstrates fundamental usage patterns of the DOCX Parser library:
 * - Incremental parsing with async generators
 * - Text extraction with different options
 * - Metadata extraction
 * - Error handling
 */

import { extractText, getMetadata, parseDocx } from '../src';

async function basicParsingExample() {
  console.log('=== Basic Parsing Example ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // const buffer = readFileSync('./sample-document.docx');

    // For this example, we'll use a mock buffer
    const buffer = Buffer.from('sample content');

    // Parse document incrementally
    for await (const element of parseDocx(buffer)) {
      console.log(`Element Type: ${element.type}`);
      console.log(`Position: Page ${element.position.page}, Order ${element.position.order}`);

      switch (element.type) {
        case 'metadata':
          console.log('📄 Document Metadata:', element.content);
          break;

        case 'paragraph':
          console.log('📝 Text:', element.content);
          if (element.formatting) {
            console.log('   Formatting:', element.formatting);
          }
          break;

        case 'image':
          console.log('🖼️  Image:', {
            filename: (element as any).metadata?.filename,
            format: (element as any).metadata?.format,
            size: `${element.content.length} bytes`
          });
          break;

        case 'table':
          console.log('📊 Table with', (element.content as any[]).length, 'rows');
          break;
      }

      console.log('---');
    }
  } catch (error) {
    console.error('❌ Parsing Error:', error);
  }
}

async function textExtractionExample() {
  console.log('\n=== Text Extraction Example ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // const buffer = readFileSync('./sample-document.docx');
    const buffer = Buffer.from('sample content');

    // Extract text with formatting preserved
    const textWithFormatting = await extractText(buffer, {
      preserveFormatting: true
    });
    console.log('📝 Text with formatting:', textWithFormatting);

    // Extract plain text (normalized)
    const plainText = await extractText(buffer, {
      preserveFormatting: false
    });
    console.log('📄 Plain text:', plainText);

  } catch (error) {
    console.error('❌ Text extraction error:', error);
  }
}

async function metadataExample() {
  console.log('\n=== Metadata Extraction Example ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // const buffer = readFileSync('./sample-document.docx');
    const buffer = Buffer.from('sample content');

    const metadata = await getMetadata(buffer);

    console.log('📋 Document Metadata:');
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && !Buffer.isBuffer(metadata)) {
      const metaObj = metadata as any;
      console.log('   Title:', metaObj.title || 'Not specified');
      console.log('   Author:', metaObj.author || 'Not specified');
      console.log('   Subject:', metaObj.subject || 'Not specified');
      console.log('   Created:', metaObj.created || 'Not specified');
      console.log('   Modified:', metaObj.modified || 'Not specified');
    } else {
      console.log('   No metadata available');
    }

  } catch (error) {
    console.error('❌ Metadata extraction error:', error);
  }
}

async function fileParsingExample() {
  console.log('\n=== File Parsing Example ===');

  try {
    // Note: Uncomment and adjust the path to your DOCX file
    // import { readFileSync } from 'fs';
    // import { parseDocxFile } from '../src';
    // const buffer = readFileSync('./sample-document.docx');
    // for await (const element of parseDocxFile('./sample-document.docx')) {
    //   console.log(`${element.type}: ${element.content}`);
    // }

    console.log('💡 To use this example, uncomment the code above and provide a valid DOCX file path');

  } catch (error) {
    console.error('❌ File parsing error:', error);
  }
}

async function main() {
  console.log('🚀 DOCX Parser - Basic Usage Examples\n');

  await basicParsingExample();
  await textExtractionExample();
  await metadataExample();
  await fileParsingExample();

  console.log('\n✅ All examples completed!');
  console.log('\n💡 Tips:');
  console.log('   - Uncomment the file reading code to test with real DOCX files');
  console.log('   - Adjust file paths to match your test documents');
  console.log('   - Check the advanced-usage.ts file for more complex examples');
}

// Run examples
main().catch(console.error);
