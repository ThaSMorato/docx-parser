# DOCX Parser

A modern JavaScript/TypeScript library for parsing DOCX documents using generator architecture and Clean Architecture.

## 🚀 Features

- **Streaming**: Processes DOCX documents incrementally using async generators
- **Memory Efficient**: Doesn't load the entire document into memory
- **TypeScript**: Complete typing with well-defined interfaces
- **Clean Architecture**: Clear separation between layers (Domain, Application, Infrastructure, Interfaces)
- **Flexible**: Extracts text, images, tables, metadata, and formatting
- **Configurable**: Advanced options to control parsing
- **Checkbox Detection**: Automatically detects and parses checkbox states in lists
- **Footnote Support**: Identifies and extracts footnotes with proper references
- **Header Levels**: Detects document structure with header hierarchy (H1-H6)
- **Document Validation**: Built-in validation for DOCX file integrity
- **Page Elements**: Supports headers, footers, and page breaks
- **List Processing**: Handles numbered, bulleted, and checkbox lists

## 📦 Installation

```bash
npm install @thasmorato/docx-parser
# or
yarn add @thasmorato/docx-parser
# or
pnpm add @thasmorato/docx-parser
```

## 📋 Main Exports

The library exports only essential items for a clean API:

```typescript
// Main parsing functions
import {
  parseDocx,           // Buffer → AsyncGenerator
  parseDocxStream,     // ReadStream → AsyncGenerator
  parseDocxWebStream,  // ReadableStream → AsyncGenerator
  parseDocxFile,       // File path → AsyncGenerator
  parseDocxToArray,    // Any source → Promise<Array>
  extractText,         // Extract only text
  extractImages,       // Extract only images
  getMetadata          // Extract only metadata
} from 'docx-parser';

// Essential types
import type {
  DocumentElement,     // Union of all element types
  ParseOptions,        // Configuration options
  ValidationResult,    // Validation response
  MetadataElement,     // Document metadata
  ParagraphElement,    // Text paragraphs
  ImageElement,        // Images with metadata
  TableElement,        // Tables with rows/cells
  HeaderElement,       // Document headers
  FooterElement,       // Document footers
  ListElement,         // Lists (bullet/numbered)
  PageBreakElement,    // Page breaks
  SectionElement       // Document sections
} from 'docx-parser';

// Error handling
import { DocxParseError } from 'docx-parser';

// Advanced utilities
import { StreamAdapter } from 'docx-parser';
import { ValidateDocumentUseCaseImpl } from 'docx-parser';
```

## 🔥 Basic Usage

### Incremental Parsing (Recommended)

```typescript
import { parseDocx } from 'docx-parser';
import { readFileSync } from 'fs';

const buffer = readFileSync('document.docx');

// Process document incrementally
for await (const element of parseDocx(buffer)) {
  console.log(`Type: ${element.type}`);

  if (element.type === 'paragraph') {
    console.log(`Text: ${element.content}`);
  } else if (element.type === 'image') {
    console.log(`Image: ${element.metadata?.filename}`);
  } else if (element.type === 'table') {
    console.log(`Table with ${element.content.length} rows`);
  }
}
```

### File Parsing

```typescript
import { parseDocxFile } from 'docx-parser';

// Read file directly from filesystem
for await (const element of parseDocxFile('./document.docx')) {
  console.log(element.type, element.content);
}
```

### Stream Parsing

```typescript
import { parseDocxStream, parseDocxWebStream } from 'docx-parser';
import { createReadStream } from 'fs';

// Usando ReadStream do Node.js (recomendado para arquivos locais)
const fileStream = createReadStream('./document.docx');
for await (const element of parseDocxStream(fileStream)) {
  console.log(element.type);
}

// Usando ReadableStream da web (para fetch, responses, etc.)
const response = await fetch('https://example.com/document.docx');
const webStream = response.body!;
for await (const element of parseDocxWebStream(webStream)) {
  console.log(element.type);
}
```

### StreamAdapter Utility

```typescript
import { StreamAdapter } from 'docx-parser';
import { createReadStream } from 'fs';

// Converter ReadStream para ReadableStream da web
const nodeStream = createReadStream('./document.docx');
const webStream = StreamAdapter.toWebStream(nodeStream);

// Converter ReadableStream para Buffer
const buffer = await StreamAdapter.toBuffer(webStream);

// Criar ReadableStream a partir de Buffer
const streamFromBuffer = StreamAdapter.fromBuffer(buffer);
```

## 🛠️ Complete API

### Main Functions

#### `parseDocx(buffer, options?)`
Processes a DOCX Buffer incrementally.

```typescript
import { parseDocx } from 'docx-parser';
import { readFileSync } from 'fs';

const buffer = readFileSync('doc.docx');
for await (const element of parseDocx(buffer, {
  includeImages: true,
  includeTables: true,
  normalizeWhitespace: true
})) {
  // Process each element
}
```

#### `parseDocxStream(stream, options?)`
Processes a DOCX ReadStream (Node.js) incrementally.

