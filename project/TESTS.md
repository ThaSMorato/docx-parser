# Testing Guide

This document outlines testing patterns, strategies, and rules that must be followed in the DOCX Parser library.

## Testing Types

### Unit Testing

**Definition**: Tests that verify individual components (classes, functions) in isolation from their dependencies.

**Characteristics**:
- Fast execution (< 100ms per test)
- No external dependencies (database, file system, network)
- Deterministic and repeatable
- Test one thing at a time

```typescript
// Example: Unit test for DocumentId value object
describe('DocumentId', () => {
  describe('create', () => {
    it('should create valid DocumentId when given valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      const documentId = DocumentId.create(validUuid);

      expect(documentId.toString()).toBe(validUuid);
    });

    it('should throw InvalidDocumentIdError when given invalid format', () => {
      const invalidId = 'invalid-id';

      expect(() => DocumentId.create(invalidId)).toThrow(InvalidDocumentIdError);
    });
  });

  describe('equals', () => {
    it('should return true when comparing identical ids', () => {
      const id1 = DocumentId.create('123e4567-e89b-12d3-a456-426614174000');
      const id2 = DocumentId.create('123e4567-e89b-12d3-a456-426614174000');

      expect(id1.equals(id2)).toBe(true);
    });
  });
});
```

### Integration Testing

**Definition**: Tests that verify the interaction between multiple components working together.

**Characteristics**:
- Tests component collaboration
- May involve real implementations
- Slower than unit tests but faster than E2E
- Focus on interfaces and data flow

```typescript
// Example: Integration test for ParseDocumentUseCase
describe('ParseDocumentUseCase Integration', () => {
  let useCase: ParseDocumentUseCase;
  let documentRepository: DocumentRepository;
  let bufferParser: BufferDocumentParser;
  let validator: DocumentValidator;

  beforeEach(() => {
    documentRepository = new InMemoryDocumentRepository();
    bufferParser = new BufferDocumentParser();
    validator = new DocumentValidationService();

    useCase = new ParseDocumentUseCase(
      documentRepository,
      bufferParser,
      validator
    );
  });

  it('should parse valid DOCX buffer and save document', async () => {
    const validDocxBuffer = await loadTestDocument('valid-document.docx');

    const result = await useCase.execute({ buffer: validDocxBuffer });

    expect(result.isSuccess()).toBe(true);
    expect(result.getDocument().getContent()).toHaveLength(3);

    const savedDocument = await documentRepository.findById(result.getDocument().getId());
    expect(savedDocument).not.toBeNull();
  });
});
```

### End-to-End (E2E) Testing

**Definition**: Tests that verify the complete user workflow from start to finish.

**Characteristics**:
- Tests the entire application flow
- Uses real external dependencies
- Slowest but most comprehensive
- Tests from user perspective

```typescript
// Example: E2E test for document processing workflow
describe('Document Processing E2E', () => {
  let app: Application;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await createTempDirectory();
    app = await createTestApplication({
      storageDir: tempDir
    });
  });

  afterAll(async () => {
    await app.close();
    await removeDirectory(tempDir);
  });

  it('should process DOCX file from upload to extraction', async () => {
    // Arrange
    const testFile = path.join(__dirname, 'fixtures/sample-document.docx');
    const expectedContent = 'This is a test document';

    // Act
    const uploadResponse = await request(app)
      .post('/documents/upload')
      .attach('file', testFile)
      .expect(201);

    const documentId = uploadResponse.body.documentId;

    const extractResponse = await request(app)
      .get(`/documents/${documentId}/content`)
      .expect(200);

    // Assert
    expect(extractResponse.body.content).toContain(expectedContent);
    expect(extractResponse.body.metadata.pages).toBe(1);
  });
});
```

## Test Patterns

### Object Mother Pattern

**Purpose**: Creates complex test objects with meaningful data for specific test scenarios.

