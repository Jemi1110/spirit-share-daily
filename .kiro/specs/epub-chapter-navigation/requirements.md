# Requirements Document

## Introduction

The EPUB reader currently displays table of contents metadata (like "CONTENTS", "ACKNOWLEDGMENTS") as if they were actual book chapters, creating a confusing reading experience. Users expect to see only real chapter titles and navigate through actual chapter content, similar to how Kindle works. This feature will implement proper EPUB chapter structure parsing to distinguish between real chapters and auxiliary content, providing a clean chapter navigation experience.

## Requirements

### Requirement 1

**User Story:** As a reader, I want to see all actual book chapters listed in the CONTENTS section, so that I can navigate through the complete book structure without artificial limitations.

#### Acceptance Criteria

1. WHEN the EPUB is loaded THEN the system SHALL parse the CONTENTS section to extract the complete list of real chapters
2. WHEN displaying the chapter list THEN the system SHALL show ALL chapters found in the CONTENTS section, not limited to 8 or any arbitrary number
3. WHEN a user clicks on a chapter THEN the system SHALL load the actual chapter content referenced in the CONTENTS section
4. WHEN counting chapters THEN the system SHALL use the actual number of chapters from CONTENTS, not impose artificial limits

### Requirement 2

**User Story:** As a reader, I want to navigate between chapters and see the complete, untruncated content for each chapter, so that I can read the full text without limitations.

#### Acceptance Criteria

1. WHEN I click "next chapter" THEN the system SHALL load the complete content of the next chapter from the CONTENTS list
2. WHEN I click "previous chapter" THEN the system SHALL load the complete content of the previous chapter from the CONTENTS list
3. WHEN displaying chapter content THEN the system SHALL show the full text without truncation or artificial length limits
4. WHEN navigating between chapters THEN each chapter SHALL display its complete unique content, not abbreviated or placeholder text
5. WHEN I select a specific chapter from the navigation THEN the system SHALL jump directly to that chapter's full content

### Requirement 3

**User Story:** As a reader, I want the chapter titles to be properly formatted and meaningful, so that I can understand what each chapter contains.

#### Acceptance Criteria

1. WHEN displaying chapter titles THEN the system SHALL show the actual chapter names from the EPUB metadata
2. WHEN a chapter has both a number and title THEN the system SHALL display both (e.g., "Chapter 1: Introduction")
3. WHEN a chapter only has a title THEN the system SHALL display just the title
4. IF a chapter lacks proper metadata THEN the system SHALL generate a meaningful fallback title

### Requirement 4

**User Story:** As a reader, I want the chapter navigation to work consistently across different EPUB formats, so that I can read any EPUB file with the same experience.

#### Acceptance Criteria

1. WHEN loading EPUBs with different table of contents structures THEN the system SHALL correctly identify chapters regardless of format variations
2. WHEN an EPUB uses nested chapter structures THEN the system SHALL flatten or properly organize the hierarchy for navigation
3. WHEN an EPUB has unusual metadata organization THEN the system SHALL still extract meaningful chapter information
4. IF the EPUB structure cannot be parsed THEN the system SHALL provide a graceful fallback with sequential chapter numbering

### Requirement 5

**User Story:** As a reader, I want to see my current reading position within the complete chapter structure, so that I know where I am in the book.

#### Acceptance Criteria

1. WHEN reading a chapter THEN the system SHALL highlight the current chapter in the navigation menu
2. WHEN displaying chapter information THEN the system SHALL show "Chapter X of Y" format using the actual total from CONTENTS
3. WHEN I'm reading THEN the system SHALL persist my current chapter position across sessions
4. WHEN I return to the book THEN the system SHALL automatically load the last chapter I was reading
5. WHEN showing chapter count THEN the system SHALL display the correct total number of chapters from the CONTENTS section