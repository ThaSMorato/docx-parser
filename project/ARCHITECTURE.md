# Architecture Guide

This document outlines the architectural principles and patterns that should be followed in the DOCX Parser library implementation.

## Clean Architecture

The library follows Clean Architecture principles to ensure maintainability, testability, and separation of concerns.

### Layer Structure

```
┌─────────────────────────────────────┐
│           Frameworks & Drivers      │  ← External libraries, file system
├─────────────────────────────────────┤
│        Interface Adapters           │  ← Controllers, presenters, parsers
├─────────────────────────────────────┤
│          Use Cases                  │  ← Business logic, application rules
├─────────────────────────────────────┤
│           Entities                  │  ← Domain models, business rules
└─────────────────────────────────────┘
```

#### 1. Entities (Domain Layer)
- **DocumentModel**: Core DOCX document representation
- **ContentElement**: Abstract base for document elements
- **Paragraph**, **Table**, **Image**: Concrete content elements
- **DocumentMetadata**: Document properties and settings
- **ParsingResult**: Encapsulates parsing outcomes

#### 2. Use Cases (Application Layer)
- **ParseDocumentUseCase**: Orchestrates document parsing
- **ExtractContentUseCase**: Content extraction logic
- **ValidateDocumentUseCase**: Document validation rules
- **StreamProcessUseCase**: Stream-based processing logic

#### 3. Interface Adapters
- **BufferDocumentParser**: Adapter for buffer-based parsing
- **StreamDocumentParser**: Adapter for stream-based parsing
- **FileSystemAdapter**: File operations abstraction
- **ValidationAdapter**: Document validation interface

#### 4. Frameworks & Drivers
- **JSZip**: ZIP file handling
- **XML Parsers**: XML processing libraries
- **Stream APIs**: Node.js stream interfaces

### Dependency Rule

Dependencies must point inward. Inner layers cannot know about outer layers.

```typescript
// ✅ Good: Use Case depends on Entity
class ParseDocumentUseCase {
  constructor(private documentRepository: DocumentRepository) {}

  async execute(input: Buffer): Promise<DocumentModel> {
    // Business logic here
  }
}

// ❌ Bad: Entity depends on Use Case
class DocumentModel {
  constructor(private parseUseCase: ParseDocumentUseCase) {} // Wrong!
}
```

## SOLID Principles

### Single Responsibility Principle (SRP)

Each class should have only one reason to change.

```typescript
// ✅ Good: Single responsibility
class DocumentParser {
  parse(buffer: Buffer): DocumentModel {
    // Only parsing logic
  }
}

class DocumentValidator {
  validate(document: DocumentModel): ValidationResult {
    // Only validation logic
  }
}

// ❌ Bad: Multiple responsibilities
class DocumentProcessor {
  parse(buffer: Buffer): DocumentModel { /* parsing */ }
  validate(document: DocumentModel): boolean { /* validation */ }
  save(document: DocumentModel): void { /* persistence */ }
}
```

### Open/Closed Principle (OCP)

Classes should be open for extension but closed for modification.

```typescript
// ✅ Good: Extensible through inheritance/composition
abstract class ContentExtractor {
  abstract extract(element: Element): string;
}

class ParagraphExtractor extends ContentExtractor {
  extract(element: Element): string {
    // Paragraph-specific extraction
  }
}

class TableExtractor extends ContentExtractor {
  extract(element: Element): string {
    // Table-specific extraction
  }
}
```

### Liskov Substitution Principle (LSP)

Derived classes must be substitutable for their base classes.

```typescript
interface DocumentReader {
  read(): Promise<DocumentModel>;
}

class BufferDocumentReader implements DocumentReader {
  async read(): Promise<DocumentModel> {
    // Buffer implementation
  }
}

class StreamDocumentReader implements DocumentReader {
  async read(): Promise<DocumentModel> {
    // Stream implementation - same interface contract
  }
}
```

### Interface Segregation Principle (ISP)

Clients should not depend on interfaces they don't use.

```typescript
// ✅ Good: Segregated interfaces
interface DocumentReader {
  read(): Promise<DocumentModel>;
}

interface DocumentWriter {
  write(document: DocumentModel): Promise<void>;
}

interface DocumentValidator {
  validate(document: DocumentModel): ValidationResult;
}

// ❌ Bad: Fat interface
interface DocumentProcessor {
  read(): Promise<DocumentModel>;
  write(document: DocumentModel): Promise<void>;
  validate(document: DocumentModel): ValidationResult;
  compress(): Buffer;
  encrypt(key: string): void;
}
```

### Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions.

```typescript
// ✅ Good: Depends on abstraction
class DocumentParsingService {
  constructor(
    private reader: DocumentReader,
    private parser: ContentParser,
    private validator: DocumentValidator
  ) {}
}

// ❌ Bad: Depends on concrete implementation
class DocumentParsingService {
  constructor() {
    this.reader = new FileSystemReader(); // Concrete dependency
    this.parser = new XMLParser(); // Concrete dependency
  }
}
```

## Domain Driven Design (DDD)

### Bounded Contexts

The library is organized into distinct bounded contexts:

#### 1. Document Processing Context
- **Aggregates**: Document, Content, Metadata
- **Value Objects**: DocumentId, ContentType, FileSize
- **Domain Services**: DocumentValidationService, ContentExtractionService

