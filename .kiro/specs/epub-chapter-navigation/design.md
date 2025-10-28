# Design Document

## Overview

The current EPUB reader implementation has a fundamental issue: it treats all table of contents entries as chapters, including metadata sections like "CONTENTS", "ACKNOWLEDGMENTS", and "PREFACE". This creates a confusing user experience where users see auxiliary content instead of actual book chapters.

The solution involves implementing a smart chapter filtering system that can distinguish between real content chapters and auxiliary sections, similar to how Kindle organizes EPUB content. This will provide users with a clean, intuitive reading experience focused on the actual book content.

## Architecture

### Current Architecture Issues

1. **Artificial Chapter Limits**: Current parser limits chapters to 8 or 10, ignoring the actual book structure
2. **Wrong Content Source**: System treats spine items as chapters instead of using the CONTENTS section
3. **Content Truncation**: Chapter content is artificially limited instead of showing complete text
4. **Incorrect Chapter Counting**: Shows "8 of 8" when book actually has more chapters listed in CONTENTS
5. **Missing CONTENTS Parsing**: No dedicated logic to extract chapter list from the CONTENTS section

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EPUB Chapter Navigator                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   TOC Parser    │  │ Content Filter  │  │ Chapter      │ │
│  │                 │  │                 │  │ Organizer    │ │
│  │ • Extract TOC   │  │ • Identify real │  │ • Sort       │ │
│  │ • Parse spine   │  │   chapters      │  │ • Number     │ │
│  │ • Get metadata  │  │ • Filter aux    │  │ • Validate   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Content         │  │ Chapter         │  │ Navigation   │ │
│  │ Extractor       │  │ Renderer        │  │ Controller   │ │
│  │                 │  │                 │  │              │ │
│  │ • Extract text  │  │ • Format HTML   │  │ • Track pos  │ │
│  │ • Clean markup  │  │ • Apply styles  │  │ • Handle nav │ │
│  │ • Validate      │  │ • Add metadata  │  │ • Persist    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Chapter Interface

```typescript
interface EnhancedEpubChapter {
  id: string;
  title: string;
  href: string;
  order: number;
  type: 'chapter' | 'auxiliary' | 'metadata';
  isVisible: boolean; // Whether to show in navigation
  contentLength: number;
  hasRealContent: boolean;
}
```

### 2. Chapter Classification Service

```typescript
interface ChapterClassifier {
  classifyChapter(tocItem: any, content?: string): ChapterType;
  isAuxiliaryContent(title: string): boolean;
  extractRealChapterTitle(title: string, content: string): string;
  validateChapterContent(content: string): boolean;
}
```

### 3. Smart EPUB Parser

```typescript
interface SmartEpubParser {
  parseWithClassification(file: File): Promise<ClassifiedEpubContent>;
  extractRealChapters(tocItems: any[]): Promise<EnhancedEpubChapter[]>;
  validateChapterStructure(chapters: EnhancedEpubChapter[]): EnhancedEpubChapter[];
}
```

## Data Models

### CONTENTS-Based Chapter Extraction

The system will prioritize the CONTENTS section as the authoritative source:

1. **CONTENTS Section Parsing**:
   - Locate and parse the dedicated CONTENTS/Table of Contents section
   - Extract all chapter titles and references listed there
   - Use CONTENTS as the definitive chapter list, not spine items

2. **Complete Content Extraction**:
   - Extract full chapter content without truncation
   - Preserve original formatting and structure
   - Show complete text as it appears in the original EPUB

3. **Accurate Chapter Counting**:
   - Count chapters based on CONTENTS section entries
   - Remove artificial limits (no more "limit to 10 chapters")
   - Display correct "Chapter X of Y" where Y is the actual total

### Enhanced EPUB Structure

```typescript
interface ClassifiedEpubContent {
  metadata: EpubMetadata;
  chapters: EnhancedEpubChapter[];
  auxiliaryContent: EnhancedEpubChapter[];
  totalRealChapters: number;
  navigationStructure: ChapterHierarchy;
}

interface ChapterHierarchy {
  parts: ChapterPart[];
  flatChapters: EnhancedEpubChapter[];
}

interface ChapterPart {
  title: string;
  chapters: EnhancedEpubChapter[];
  order: number;
}
```

## Error Handling

### Classification Fallbacks

1. **Unknown Content Type**: Default to showing as chapter but mark as uncertain
2. **Empty Chapters**: Filter out or merge with adjacent content
3. **Malformed TOC**: Use spine order as fallback
4. **Missing Content**: Generate placeholder with clear indication

### User Experience

1. **Progressive Loading**: Show basic structure immediately, enhance with classification
2. **User Override**: Allow users to manually show/hide auxiliary content
3. **Clear Indicators**: Mark uncertain classifications for user review
4. **Graceful Degradation**: Fall back to current behavior if classification fails

## Testing Strategy

### Unit Tests

1. **Chapter Classification**:
   - Test auxiliary content detection
   - Test real chapter identification
   - Test edge cases (mixed content, unusual titles)

2. **Content Extraction**:
   - Test HTML cleaning and formatting
   - Test content validation
   - Test chapter ordering

3. **Navigation Logic**:
   - Test chapter progression
   - Test position tracking
   - Test session persistence

### Integration Tests

1. **EPUB Parsing Pipeline**:
   - Test end-to-end parsing with real EPUB files
   - Test different EPUB formats and structures
   - Test error handling and fallbacks

2. **User Interface**:
   - Test chapter navigation UI
   - Test content display and formatting
   - Test collaborative features with new chapter structure

### Test Data

- Sample EPUBs with different TOC structures
- EPUBs with unusual auxiliary content
- EPUBs with nested chapter hierarchies
- Malformed or incomplete EPUB files

## Implementation Phases

### Phase 1: Chapter Classification Engine
- Implement classification rules and heuristics
- Create enhanced chapter interface
- Add content validation logic

### Phase 2: Smart Parser Integration
- Enhance existing parsers with classification
- Implement fallback mechanisms
- Add progressive loading

### Phase 3: Navigation Enhancement
- Update UI to show only real chapters
- Add auxiliary content toggle
- Implement proper chapter progression

### Phase 4: User Experience Polish
- Add loading states and progress indicators
- Implement user preferences for content display
- Add chapter bookmarking and position persistence

## Technical Considerations

### Performance
- Lazy load chapter content to avoid blocking UI
- Cache classification results to avoid re-processing
- Optimize content extraction for large EPUBs

### Compatibility
- Support various EPUB formats (2.0, 3.0, 3.1)
- Handle different TOC structures gracefully
- Maintain backward compatibility with existing documents

### Accessibility
- Ensure proper heading hierarchy in rendered content
- Support screen readers with semantic markup
- Provide keyboard navigation for chapter switching