```typescript
export class DocumentMother {
  static simpleTextDocument(): Document {
    const document = Document.create({
      metadata: { title: 'Simple Document', author: 'Test Author' }
    });

    document.addContent(
      Paragraph.create('This is a test paragraph')
    );

    return document;
  }

  static documentWithTable(): Document {
    const document = Document.create({
      metadata: { title: 'Document with Table', author: 'Test Author' }
    });

    const table = Table.create([
      ['Header 1', 'Header 2'],
      ['Row 1 Col 1', 'Row 1 Col 2'],
      ['Row 2 Col 1', 'Row 2 Col 2']
    ]);

    document.addContent(table);
    return document;
  }

  static largeDocument(): Document {
    const document = Document.create({
      metadata: { title: 'Large Document', author: 'Test Author' }
    });

    // Add 100 paragraphs
    for (let i = 1; i <= 100; i++) {
      document.addContent(
        Paragraph.create(`This is paragraph number ${i}`)
      );
    }

    return document;
  }

  static invalidDocument(): Document {
    const document = Document.create({
      metadata: { title: '', author: '' } // Invalid empty metadata
    });

    return document;
  }
}

// Usage in tests
describe('DocumentValidationService', () => {
  it('should validate simple document successfully', () => {
    const document = DocumentMother.simpleTextDocument();

    const result = validationService.validate(document);

    expect(result.isValid()).toBe(true);
  });

  it('should fail validation for invalid document', () => {
    const document = DocumentMother.invalidDocument();

    const result = validationService.validate(document);

    expect(result.isValid()).toBe(false);
    expect(result.getErrors()).toContain('Title cannot be empty');
  });
});
```

### Test Builder Pattern

**Purpose**: Provides fluent API for building test objects with customizable properties.

```typescript
export class DocumentBuilder {
  private title = 'Default Title';
  private author = 'Default Author';
  private content: Content[] = [];

  static create(): DocumentBuilder {
    return new DocumentBuilder();
  }

  withTitle(title: string): DocumentBuilder {
    this.title = title;
    return this;
  }

  withAuthor(author: string): DocumentBuilder {
    this.author = author;
    return this;
  }

  withParagraph(text: string): DocumentBuilder {
    this.content.push(Paragraph.create(text));
    return this;
  }

  withTable(data: string[][]): DocumentBuilder {
    this.content.push(Table.create(data));
    return this;
  }

  build(): Document {
    const document = Document.create({
      metadata: { title: this.title, author: this.author }
    });

    this.content.forEach(content => document.addContent(content));

    return document;
  }
}

// Usage in tests
describe('Document Processing', () => {
  it('should process document with custom properties', () => {
    const document = DocumentBuilder
      .create()
      .withTitle('Custom Title')
      .withAuthor('John Doe')
      .withParagraph('First paragraph')
      .withParagraph('Second paragraph')
      .build();

    const result = processor.process(document);

    expect(result.title).toBe('Custom Title');
    expect(result.paragraphs).toHaveLength(2);
  });
});
```

### Mock Factory Pattern

**Purpose**: Centralizes mock creation and configuration for consistent testing.

```typescript
export class MockFactory {
  static createDocumentRepository(): jest.Mocked<DocumentRepository> {
    return {
      save: jest.fn(),
      findById: jest.fn(),
      findByQuery: jest.fn()
    };
  }

  static createDocumentParser(): jest.Mocked<DocumentParser> {
    return {
      parse: jest.fn(),
      canParse: jest.fn(),
      getSupportedFormats: jest.fn()
    };
  }

  static createDocumentValidator(): jest.Mocked<DocumentValidator> {
    return {
      validate: jest.fn(),
      validateStructure: jest.fn(),
      validateContent: jest.fn()
    };
  }

  // Pre-configured mocks for common scenarios
  static createSuccessfulDocumentRepository(): jest.Mocked<DocumentRepository> {
    const mock = this.createDocumentRepository();

    mock.save.mockResolvedValue();
    mock.findById.mockResolvedValue(DocumentMother.simpleTextDocument());
    mock.findByQuery.mockResolvedValue([DocumentMother.simpleTextDocument()]);

    return mock;
  }

  static createFailingDocumentRepository(): jest.Mocked<DocumentRepository> {
    const mock = this.createDocumentRepository();

    mock.save.mockRejectedValue(new Error('Save failed'));
    mock.findById.mockResolvedValue(null);
    mock.findByQuery.mockResolvedValue([]);

    return mock;
  }
}
```

### Fixture Factory Pattern

**Purpose**: Manages test data files and creates consistent test fixtures.