#### 2. Parsing Context
- **Aggregates**: ParseRequest, ParseResult
- **Value Objects**: ParsingOptions, ElementType
- **Domain Services**: ParsingStrategyService, ValidationService

#### 3. Stream Processing Context
- **Aggregates**: StreamProcessor, ProcessingResult
- **Value Objects**: StreamOptions, ChunkSize
- **Domain Services**: StreamValidationService, ChunkProcessingService

### Aggregates

```typescript
// Document Aggregate Root
class Document {
  private constructor(
    private readonly id: DocumentId,
    private content: Content[],
    private metadata: DocumentMetadata
  ) {}

  static create(data: DocumentData): Document {
    const id = DocumentId.generate();
    const metadata = DocumentMetadata.fromData(data.metadata);
    return new Document(id, [], metadata);
  }

  addContent(content: Content): void {
    // Business rules for adding content
    if (!this.isValidContent(content)) {
      throw new InvalidContentError();
    }
    this.content.push(content);
  }

  private isValidContent(content: Content): boolean {
    // Domain validation logic
  }
}
```

### Value Objects

```typescript
class DocumentId {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new InvalidDocumentIdError();
    }
  }

  static create(value: string): DocumentId {
    return new DocumentId(value);
  }

  static generate(): DocumentId {
    return new DocumentId(crypto.randomUUID());
  }

  equals(other: DocumentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private isValid(value: string): boolean {
    return value.length > 0 && /^[a-fA-F0-9-]+$/.test(value);
  }
}
```

### Domain Services

```typescript
class DocumentValidationService {
  validate(document: Document): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.hasValidStructure(document)) {
      errors.push(new StructureValidationError());
    }

    if (!this.hasValidContent(document)) {
      errors.push(new ContentValidationError());
    }

    return ValidationResult.create(errors);
  }

  private hasValidStructure(document: Document): boolean {
    // Complex domain validation logic
  }

  private hasValidContent(document: Document): boolean {
    // Content-specific validation rules
  }
}
```

### Repository Pattern

```typescript
interface DocumentRepository {
  save(document: Document): Promise<void>;
  findById(id: DocumentId): Promise<Document | null>;
  findByQuery(query: DocumentQuery): Promise<Document[]>;
}

class InMemoryDocumentRepository implements DocumentRepository {
  private documents: Map<string, Document> = new Map();

  async save(document: Document): Promise<void> {
    this.documents.set(document.getId().toString(), document);
  }

  async findById(id: DocumentId): Promise<Document | null> {
    return this.documents.get(id.toString()) || null;
  }

  async findByQuery(query: DocumentQuery): Promise<Document[]> {
    // Query implementation
  }
}
```

## Folder Structure

```
src/
├── domain/                    # Entities, Value Objects, Domain Services
│   ├── entities/
│   │   ├── Document.ts
│   │   ├── Content.ts
│   │   └── DocumentMetadata.ts
│   ├── value-objects/
│   │   ├── DocumentId.ts
│   │   ├── ContentType.ts
│   │   └── FileSize.ts
│   ├── services/
│   │   ├── DocumentValidationService.ts
│   │   └── ContentExtractionService.ts
│   └── repositories/
│       └── DocumentRepository.ts
├── application/               # Use Cases, Application Services
│   ├── use-cases/
│   │   ├── ParseDocumentUseCase.ts
│   │   ├── ExtractContentUseCase.ts
│   │   └── ValidateDocumentUseCase.ts
│   └── services/
│       └── DocumentApplicationService.ts
├── infrastructure/            # External concerns, implementations
│   ├── parsers/
│   │   ├── BufferDocumentParser.ts
│   │   └── StreamDocumentParser.ts
│   ├── repositories/
│   │   └── InMemoryDocumentRepository.ts
│   └── adapters/
│       ├── FileSystemAdapter.ts
│       └── XMLParserAdapter.ts
└── interfaces/               # API layer, controllers
    ├── controllers/
    │   └── DocumentController.ts
    └── dto/
        ├── ParseDocumentRequest.ts
        └── ParseDocumentResponse.ts
```

## Testing Strategy

### Unit Tests
- Test domain entities and value objects in isolation
- Mock external dependencies using interfaces
- Focus on business logic and domain rules

### Integration Tests
- Test use cases with real implementations
- Verify adapter integrations
- Test cross-layer interactions

### Architecture Tests
- Verify dependency rules are not violated
- Ensure proper layer separation
- Test that interfaces are properly implemented

```typescript
// Example architecture test
describe('Architecture Rules', () => {
  it('should not allow domain layer to depend on infrastructure', () => {
    const domainFiles = glob.sync('src/domain/**/*.ts');
    const infrastructureImports = domainFiles
      .map(file => getImports(file))
      .flat()
      .filter(importPath => importPath.includes('infrastructure'));

    expect(infrastructureImports).toHaveLength(0);
  });
});
```

## Implementation Guidelines

1. **Start with the Domain**: Begin by modeling the core business concepts
2. **Define Interfaces First**: Create abstractions before implementations
3. **Use Dependency Injection**: Inject dependencies through constructors
4. **Keep It Simple**: Don't over-engineer, apply patterns when they add value
5. **Test-Driven Development**: Write tests before implementations
6. **Refactor Continuously**: Keep the codebase clean and maintainable