```typescript
import { parseDocxStream } from 'docx-parser';
import { createReadStream } from 'fs';

const stream = createReadStream('doc.docx');
for await (const element of parseDocxStream(stream)) {
  // Process each element
}
```

#### `parseDocxWebStream(stream, options?)`
Processes a DOCX ReadableStream (Web API) incrementally.

```typescript
import { parseDocxWebStream } from 'docx-parser';

const response = await fetch('document.docx');
const stream = response.body!;
for await (const element of parseDocxWebStream(stream)) {
  // Process each element
}
```

#### `parseDocxToArray(source, options?)`
Returns all elements as an array (non-streaming).

```typescript
import { parseDocxToArray } from 'docx-parser';
import { createReadStream } from 'fs';

// From buffer
const elements = await parseDocxToArray(buffer);

// From ReadStream
const stream = createReadStream('doc.docx');
const elements2 = await parseDocxToArray(stream);

console.log(`Document has ${elements.length} elements`);
```

#### `extractText(source, options?)`
Extracts only text from the document.

```typescript
import { extractText } from 'docx-parser';
import { createReadStream } from 'fs';

// From buffer
const text = await extractText(buffer, {
  preserveFormatting: true
});

// From ReadStream
const stream = createReadStream('doc.docx');
const text2 = await extractText(stream);

console.log(text);
```

#### `extractImages(source)`
Extracts only images from the document.

```typescript
import { extractImages } from 'docx-parser';
import { createReadStream } from 'fs';

// From buffer
for await (const image of extractImages(buffer)) {
  console.log(`Image: ${image.metadata?.filename}`);
}

// From ReadStream
const stream = createReadStream('doc.docx');
for await (const image of extractImages(stream)) {
  // image.content contains the image Buffer
}
```

#### `getMetadata(source)`
Extracts only metadata from the document.

```typescript
import { getMetadata } from 'docx-parser';
import { createReadStream } from 'fs';

// From buffer
const metadata = await getMetadata(buffer);

// From ReadStream
const stream = createReadStream('doc.docx');
const metadata2 = await getMetadata(stream);

console.log(`Title: ${metadata.title}`);
console.log(`Author: ${metadata.author}`);
console.log(`Created: ${metadata.created}`);
```

### Document Validation

#### `ValidateDocumentUseCaseImpl`
Validates DOCX document structure and integrity.

```typescript
import { ValidateDocumentUseCaseImpl } from 'docx-parser';

const validator = new ValidateDocumentUseCaseImpl();
const result = await validator.validate(buffer);

if (!result.isValid) {
  console.log('Invalid document:');
  result.errors.forEach(error => {
    console.log(`- ${error.message} (${error.code})`);
  });
} else {
  console.log('Valid document!');
}
```

## ⚙️ Configuration Options

```typescript
interface ParseOptions {
  // Content control
  includeMetadata?: boolean;     // Include metadata (default: true)
  includeImages?: boolean;       // Include images (default: true)
  includeTables?: boolean;       // Include tables (default: true)
  includeHeaders?: boolean;      // Include headers (default: false)
  includeFooters?: boolean;      // Include footers (default: false)

  // Image processing
  imageFormat?: 'buffer' | 'base64' | 'stream';  // Image format
  maxImageSize?: number;         // Maximum size in bytes (default: 10MB)

  // Text formatting
  preserveFormatting?: boolean;  // Preserve formatting (default: true)
  normalizeWhitespace?: boolean; // Normalize whitespace (default: true)

  // Performance
  chunkSize?: number;           // Chunk size (default: 64KB)
  concurrent?: boolean;         // Parallel processing (default: false)
}
```

## 📋 Element Types

### MetadataElement
```typescript
{
  type: 'metadata',
  id: string,
  position: { page: number, section: number, order: number },
  content: {
    title?: string,
    author?: string,
    subject?: string,
    created?: Date,
    modified?: Date,
    // ... other metadata
  }
}
```

### ParagraphElement
```typescript
{
  type: 'paragraph',
  id: string,
  position: { page: number, section: number, order: number },
  content: string,
  formatting?: {
    fontFamily?: string,
    fontSize?: number,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    color?: string,
    highlight?: string
  },
  // Special properties
  checkbox?: {                 // For checkbox list items
    checked: boolean
  },
  isFootnote?: boolean,        // If this is a footnote
  footnoteId?: string          // Footnote identifier
}
```

### ImageElement
```typescript
{
  type: 'image',
  id: string,
  position: { page: number, section: number, order: number },
  content: Buffer,
  metadata?: {
    filename?: string,
    format: 'png' | 'jpg' | 'gif' | 'svg' | 'wmf' | 'emf',
    width: number,
    height: number
  },
  positioning?: {
    inline?: boolean,
    x?: number,
    y?: number
  }
}
```

### TableElement
```typescript
{
  type: 'table',
  id: string,
  position: { page: number, section: number, order: number },
  content: Array<{
    cells: Array<{ content: string }>,
    isHeader: boolean
  }>
}
```

### HeaderElement
```typescript
{
  type: 'header',
  id: string,
  position: { page: number, section: number, order: number },
  content: string,
  level: 1 | 2 | 3 | 4 | 5 | 6,
  hasPageNumber?: boolean      // If header contains page numbers
}
```

