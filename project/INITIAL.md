# DOCX Parser

A modern JavaScript library for parsing and processing Microsoft Word DOCX documents with support for both buffer and stream operations.

## Introduction

DOCX Parser is a comprehensive JavaScript library designed to handle Microsoft Word DOCX files efficiently. The library provides flexible APIs to work with DOCX documents through both buffer-based and stream-based approaches, making it suitable for various use cases from simple document parsing to high-performance batch processing.

The library focuses on providing a clean, modern API while maintaining high performance and memory efficiency, especially when dealing with large documents or multiple files.

## Objectives

### Primary Goals

- **Dual Processing Modes**: Support both buffer and stream-based processing to accommodate different use cases and performance requirements
- **Modern JavaScript**: Built with TypeScript for better developer experience and type safety
- **High Performance**: Optimized for handling large DOCX files with minimal memory footprint
- **Comprehensive Parsing**: Extract text content, formatting, images, tables, and metadata from DOCX documents
- **Stream Support**: Enable processing of large documents without loading entire files into memory
- **Developer Friendly**: Provide intuitive APIs with comprehensive documentation and examples

### Secondary Goals

- **Extensible Architecture**: Plugin system for custom document processors
- **Cross-Platform**: Compatible with Node.js, browsers, and edge runtimes
- **Zero Dependencies**: Minimize external dependencies for better security and bundle size
- **Standards Compliant**: Follow OOXML standards for accurate document parsing

## Required Tools & Versions

### Package Manager
- **pnpm**: `^8.15.0` - Fast, disk space efficient package manager

### Runtime & Language
- **Node.js**: `v22.11.0` - JavaScript runtime
- **TypeScript**: `^5.3.0` - Type-safe JavaScript with modern features

### Testing & Development
- **Vitest**: `^1.0.0` - Fast unit testing framework with TypeScript support
- **@types/node**: `^20.0.0` - Node.js type definitions

### Build & Development Tools
- **tsup**: `^8.0.0` - TypeScript bundler for library builds
- **prettier**: `^3.0.0` - Code formatting
- **eslint**: `^8.0.0` - Code linting and quality

## Getting Started

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build library
pnpm build

# Development mode
pnpm dev
```

## Architecture Overview

The library is structured around two main processing modes:

### Buffer Mode
- Suitable for smaller documents
- Faster random access to document parts
- Higher memory usage

### Stream Mode
- Optimized for large documents
- Lower memory footprint
- Sequential processing

Both modes share the same parsing core and provide consistent APIs for document extraction and manipulation.