```typescript
export class FixtureFactory {
  private static readonly FIXTURE_DIR = path.join(__dirname, '../fixtures');

  static async loadDocxBuffer(filename: string): Promise<Buffer> {
    const filePath = path.join(this.FIXTURE_DIR, 'docx', filename);
    return fs.readFile(filePath);
  }

  static async loadExpectedContent(filename: string): Promise<string> {
    const filePath = path.join(this.FIXTURE_DIR, 'content', filename);
    return fs.readFile(filePath, 'utf-8');
  }

  static createTempFile(content: Buffer, extension = '.docx'): string {
    const tempPath = path.join(os.tmpdir(), `test-${Date.now()}${extension}`);
    fs.writeFileSync(tempPath, content);
    return tempPath;
  }

  static async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  }
}

// Test fixtures structure
/*
tests/
└── fixtures/
    ├── docx/
    │   ├── simple-document.docx
    │   ├── complex-document.docx
    │   ├── corrupted-document.docx
    │   └── large-document.docx
    └── content/
        ├── simple-document.txt
        ├── complex-document.txt
        └── large-document.txt
*/
```

### Test Doubles Patterns

#### Mock
**Purpose**: Verifies interactions and behavior.

```typescript
describe('ParseDocumentUseCase', () => {
  it('should call validator with parsed document', async () => {
    const mockValidator = MockFactory.createDocumentValidator();
    mockValidator.validate.mockReturnValue(ValidationResult.success());

    const useCase = new ParseDocumentUseCase(
      MockFactory.createSuccessfulDocumentRepository(),
      MockFactory.createDocumentParser(),
      mockValidator
    );

    await useCase.execute({ buffer: Buffer.from('test') });

    expect(mockValidator.validate).toHaveBeenCalledTimes(1);
    expect(mockValidator.validate).toHaveBeenCalledWith(
      expect.any(Document)
    );
  });
});
```

#### Stub
**Purpose**: Provides predefined responses.

```typescript
class StubDocumentParser implements DocumentParser {
  parse(buffer: Buffer): Document {
    return DocumentMother.simpleTextDocument();
  }

  canParse(buffer: Buffer): boolean {
    return true;
  }

  getSupportedFormats(): string[] {
    return ['docx'];
  }
}
```

#### Spy
**Purpose**: Records method calls while preserving original behavior.

```typescript
describe('DocumentProcessor', () => {
  it('should log processing steps', async () => {
    const loggerSpy = jest.spyOn(console, 'log').mockImplementation();

    const processor = new DocumentProcessor();
    await processor.process(DocumentMother.simpleTextDocument());

    expect(loggerSpy).toHaveBeenCalledWith('Starting document processing');
    expect(loggerSpy).toHaveBeenCalledWith('Document processing completed');

    loggerSpy.mockRestore();
  });
});
```

#### Fake
**Purpose**: Working implementation with simplified behavior.

```typescript
class FakeDocumentRepository implements DocumentRepository {
  private documents = new Map<string, Document>();

  async save(document: Document): Promise<void> {
    this.documents.set(document.getId().toString(), document);
  }

  async findById(id: DocumentId): Promise<Document | null> {
    return this.documents.get(id.toString()) || null;
  }

  async findByQuery(query: DocumentQuery): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
}
```

## Project Testing Rules

### Rule 1: Public Method Coverage
**Every class must have all public methods tested**

```typescript
// ✅ Good: All public methods tested
class DocumentValidator {
  public validate(document: Document): ValidationResult { /* ... */ }
  public validateStructure(document: Document): boolean { /* ... */ }
  public validateContent(content: Content[]): boolean { /* ... */ }
  private isValidElement(element: Element): boolean { /* ... */ } // Private - not required
}

describe('DocumentValidator', () => {
  describe('validate', () => {
    // Test validate method
  });

  describe('validateStructure', () => {
    // Test validateStructure method
  });

  describe('validateContent', () => {
    // Test validateContent method
  });

  // Private methods don't need direct tests
});
```

### Rule 2: Interface Mock Coverage
**Every interface must have a corresponding mock**

```typescript
// Interface
interface DocumentRepository {
  save(document: Document): Promise<void>;
  findById(id: DocumentId): Promise<Document | null>;
  findByQuery(query: DocumentQuery): Promise<Document[]>;
}

// ✅ Required: Mock implementation
export const createMockDocumentRepository = (): jest.Mocked<DocumentRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByQuery: jest.fn()
});

// ✅ Required: Type-safe mock factory
export class DocumentRepositoryMockFactory {
  static create(): jest.Mocked<DocumentRepository> {
    return createMockDocumentRepository();
  }

  static createWithSuccessfulSave(): jest.Mocked<DocumentRepository> {
    const mock = this.create();
    mock.save.mockResolvedValue();
    return mock;
  }

  static createWithFailingSave(): jest.Mocked<DocumentRepository> {
    const mock = this.create();
    mock.save.mockRejectedValue(new Error('Save failed'));
    return mock;
  }
}
```

