# Design Document

## Overview

The XML Bible Loader feature enhances the existing Bible reader component to properly handle XML Bible file uploads and parsing. The current implementation has critical issues where XML files fail to parse correctly, leading to undefined properties and application crashes. This design addresses these issues through robust XML parsing, comprehensive error handling, and improved data validation.

## Architecture

### Current Architecture Issues
- The `parseXmlBible` function exists but has incomplete error handling
- The `loadBooks` function assumes `parsed_content.books` exists without validation
- No fallback mechanisms when XML parsing fails
- Limited support for different XML Bible formats

### Proposed Architecture
The solution follows a layered approach:

1. **Validation Layer**: Validates file type and basic XML structure
2. **Parsing Layer**: Multi-format XML parser with fallback strategies
3. **Transformation Layer**: Converts parsed XML to standardized Bible data structure
4. **Integration Layer**: Safely integrates parsed data into existing Bible reader

## Components and Interfaces

### 1. XML Parser Service (`xmlBibleParser.ts`)

```typescript
interface BibleParseResult {
  success: boolean;
  data?: ParsedBibleData;
  error?: string;
  warnings?: string[];
  metadata?: {
    format: 'XMLBIBLE' | 'OSIS' | 'GENERIC' | 'UNKNOWN';
    booksFound: number;
    chaptersFound: number;
    versesFound: number;
  };
}

interface ParsedBibleData {
  books: BibleBook[];
  metadata?: {
    title?: string;
    version?: string;
    language?: string;
  };
}

class XMLBibleParser {
  parseXMLBible(xmlText: string): BibleParseResult;
  private parseXMLBibleFormat(xmlDoc: Document): BibleBook[];
  private parseOSISFormat(xmlDoc: Document): BibleBook[];
  private parseGenericFormat(xmlDoc: Document): BibleBook[];
  private validateXMLStructure(xmlDoc: Document): boolean;
  private sanitizeText(text: string): string;
}
```

### 2. Enhanced Bible Component Methods

```typescript
// Enhanced loadBooks method with proper error handling
const loadBooks = async (bibleId: string): Promise<void> => {
  try {
    if (bibleId.startsWith('user-')) {
      const result = await loadUserBibleBooks(bibleId);
      if (!result.success) {
        throw new Error(result.error);
      }
      setAvailableBooks(result.books);
    } else {
      // External API logic remains the same
      const books = await externalBibleAPI.getBooks(bibleId);
      setAvailableBooks(books);
    }
  } catch (error) {
    handleBibleLoadError(error, bibleId);
  }
};

// New method for loading user-uploaded Bibles
const loadUserBibleBooks = async (bibleId: string): Promise<{
  success: boolean;
  books?: BibleBook[];
  error?: string;
}>;
```

### 3. Error Handling Service

```typescript
interface BibleError {
  type: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
  suggestions?: string[];
}

class BibleErrorHandler {
  handleParseError(error: Error, fileName: string): BibleError;
  handleValidationError(issues: string[]): BibleError;
  displayUserFriendlyError(error: BibleError): void;
}
```

## Data Models

### Enhanced Bible Data Structure

```typescript
interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
  chapters: BibleChapter[];
  metadata?: {
    testament?: 'OLD' | 'NEW';
    category?: string;
    originalName?: string;
  };
}

interface BibleChapter {
  id: string;
  number: string;
  reference: string;
  verses: Record<string, string>;
  metadata?: {
    title?: string;
    summary?: string;
  };
}

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: { name: string };
  parsedContent?: ParsedBibleData;
  source: 'EXTERNAL' | 'USER_UPLOAD';
  uploadDate?: string;
  fileSize?: number;
}
```

## Error Handling

### Error Categories and Responses

1. **XML Syntax Errors**
   - Detection: DOMParser returns `parsererror` elements
   - Response: "Invalid XML format. Please check your file syntax."
   - Action: Reject file, suggest XML validation tools

2. **Unrecognized Structure Errors**
   - Detection: No books found after all parsing attempts
   - Response: "No Bible content found. Supported formats: XMLBIBLE, OSIS, generic XML."
   - Action: Log structure for debugging, provide format examples

3. **Partial Parse Errors**
   - Detection: Some books/chapters parsed successfully, others failed
   - Response: "Bible loaded with warnings. X books found, Y chapters may be missing."
   - Action: Load successfully parsed content, log warnings

4. **Memory/Performance Errors**
   - Detection: File too large or parsing takes too long
   - Response: "File too large to process. Please try a smaller file."
   - Action: Implement file size limits and parsing timeouts

### Error Recovery Strategies

```typescript
const parseWithFallback = (xmlText: string): BibleParseResult => {
  const strategies = [
    () => parseXMLBibleFormat(xmlDoc),
    () => parseOSISFormat(xmlDoc),
    () => parseGenericFormat(xmlDoc),
    () => parseAsPlainText(xmlText)
  ];
  
  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result.length > 0) {
        return { success: true, data: { books: result } };
      }
    } catch (error) {
      console.warn('Parse strategy failed:', error);
    }
  }
  
  return { 
    success: false, 
    error: 'Unable to parse Bible content with any known format' 
  };
};
```

## Testing Strategy

### Unit Tests
- XML parser functions for each supported format
- Error handling for malformed XML
- Data transformation and validation
- Edge cases (empty files, single verse files, etc.)

### Integration Tests
- File upload flow with various XML formats
- Bible version selection and book loading
- Error display and user feedback
- Performance with large XML files

### Test Data
- Sample XML files for each supported format (XMLBIBLE, OSIS, generic)
- Malformed XML files for error testing
- Large XML files for performance testing
- Edge case files (single book, single chapter, etc.)

## Implementation Phases

### Phase 1: Core XML Parser
- Implement `XMLBibleParser` class
- Add comprehensive error handling
- Support for XMLBIBLE and OSIS formats
- Basic validation and sanitization

### Phase 2: Integration and Error Handling
- Enhance `loadBooks` method with proper validation
- Implement `BibleErrorHandler` class
- Add user-friendly error messages
- Improve logging and debugging

### Phase 3: Advanced Features
- Support for additional XML formats
- Performance optimizations for large files
- Metadata extraction and display
- File format detection and suggestions

### Phase 4: Testing and Polish
- Comprehensive test suite
- Performance benchmarking
- User experience improvements
- Documentation and examples