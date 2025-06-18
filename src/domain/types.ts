export interface BaseElement {
  type: string;
  id?: string;
  position: { page: number; section: number; order: number };
  error?: {
    type: 'warning' | 'error';
    message: string;
    recoverable: boolean;
  };
}

export interface MetadataElement extends BaseElement {
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

export interface ParagraphElement extends BaseElement {
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

export interface ImageElement extends BaseElement {
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

export interface TableRow {
  cells: TableCell[];
  height?: number;
  isHeader?: boolean;
}

export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  formatting?: {
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
}

export interface TableElement extends BaseElement {
  type: 'table';
  content: TableRow[];
  formatting?: {
    borders?: boolean;
    borderStyle?: string;
    width?: number | 'auto';
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface ListElement extends BaseElement {
  type: 'list';
  content: string[];
  listType: 'bullet' | 'number';
  level: number;
}

export interface HeaderElement extends BaseElement {
  type: 'header';
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface FooterElement extends BaseElement {
  type: 'footer';
  content: string;
}

export interface PageBreakElement extends BaseElement {
  type: 'pageBreak';
  content: null;
}

export interface SectionElement extends BaseElement {
  type: 'section';
  content: string;
  sectionType: 'header' | 'footer' | 'body';
}

export type DocumentElement =
  | MetadataElement
  | ParagraphElement
  | ImageElement
  | TableElement
  | ListElement
  | HeaderElement
  | FooterElement
  | PageBreakElement
  | SectionElement;

export interface ParseOptions {
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

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
    position?: { line: number; column: number };
  }>;
}

export class DocxParseError extends Error {
  constructor(
    message: string,
    public readonly position?: { line: number; column: number },
    public readonly code?: string
  ) {
    super(message);
    this.name = 'DocxParseError';
  }
}