### Rule 3: Use Case Integration Testing
**Every use case must have integration tests**

```typescript
// ✅ Required: Integration test for every use case
describe('ParseDocumentUseCase Integration', () => {
  let useCase: ParseDocumentUseCase;
  let realRepository: DocumentRepository;
  let realParser: DocumentParser;
  let realValidator: DocumentValidator;

  beforeEach(() => {
    // Use real implementations for integration testing
    realRepository = new InMemoryDocumentRepository();
    realParser = new BufferDocumentParser();
    realValidator = new DocumentValidationService();

    useCase = new ParseDocumentUseCase(realRepository, realParser, realValidator);
  });

  it('should successfully parse and store valid document', async () => {
    const validBuffer = await FixtureFactory.loadDocxBuffer('simple-document.docx');

    const result = await useCase.execute({ buffer: validBuffer });

    expect(result.isSuccess()).toBe(true);

    // Verify document was actually saved
    const savedDoc = await realRepository.findById(result.getDocument().getId());
    expect(savedDoc).not.toBeNull();
  });

  it('should handle parsing errors gracefully', async () => {
    const invalidBuffer = Buffer.from('invalid docx content');

    const result = await useCase.execute({ buffer: invalidBuffer });

    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DocumentParsingError);
  });
});
```

### Rule 4: Error Path Testing
**Every error scenario must be tested**

```typescript
describe('Document Validation', () => {
  it('should handle all validation error types', () => {
    const testCases = [
      {
        document: DocumentMother.documentWithEmptyTitle(),
        expectedError: 'Title cannot be empty'
      },
      {
        document: DocumentMother.documentWithInvalidAuthor(),
        expectedError: 'Author must be a valid string'
      },
      {
        document: DocumentMother.documentWithNoContent(),
        expectedError: 'Document must contain at least one content element'
      }
    ];

    testCases.forEach(({ document, expectedError }) => {
      const result = validator.validate(document);

      expect(result.isValid()).toBe(false);
      expect(result.getErrors()).toContain(expectedError);
    });
  });
});
```

## Test Organization

### File Structure
```
tests/
├── unit/                     # Unit tests
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── services/
│   ├── application/
│   │   └── use-cases/
│   └── infrastructure/
│       └── parsers/
├── integration/              # Integration tests
│   ├── use-cases/
│   └── services/
├── e2e/                      # End-to-end tests
│   └── workflows/
├── fixtures/                 # Test data
│   ├── docx/
│   └── content/
├── helpers/                  # Test utilities
│   ├── mothers/
│   ├── builders/
│   ├── mocks/
│   └── fixtures/
└── setup/                    # Test configuration
    ├── jest.config.ts
    └── test-setup.ts
```

### Naming Conventions

```typescript
// Test files
DocumentValidator.test.ts           // Unit test
ParseDocumentUseCase.integration.ts // Integration test
DocumentProcessing.e2e.ts          // E2E test

// Test descriptions
describe('DocumentValidator', () => {
  describe('validate', () => {
    it('should return success for valid document', () => {});
    it('should return failure for document with empty title', () => {});
    it('should throw error when document is null', () => {});
  });
});

// Test helpers
DocumentMother.ts                   // Object Mother
DocumentBuilder.ts                  // Builder
MockDocumentRepository.ts           // Mock
DocumentFixtures.ts                 // Fixtures
```

## Performance Testing Guidelines

### Test Performance Benchmarks
- Unit tests: < 100ms each
- Integration tests: < 5s each
- E2E tests: < 30s each

### Memory Testing
```typescript
describe('Memory Usage', () => {
  it('should not leak memory when processing large documents', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < 100; i++) {
      const document = DocumentMother.largeDocument();
      await processor.process(document);
    }

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Should not increase by more than 50MB
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Continuous Integration Requirements

### Test Coverage Thresholds
```javascript
// jest.config.ts
export default {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/domain/': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90
    }
  }
};
```

### Test Execution Order
1. **Unit Tests** - Run first, fail fast
2. **Integration Tests** - Run after unit tests pass
3. **E2E Tests** - Run only on main branch or release candidates
4. **Performance Tests** - Run nightly or on performance-related changes

This comprehensive testing strategy ensures code quality, maintainability, and reliability throughout the development lifecycle.
