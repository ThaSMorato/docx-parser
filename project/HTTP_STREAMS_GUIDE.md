# Guide: HTTP Streams Support

This guide explains how to use the DOCX Parser library with HTTP requests using axios, fetch, and other libraries.

## 🚀 Overview

The library now **automatically** supports Node.js HTTP streams, resolving the error that occurred on line 47 when you tried to use `response.data` from axios.

### ❌ Previous Problem

```typescript
// This caused error: "stream.getReader is not a function"
const response = await axios({
  url: 'https://example.com/doc.docx',
  responseType: 'stream'
});

for await (const element of parseDocxStream(response.data)) { // ❌ Error!
  console.log(element);
}
```

### ✅ Solution Implemented

```typescript
// Now works perfectly!
const response = await axios({
  url: 'https://example.com/doc.docx',
  responseType: 'stream'
});

for await (const element of parseDocxHttpStream(response.data)) { // ✅ Works!
  console.log(element);
}
```

## 📦 Installation and Import

```bash
npm install @thasmorato/docx-parser
```

```typescript
import {
  parseDocxHttpStream,    // For specific HTTP streams
  parseDocxToArray,       // Automatic stream detection
  extractText,            // Text extraction with auto-detection
  getMetadata            // Metadata with auto-detection
} from '@thasmorato/docx-parser';
```

## 🔧 Usage Methods

### 1. Specific HTTP Function (`parseDocxHttpStream`)

**Best for:** Full control and maximum performance

```typescript
import axios from 'axios';
import { parseDocxHttpStream } from '@thasmorato/docx-parser';

async function parseFromUrl(url: string) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'  // ⚠️ Important: use 'stream', not 'buffer'
  });

  // Generator-based parsing (memory efficient)
  for await (const element of parseDocxHttpStream(response.data)) {
    switch (element.type) {
      case 'metadata':
        console.log('Document:', element.content);
        break;
      case 'paragraph':
        console.log('Text:', element.content);
        break;
      case 'image':
        console.log('Image:', element.metadata?.filename);
        break;
      case 'table':
        console.log('Table:', element.content);
        break;
    }
  }
}
```

### 2. Automatic Detection (`parseDocxToArray`)

**Best for:** Simplicity and convenience

```typescript
import axios from 'axios';
import { parseDocxToArray } from '@thasmorato/docx-parser';

async function parseToArray(url: string) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  // Function automatically detects it's a Node.js stream
  const elements = await parseDocxToArray(response.data, {
    includeImages: true,
    includeTables: true
  });

  console.log(`Processed ${elements.length} elements`);
  return elements;
}
```

### 3. Direct Text Extraction

```typescript
import axios from 'axios';
import { extractText } from '@thasmorato/docx-parser';

async function getTextFromUrl(url: string) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  // Extract only text, automatically detects stream
  const text = await extractText(response.data, {
    preserveFormatting: false
  });

  return text;
}
```

## 🌐 Compatibility with Different Libraries

### Axios (Recommended)

```typescript
import axios from 'axios';

const response = await axios({
  method: 'get',
  url: 'https://example.com/document.docx',
  responseType: 'stream',
  headers: {
    'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
});

// Works with any library function
const elements = await parseDocxToArray(response.data);
```

### Fetch API (Node.js 18+)

```typescript
const response = await fetch('https://example.com/document.docx');

if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

if (!response.body) {
  throw new Error('Response body is null');
}

// response.body is a Web ReadableStream, works automatically
const elements = await parseDocxToArray(response.body);
```

### Node.js HTTP/HTTPS

```typescript
import https from 'https';
import { parseDocxHttpStream } from '@thasmorato/docx-parser';

function parseFromHttps(url: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // response is a Node.js IncomingMessage (extends Readable)
      parseDocxHttpStream(response)
        .then(elements => resolve(elements))
        .catch(reject);
    });
  });
}
```

### Request (Deprecated, but still works)

```typescript
import request from 'request';

const stream = request('https://example.com/document.docx');
const elements = await parseDocxToArray(stream);
```

## 🎛️ Parsing Options

All options work with HTTP streams:

```typescript
const response = await axios({
  url: 'https://example.com/document.docx',
  responseType: 'stream'
});

const elements = await parseDocxToArray(response.data, {
  includeImages: true,        // Include images
  includeTables: true,        // Include tables
  includeHeaders: true,       // Include headers
  includeFooters: true,       // Include footers
  maxImageSize: 1024 * 1024,  // 1MB limit per image
  preserveFormatting: true    // Preserve formatting
});
```

## 🔍 Error Handling

