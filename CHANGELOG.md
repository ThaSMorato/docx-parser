# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of DOCX Parser library
- **Core Features:**
  - Incremental parsing with async generators (`parseDocx`, `parseDocxStream`, `parseDocxFile`)
  - Memory-efficient processing for large documents
  - Support for Buffer and ReadableStream inputs
  - Clean Architecture implementation (Domain, Application, Infrastructure, Interfaces)

- **Document Elements:**
  - Metadata extraction (title, author, dates, etc.)
  - Paragraph parsing with formatting support
  - Image extraction with metadata (PNG, JPG, GIF, SVG, WMF, EMF)
  - Table parsing with cell structure
  - Header detection with hierarchy levels (H1-H6)
  - Footer and footnote support
  - Page break and section elements

- **Special Features:**
  - ✅ **Checkbox Detection**: Automatically detects checked/unchecked states in lists
  - 📝 **Footnote Processing**: Extracts footnotes with proper references
  - 🏗️ **Header Levels**: Maintains document structure with header hierarchy
  - ✅ **Document Validation**: Built-in DOCX file integrity validation
  - 🎯 **List Processing**: Handles numbered, bulleted, and checkbox lists

- **API Functions:**
  - `parseDocx()` - Incremental parsing
  - `parseDocxToArray()` - Full document parsing
  - `extractText()` - Text-only extraction
  - `extractImages()` - Image-only extraction
  - `getMetadata()` - Metadata-only extraction
  - `ValidateDocumentUseCaseImpl` - Document validation

- **Configuration Options:**
  - Content filtering (images, tables, headers, footers)
  - Image processing options (format, size limits)
  - Text processing (formatting preservation, whitespace normalization)
  - Performance tuning (chunk size, concurrent processing)

- **Development:**
  - Complete TypeScript support with well-defined interfaces
  - Comprehensive test suite (unit, integration, E2E)
  - ESLint and Prettier configuration
  - GitHub Actions for CI/CD
  - Automatic NPM publishing with semantic versioning

### Technical Details
- **Architecture**: Clean Architecture with clear separation of concerns
- **Language**: TypeScript with full type safety
- **Runtime**: Node.js 22+ with ES modules
- **Dependencies**: Minimal (only JSZip for ZIP processing)
- **Testing**: Vitest with real DOCX files
- **Build**: tsup for optimized bundling

### Documentation
- Comprehensive README with examples
- API documentation with TypeScript interfaces
- Usage examples (basic and advanced)
- Architecture documentation
- Automatic versioning system documentation

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

### Commit Message Conventions

- `MAJOR:` - Breaking changes (bumps major version)
- `MINOR:` or `feat:` - New features (bumps minor version)
- `fix:`, `docs:`, `chore:`, etc. - Bug fixes and maintenance (bumps patch version)

See [VERSIONING.md](.github/VERSIONING.md) for detailed information about automatic versioning.
