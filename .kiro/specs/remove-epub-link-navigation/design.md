# Design Document

## Overview

This design document outlines the complete removal of interactive link functionality from EPUB content processing. The solution involves modifying the content cleaning process in the EPUB reader to strip all anchor tags while preserving the text content, ensuring no clickable elements remain that could cause unwanted navigation.

## Architecture

The link removal will be implemented at the content processing level in the EPUB reader service, specifically in the `simpleEpubReader.ts` file where HTML content is cleaned and processed before being displayed to the user.

### Current Processing Flow
1. EPUB file is loaded and parsed
2. Chapter HTML content is extracted
3. Content goes through cleaning process (removes scripts, styles, comments)
4. Cleaned content is passed to the UI components
5. UI renders the content with potential links still active

### New Processing Flow
1. EPUB file is loaded and parsed
2. Chapter HTML content is extracted
3. Content goes through enhanced cleaning process:
   - Remove scripts, styles, comments (existing)
   - **NEW: Remove all anchor tags while preserving text content**
4. Link-free content is passed to the UI components
5. UI renders completely non-interactive content

## Components and Interfaces

### Modified Components

#### SimpleEpubReader (`src/services/simpleEpubReader.ts`)
- **Method**: `extractChapterContent(doc: Document): string`
- **Enhancement**: Add link removal to the existing HTML cleaning process
- **Location**: In the content cleaning section where other unwanted elements are removed

### Processing Logic

The link removal will be implemented using regex patterns that:
1. Remove all opening anchor tags (`<a>`, `<a href="...">`, etc.)
2. Remove all closing anchor tags (`</a>`)
3. Preserve all text content that was inside the anchor tags
4. Handle nested or malformed anchor tags gracefully

## Data Models

No changes to existing data models are required. The `SimpleChapter` interface remains unchanged:

```typescript
interface SimpleChapter {
  id: string;
  title: string;
  content: string;  // This content will now be link-free
  order: number;
  wordCount: number;
}
```

## Error Handling

### Edge Cases Handled
1. **Nested anchor tags**: Multiple regex passes ensure all anchor tags are removed
2. **Malformed HTML**: Regex patterns handle incomplete or broken anchor tags
3. **Mixed content**: Links with images, spans, or other nested elements are processed correctly
4. **Empty links**: Anchor tags with no content are removed without leaving artifacts

### Fallback Strategy
If the regex processing fails for any reason, the content will still be displayed but may contain some residual links. This is acceptable as it maintains functionality while the issue is resolved.

## Testing Strategy

### Unit Testing Approach
1. **Input Validation**: Test with various HTML content containing different types of links
2. **Output Verification**: Ensure all anchor tags are removed while text content is preserved
3. **Edge Case Testing**: Test with malformed HTML, nested tags, and complex link structures
4. **Performance Testing**: Verify that the additional regex processing doesn't significantly impact load times

### Test Cases
1. Simple links: `<a href="chapter2.html">Next Chapter</a>` → `Next Chapter`
2. Links with attributes: `<a href="#section1" class="internal">Section 1</a>` → `Section 1`
3. Nested content: `<a href="..."><strong>Bold Link</strong></a>` → `<strong>Bold Link</strong>`
4. Multiple links in paragraph: Mixed text with multiple links should have all links removed
5. Empty links: `<a href="..."></a>` → (completely removed)
6. Malformed links: `<a href="...">Text without closing tag` → `Text without closing tag`

### Integration Testing
1. **Full EPUB Processing**: Load complete EPUB files and verify no interactive links remain
2. **UI Interaction**: Confirm that clicking on former link text produces no navigation
3. **Chapter Navigation**: Ensure table of contents and chapter navigation still work properly
4. **Content Integrity**: Verify that removing links doesn't break content formatting or readability

## Implementation Details

### Regex Patterns
```javascript
// Remove all opening anchor tags (with any attributes)
.replace(/<a[^>]*>/gi, '')

// Remove all closing anchor tags
.replace(/<\/a>/gi, '')
```

### Processing Order
The link removal will be added to the existing content cleaning pipeline:

```javascript
// Clean up the HTML content AND REMOVE ALL LINKS
let cleanedContent = bodyContent
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
  .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
  .replace(/<a[^>]*>/gi, '') // Remove all <a> opening tags
  .replace(/<\/a>/gi, '') // Remove all </a> closing tags
  .replace(/\s+/g, ' ') // Normalize whitespace
  .trim();
```

### Performance Considerations
- Regex operations are lightweight and won't significantly impact processing time
- Processing happens during EPUB loading, not during reading, so user experience is unaffected
- The additional regex patterns add minimal overhead to existing content cleaning

## Security Considerations

### Benefits
1. **Prevents Unintended Navigation**: Users cannot accidentally navigate away from their reading position
2. **Eliminates External Links**: No risk of users being directed to external websites
3. **Removes Potential XSS Vectors**: Anchor tags can sometimes be used for XSS attacks

### Validation
- The regex patterns are safe and cannot introduce security vulnerabilities
- No user input is processed through these patterns
- Content sanitization is enhanced, not reduced

## Backward Compatibility

This change is fully backward compatible:
- Existing EPUB files will continue to work
- No changes to the API or data structures
- UI components receive the same data format
- User experience is improved (no accidental navigation)

## Future Enhancements

### Potential Improvements
1. **Configurable Link Handling**: Option to convert internal links to chapter navigation
2. **Link Preservation for References**: Keep footnote or reference links but disable navigation
3. **Visual Indicators**: Add styling to show where links used to be for reference

### Monitoring
- Track user feedback about the reading experience
- Monitor for any content formatting issues caused by link removal
- Assess if any legitimate navigation functionality was lost