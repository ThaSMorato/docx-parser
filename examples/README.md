# DOCX Parser Examples

This directory contains practical examples of using the DOCX Parser library.

## Files

- **`basic-usage.ts`** - Basic examples with incremental parsing, text extraction, metadata, and error handling
- **`advanced-usage.ts`** - Advanced scenarios including selective processing, image extraction, streaming for large files, complex table analysis

## How to Run

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Compile TypeScript** (if needed):
   ```bash
   npm run build
   ```

3. **Run the examples**:
   ```bash
   # Basic usage
   npx tsx examples/basic-usage.ts

   # Advanced usage
   npx tsx examples/advanced-usage.ts
   ```

## What You'll Learn

### Basic Usage (`basic-usage.ts`)
- How to parse DOCX documents incrementally
- Extract text content with and without formatting
- Get document metadata (title, author, dates)
- Handle parsing errors gracefully
- Use different input sources (Buffer, file path)
- Validate document structure and integrity

### Advanced Usage (`advanced-usage.ts`)
- Selective content processing (only text, only images, etc.)
- Extract and save images from documents
- Stream processing for large files
- Complex table data extraction
- Performance optimization techniques
- Memory-efficient processing
- Checkbox detection and processing
- Footnote extraction and handling
- Header level analysis and structure mapping

## Usage Tips

1. **For large documents**: Use streaming parsing to avoid memory issues
2. **Filter content**: Only include the elements you need (images, tables, etc.)
3. **Error handling**: Always wrap parsing in try-catch blocks
4. **Performance**: Adjust chunk sizes and concurrent processing based on your needs

## Sample Documents

The examples expect to find sample DOCX files. You can:
- Create your own test documents
- Use any DOCX file you have available
- Generate test documents with various content types (text, images, tables)

## Next Steps

After running these examples, you can:
- Integrate the library into your own projects
- Customize parsing options for your specific needs
- Build applications that process DOCX documents at scale
- Contribute improvements back to the library
