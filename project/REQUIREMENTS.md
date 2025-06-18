# DOCX Parser - Requirements

## Overview

Biblioteca JavaScript moderna para parsing de arquivos DOCX que retorna conteúdo de forma incremental através de generators, permitindo processamento eficiente de memória e streaming.

## Core Architecture

### Generator-Based API

A arquitetura principal utiliza **generators com yield** para retornar elementos do documento de forma incremental:

```typescript
async function* parseDocx(source: Buffer | ReadableStream): AsyncGenerator<DocumentElement> {
  yield { type: 'metadata', content: { title: 'Doc Title', author: 'Author' } };
  yield { type: 'paragraph', content: 'Texto do parágrafo', formatting: { bold: true } };
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
  // Process elementos um por vez sem carregar documento inteiro na memória
  await processElement(element);
}
```

## Performance Requirements

1. **Memory Efficiency**: Usar generators para evitar carregar documento inteiro na memória
2. **Streaming Support**: Suportar ReadableStream para arquivos grandes
3. **Lazy Loading**: Elementos só são parseados quando acessados via yield
4. **Concurrent Processing**: Opção para processar elementos concorrentemente
5. **Chunk Processing**: Processar arquivo em chunks configuráveis

## Error Handling

```typescript
// Errors são propagados através do generator
try {
  for await (const element of parseDocx(buffer)) {
    // Process element
  }
} catch (error) {
  if (error instanceof DocxParseError) {
    console.error('Parse error:', error.message, error.position);
  }
}

// Erro específico por elemento
interface DocumentElement {
  // ... outros campos
  error?: {
    type: 'warning' | 'error';
    message: string;
    recoverable: boolean;
  };
}
```

## Implementation Priorities

1. **Core Generator Engine**: Implementar o parser principal com yield
2. **Text Extraction**: Parsing de parágrafos e formatação
3. **Image Extraction**: Extração de imagens embarcadas
4. **Table Support**: Parsing de tabelas complexas
5. **Metadata Extraction**: Propriedades do documento
6. **Stream Support**: ReadableStream input
7. **Advanced Formatting**: Estilos, hyperlinks, etc.
8. **Error Recovery**: Handling robusto de arquivos corrompidos

## Technical Stack

- **Core**: TypeScript, Node.js 22+
- **ZIP Processing**: JSZip
- **XML Parsing**: Native DOMParser ou fast-xml-parser
- **Streaming**: Node.js Streams API
- **Testing**: Vitest com arquivos DOCX reais

## Benefits da Arquitetura com Yield

1. **Memory Efficient**: Processa arquivos de qualquer tamanho
2. **Incremental Processing**: Permite parar/continuar parsing
3. **Composable**: Fácil de combinar com outros generators/streams
4. **Backpressure**: Controle natural de fluxo
5. **Type Safe**: Full TypeScript support com tipos bem definidos
6. **Developer Friendly**: API intuitiva e moderna