### FooterElement
```typescript
{
  type: 'footer',
  id: string,
  position: { page: number, section: number, order: number },
  content: string
}
```

### ListElement
```typescript
{
  type: 'list',
  id: string,
  position: { page: number, section: number, order: number },
  content: string[],
  listType: 'bullet' | 'number',
  level: number
}
```

### Additional Elements
```typescript
// Page breaks
{
  type: 'pageBreak',
  id: string,
  position: { page: number, section: number, order: number },
  content: null
}

// Document sections
{
  type: 'section',
  id: string,
  position: { page: number, section: number, order: number },
  content: string,
  sectionType: 'header' | 'footer' | 'body'
}
```

## 🏗️ Advanced Examples

### Filtering Content Types

```typescript
import { parseDocx } from 'docx-parser';

// Only process text and tables
for await (const element of parseDocx(buffer, {
  includeImages: false,
  includeMetadata: false,
  includeTables: true
})) {
  if (element.type === 'paragraph') {
    console.log('Paragraph:', element.content);
  } else if (element.type === 'table') {
    console.log('Table found');
    element.content.forEach((row, i) => {
      console.log(`Row ${i}:`, row.cells.map(c => c.content).join(' | '));
    });
  }
}
```

### Working with Checkboxes

```typescript
import { parseDocx } from 'docx-parser';

for await (const element of parseDocx(buffer)) {
  if (element.type === 'paragraph' && element.checkbox) {
    const status = element.checkbox.checked ? '✅' : '☐';
    console.log(`${status} ${element.content}`);
  }
}
```

### Processing Footnotes

```typescript
import { parseDocx } from 'docx-parser';

const footnotes = [];
for await (const element of parseDocx(buffer)) {
  if (element.type === 'paragraph' && element.isFootnote) {
    footnotes.push({
      id: element.footnoteId,
      content: element.content
    });
  }
}

console.log('Found footnotes:', footnotes);
```

### Header Level Detection

```typescript
import { parseDocx } from 'docx-parser';

for await (const element of parseDocx(buffer)) {
  if (element.type === 'header') {
    const indent = '  '.repeat(element.level - 1);
    console.log(`${indent}H${element.level}: ${element.content}`);

    if (element.hasPageNumber) {
      console.log(`${indent}  (contains page number)`);
    }
  }
}
```

### Image Processing

```typescript
import { writeFileSync } from 'fs';
import { extractImages } from 'docx-parser';

let imageCount = 0;
for await (const image of extractImages(buffer)) {
  const filename = image.metadata?.filename || `image_${++imageCount}.${image.metadata?.format}`;
  writeFileSync(`./output/${filename}`, image.content);
  console.log(`Image saved: ${filename}`);
}
```

### Document Validation

```typescript
import { ValidateDocumentUseCaseImpl } from 'docx-parser';

const validator = new ValidateDocumentUseCaseImpl();
const result = await validator.validate(buffer);

if (!result.isValid) {
  console.log('Invalid document:');
  result.errors.forEach(error => {
    console.log(`- ${error.message} (${error.code})`);
  });
} else {
  console.log('Valid document!');
}
```

## 🔧 Architecture

The library follows Clean Architecture with 4 layers:

- **Domain**: Types, interfaces, and business rules
- **Application**: Use cases and application logic
- **Infrastructure**: Concrete implementations (JSZip, XML parsing)
- **Interfaces**: Public API and controllers

```
src/
├── domain/           # Entities and business rules
├── application/      # Use cases and application logic
├── infrastructure/   # Adapters and implementations
└── interfaces/       # Public API
```

## 🚨 Error Handling

```typescript
import { DocxParseError } from 'docx-parser';

try {
  for await (const element of parseDocx(invalidBuffer)) {
    console.log(element);
  }
} catch (error) {
  if (error instanceof DocxParseError) {
    console.log('DOCX-specific error:', error.message);
  } else {
    console.log('General error:', error);
  }
}
```

## 📝 Performance Tips

1. **Use streaming**: Prefer `parseDocx()` over `parseDocxToArray()` for large documents
2. **Filter content**: Disable `includeImages` if you don't need images
3. **Chunk size**: Adjust `chunkSize` based on document sizes
4. **Limit images**: Use `maxImageSize` to avoid very large images

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ThaSMorato/docx-parser.git
cd docx-parser

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm lint

# Build the project
pnpm build
```

### Automated Publishing

This project uses GitHub Actions for automated NPM publishing with semantic versioning:

- **MAJOR**: `MAJOR: breaking change` or `BREAKING CHANGE` in commit
- **MINOR**: `MINOR: new feature` or `feat:` prefix
- **PATCH**: `fix:`, `docs:`, `chore:` or any other commit type

See [`.github/VERSIONING.md`](.github/VERSIONING.md) for detailed information about the versioning system.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🐛 Reporting Bugs

Open an issue on GitHub with:
- Library version
- Sample DOCX file (if possible)
- Code that reproduces the problem
- Complete error message

---

**Made with ❤️ and TypeScript**
