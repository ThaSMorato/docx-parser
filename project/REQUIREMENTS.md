# DOCX Parser - Requirements

## Overview

Modern JavaScript library for parsing DOCX files that returns content incrementally through generators, enabling efficient memory processing and streaming.

## Core Architecture

### Generator-Based API

The main architecture uses **generators with yield** to return document elements incrementally:

```typescript
async function* parseDocx(source: Buffer | ReadableStream): AsyncGenerator<DocumentElement> {
  yield { type: 'metadata', content: { title: 'Doc Title', author: 'Author' } };
  yield { type: 'paragraph', content: 'Paragraph text', formatting: { bold: true } };
  yield { type: 'image', content: buffer, metadata: { filename: 'img.png', width: 800 } };
  yield { type: 'table', content: [...rows], formatting: { borders: true } };
}
```

### Element Types

```typescript
type DocumentElement =
  | MetadataElement
  | ParagraphElement
  | ImageElement
  | TableElement
  | ListElement
  | HeaderElement
  | FooterElement
  | PageBreakElement
  | SectionElement;

interface BaseElement {
  type: string;
  id?: string;
  position: { page: number; section: number; order: number };
}

interface MetadataElement extends BaseElement {
  type: 'metadata';
  content: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    created?: Date;
    modified?: Date;
    pages?: number;
    words?: number;
  };
}

interface ParagraphElement extends BaseElement {
  type: 'paragraph';
  content: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    indent?: number;
    lineSpacing?: number;
  };
  hyperlinks?: Array<{
    text: string;
    url: string;
    start: number;
    end: number;
  }>;
}

interface ImageElement extends BaseElement {
  type: 'image';
  content: Buffer;
  metadata: {
    filename?: string;
    format: 'png' | 'jpg' | 'gif' | 'svg' | 'wmf' | 'emf';
    width: number;
    height: number;
    dpi?: number;
  };
  positioning?: {
    inline: boolean;
    x?: number;
    y?: number;
    wrap?: 'square' | 'tight' | 'through' | 'topBottom';
  };
}

interface TableElement extends BaseElement {
  type: 'table';
  content: TableRow[];
  formatting?: {
    borders?: boolean;
    borderStyle?: string;
    width?: number | 'auto';
    alignment?: 'left' | 'center' | 'right';
  };
}

interface TableRow {
  cells: TableCell[];
  height?: number;
  isHeader?: boolean;
}

interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  formatting?: {
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
}
```

## API Design

### Primary Parser Function

```typescript
// Buffer input
async function* parseDocx(buffer: Buffer, options?: ParseOptions): AsyncGenerator<DocumentElement>

// Stream input
async function* parseDocxStream(stream: ReadableStream, options?: ParseOptions): AsyncGenerator<DocumentElement>

// File path input
async function* parseDocxFile(filePath: string, options?: ParseOptions): AsyncGenerator<DocumentElement>
```

### Parse Options

```typescript
interface ParseOptions {
  // Content filtering
  includeMetadata?: boolean; // default: true
  includeImages?: boolean;   // default: true
  includeTables?: boolean;   // default: true
  includeHeaders?: boolean;  // default: false
  includeFooters?: boolean;  // default: false

  // Image handling
  imageFormat?: 'buffer' | 'base64' | 'stream'; // default: 'buffer'
  maxImageSize?: number; // bytes, default: 10MB

  // Text processing
  preserveFormatting?: boolean; // default: true
  normalizeWhitespace?: boolean; // default: true

  // Performance
  chunkSize?: number; // for stream processing, default: 64KB
  concurrent?: boolean; // process elements concurrently, default: false
}
```

### Utility Functions

```typescript
// Collect all elements into array (non-streaming)
async function parseDocxToArray(source: Buffer | ReadableStream, options?: ParseOptions): Promise<DocumentElement[]>

// Extract only text content
async function extractText(source: Buffer | ReadableStream, options?: { preserveFormatting?: boolean }): Promise<string>

// Extract only images
async function* extractImages(source: Buffer | ReadableStream): AsyncGenerator<ImageElement>

// Get document metadata only
async function getMetadata(source: Buffer | ReadableStream): Promise<MetadataElement['content']>
```

## Usage Examples

### Basic Streaming Usage

```typescript
import { parseDocx } from 'docx-parser';

const buffer = fs.readFileSync('document.docx');

for await (const element of parseDocx(buffer)) {
  switch (element.type) {
    case 'metadata':
      console.log('Document info:', element.content);
      break;
    case 'paragraph':
      console.log('Text:', element.content);
      break;
    case 'image':
      fs.writeFileSync(`img_${element.id}.${element.metadata.format}`, element.content);
      break;
    case 'table':
      console.log('Table with', element.content.length, 'rows');
      break;
  }
}
```

### Filtered Processing

```typescript
const options = {
  includeImages: false,
  includeHeaders: false,
  preserveFormatting: false
};

for await (const element of parseDocx(buffer, options)) {
  if (element.type === 'paragraph') {
    console.log(element.content);
  }
}
```

### Memory-Efficient Large File Processing

```typescript
const stream = fs.createReadStream('large-document.docx');

for await (const element of parseDocxStream(stream, { chunkSize: 32 * 1024 })) {
  // Process elements one by one without loading entire document into memory
  await processElement(element);
}
```

## Performance Requirements

1. **Memory Efficiency**: Use generators to avoid loading entire document into memory
2. **Streaming Support**: Support ReadableStream for large files
3. **Lazy Loading**: Elements are only parsed when accessed via yield
4. **Concurrent Processing**: Option to process elements concurrently
5. **Chunk Processing**: Process file in configurable chunks

## Error Handling

```typescript
// Errors are propagated through the generator
try {
  for await (const element of parseDocx(buffer)) {
    // Process element
  }
} catch (error) {
  if (error instanceof DocxParseError) {
    console.error('Parse error:', error.message, error.position);
  }
}

// Element-specific error
interface DocumentElement {
  // ... other fields
  error?: {
    type: 'warning' | 'error';
    message: string;
    recoverable: boolean;
  };
}
```

## Implementation Priorities

1. **Core Generator Engine**: Implement main parser with yield
2. **Text Extraction**: Parsing paragraphs and formatting
3. **Image Extraction**: Extracting embedded images
4. **Table Support**: Parsing complex tables
5. **Metadata Extraction**: Document properties
6. **Stream Support**: ReadableStream input
7. **Advanced Formatting**: Styles, hyperlinks, etc.
8. **Error Recovery**: Robust handling of corrupted files

## Technical Stack

- **Core**: TypeScript, Node.js 22+
- **ZIP Processing**: JSZip
- **XML Parsing**: Native DOMParser or fast-xml-parser
- **Streaming**: Node.js Streams API
- **Testing**: Vitest with real DOCX files

## Benefits of Yield Architecture

1. **Memory Efficient**: Process files of any size
2. **Incremental Processing**: Allows stopping/continuing parsing
3. **Composable**: Easy to combine with other generators/streams
4. **Backpressure**: Natural flow control
5. **Type Safe**: Full TypeScript support with well-defined types
6. **Developer Friendly**: Intuitive and modern API
