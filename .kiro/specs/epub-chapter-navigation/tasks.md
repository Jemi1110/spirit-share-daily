# Implementation Plan

- [x] 1. Create CONTENTS section parser service
  - Implement ContentsParser class to locate and parse the CONTENTS/Table of Contents section
  - Add logic to extract all chapter titles and references from CONTENTS
  - Create chapter list extraction that uses CONTENTS as authoritative source
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Enhance EPUB chapter interface and types
  - Create EnhancedEpubChapter interface with type classification and visibility flags
  - Add ClassifiedEpubContent interface for structured EPUB data
  - Implement ChapterHierarchy types for organized navigation structure
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 3. Update simple EPUB parser to use CONTENTS section
  - Modify SimpleEpubParser to extract chapters from CONTENTS section instead of spine
  - Remove artificial chapter limits (currently limited to 10 chapters)
  - Implement complete content extraction without truncation
  - _Requirements: 1.2, 1.4, 2.3, 2.4_

- [x] 4. Update advanced EPUB parser to use CONTENTS section
  - Enhance epubParser.ts to parse CONTENTS section for chapter list
  - Remove artificial limits and show all chapters found in CONTENTS
  - Add fallback mechanisms when CONTENTS section is not found
  - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.3_

- [x] 5. Implement chapter navigation controller
  - Create navigation logic that shows all chapters from CONTENTS section
  - Add chapter progression through the complete chapter list
  - Implement correct chapter counting and position tracking (X of Y format)
  - _Requirements: 2.1, 2.2, 5.1, 5.3, 5.5_

- [x] 6. Update CollaborativeReader with CONTENTS-based chapter handling
  - Modify chapter loading logic to use chapters from CONTENTS section
  - Update chapter navigation UI to show correct chapter count and titles
  - Implement complete chapter content rendering without truncation
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 5.2, 5.5_

- [x] 7. Add auxiliary content toggle feature
  - Create UI toggle to show/hide auxiliary content when desired
  - Implement user preference storage for auxiliary content visibility
  - Add clear indicators for auxiliary vs. real chapter content
  - _Requirements: 1.3, 4.2_

- [ ] 8. Implement progressive loading and error handling
  - Add loading states during chapter classification and content extraction
  - Implement graceful fallbacks when classification fails
  - Create user-friendly error messages for parsing issues
  - _Requirements: 4.4, 5.4_

- [ ]* 9. Add comprehensive testing for CONTENTS parsing
  - Write unit tests for ContentsParser to verify complete chapter extraction
  - Create integration tests for EPUB parsing with different CONTENTS structures
  - Add test cases for EPUBs with varying numbers of chapters
  - _Requirements: 1.1, 1.2, 1.4, 4.1, 4.3_

- [ ]* 10. Performance optimization and caching
  - Implement chapter classification result caching
  - Add lazy loading for chapter content to improve initial load time
  - Optimize content extraction for large EPUB files
  - _Requirements: 2.2, 2.3_