```typescript
import axios from 'axios';
import { parseDocxHttpStream } from '@thasmorato/docx-parser';

async function safeParseFromUrl(url: string) {
  try {
    // 1. HTTP request error
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 30000  // 30 seconds
    });

    // 2. DOCX parsing error
    const elements = [];
    for await (const element of parseDocxHttpStream(response.data)) {
      elements.push(element);
    }

    return elements;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // HTTP error (404, 500, timeout, etc)
      console.error('HTTP Error:', error.response?.status, error.message);
    } else if (error.name === 'DocxParseError') {
      // DOCX parsing error
      console.error('DOCX Parse Error:', error.message);
    } else {
      // Other errors
      console.error('Unknown Error:', error);
    }
    throw error;
  }
}
```

## 🚀 Practical Examples

### Example 1: Download and Parse with Progress

```typescript
import axios from 'axios';
import { parseDocxHttpStream } from '@thasmorato/docx-parser';

async function parseWithProgress(url: string) {
  console.log('Starting download...');

  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
    onDownloadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`Download: ${percent}%`);
    }
  });

  console.log('Download complete, starting parsing...');

  let elementCount = 0;
  for await (const element of parseDocxHttpStream(response.data)) {
    elementCount++;

    if (elementCount % 10 === 0) {
      console.log(`Processed ${elementCount} elements...`);
    }

    // Process element as needed
  }

  console.log(`Parsing complete: ${elementCount} elements`);
}
```

### Example 2: Cache with Redis

```typescript
import axios from 'axios';
import Redis from 'ioredis';
import { parseDocxToArray, extractText } from '@thasmorato/docx-parser';

const redis = new Redis();

async function getCachedDocumentText(url: string): Promise<string> {
  const cacheKey = `docx:${url}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Text found in cache');
    return cached;
  }

  // Download and parse
  console.log('Downloading and parsing...');
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  const text = await extractText(response.data);

  // Save to cache (expires in 1 hour)
  await redis.setex(cacheKey, 3600, text);

  return text;
}
```

### Example 3: Batch Processing

```typescript
import axios from 'axios';
import { parseDocxToArray } from '@thasmorato/docx-parser';

async function processBatchDocuments(urls: string[]) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream',
          timeout: 60000  // 1 minute per document
        });

        const elements = await parseDocxToArray(response.data);
        return { url, success: true, elementCount: elements.length };

      } catch (error) {
        return { url, success: false, error: error.message };
      }
    })
  );

  // Process results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      if (data.success) {
        console.log(`✅ ${data.url}: ${data.elementCount} elements`);
      } else {
        console.log(`❌ ${data.url}: ${data.error}`);
      }
    } else {
      console.log(`💥 ${urls[index]}: ${result.reason}`);
    }
  });

  return results;
}
```

## 🔧 Troubleshooting

### Problem: "stream.getReader is not a function"
**Solution:** Use `parseDocxHttpStream` or make sure to use `responseType: 'stream'` in axios.

### Problem: Timeout on large documents
**Solution:** Increase axios timeout:
```typescript
const response = await axios({
  url: url,
  responseType: 'stream',
  timeout: 120000  // 2 minutes
});
```

### Problem: Memory error
**Solution:** Use generator instead of array:
```typescript
// ❌ May cause memory issues with large documents
const elements = await parseDocxToArray(stream);

// ✅ Memory-efficient
for await (const element of parseDocxHttpStream(stream)) {
  // Process one element at a time
}
```

### Problem: Authentication headers
**Solution:** Configure headers in axios:
```typescript
const response = await axios({
  method: 'get',
  url: url,
  responseType: 'stream',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
});
```

## 📊 Performance

### Method Comparison

| Method | Memory Usage | Speed | Flexibility |
|--------|-------------|-------|-------------|
| `parseDocxHttpStream` | Low | High | High |
| `parseDocxToArray` | Medium | High | Medium |
| `extractText` | Low | Very High | Low |

### Recommendations

- **Small documents (<10MB):** Use `parseDocxToArray` for simplicity
- **Large documents (>10MB):** Use `parseDocxHttpStream` with generator
- **Text only:** Use `extractText` for maximum performance
- **Real-time processing:** Use `parseDocxHttpStream` with incremental processing

## 🎯 Summary

The library now **automatically** supports all types of HTTP streams:

- ✅ **Axios** with `responseType: 'stream'`
- ✅ **Fetch API** with `response.body`
- ✅ **Node.js HTTP/HTTPS** native
- ✅ **Request** and other HTTP libraries
- ✅ **Automatic detection** of stream type
- ✅ **Robust error handling**
- ✅ **Memory efficient** with generators

The line 47 error has been **completely resolved** and now you can use any HTTP library without problems! 🚀
