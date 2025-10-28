# Design Document

## Overview

This design document outlines a comprehensive highlighting and commenting system similar to Glose app. The system will allow users to highlight text, add various types of comments (text, audio, emoji), and engage in social reading through collaborative annotations. The design focuses on seamless integration with the existing reading experience while providing rich interaction capabilities.

## Architecture

The highlighting and commenting system will be built as an overlay on top of the existing GloseScrollReader component, using a combination of DOM manipulation for text selection, React state management for data, and real-time synchronization for collaborative features.

### Component Architecture

```
CollaborativeReader
├── GloseScrollReader (existing)
├── HighlightOverlay (new)
│   ├── TextSelectionHandler
│   ├── HighlightRenderer
│   └── CommentPopup
├── CommentsPanel (enhanced)
│   ├── CommentsList
│   ├── HighlightsList
│   └── CommentComposer
└── HighlightToolbar (new)
    ├── ColorPicker
    ├── CommentTypeSelector
    └── AudioRecorder
```

## Components and Interfaces

### Enhanced Data Models

#### Highlight Interface (Enhanced)
```typescript
interface Highlight {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  color: string;
  chapterNumber: number;
  textRange: {
    startOffset: number;
    endOffset: number;
    startContainer: string; // CSS selector or unique identifier
    endContainer: string;
  };
  position: { x: number; y: number }; // For popup positioning
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}
```

#### Comment Interface (Enhanced)
```typescript
interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content?: string; // For text comments
  audioUrl?: string; // For audio comments
  audioBlob?: Blob; // For local audio before upload
  type: 'text' | 'audio' | 'emoji';
  emoji?: string; // For emoji reactions
  chapterNumber: number;
  timestamp: string;
  reactions: Reaction[];
  isEditing?: boolean; // For inline editing
}
```

#### Text Selection State
```typescript
interface TextSelection {
  isActive: boolean;
  selectedText: string;
  range: Range | null;
  boundingRect: DOMRect | null;
  chapterNumber: number;
}
```

### New Components

#### 1. HighlightOverlay Component
**Purpose**: Manages text selection, highlight rendering, and popup interactions
**Key Features**:
- Detects text selection events
- Renders highlight overlays on selected text
- Shows/hides comment popups
- Handles highlight color application

#### 2. TextSelectionHandler Component
**Purpose**: Handles all text selection logic and events
**Key Features**:
- Mouse/touch selection detection
- Selection validation (ensure it's within readable content)
- Selection range calculation and storage
- Integration with highlight creation

#### 3. CommentPopup Component
**Purpose**: Floating popup for adding/viewing comments on highlights
**Key Features**:
- Positioned relative to highlight or selection
- Multiple comment types (text, audio, emoji)
- Real-time comment display
- User attribution and timestamps

#### 4. HighlightRenderer Component
**Purpose**: Renders highlight overlays on text content
**Key Features**:
- CSS-based highlight rendering
- Multiple highlight colors
- Overlap handling for multiple highlights
- Click detection for comment viewing

#### 5. AudioCommentRecorder Component
**Purpose**: Records and manages audio comments
**Key Features**:
- Web Audio API integration
- Recording controls (start, stop, pause)
- Audio playback preview
- Audio file upload/storage

## Data Models

### Highlight Colors
```typescript
const HIGHLIGHT_COLORS = {
  yellow: '#fff3cd',
  green: '#d4edda', 
  blue: '#cce5ff',
  pink: '#f8d7da',
  purple: '#e2d9f3',
  orange: '#ffeaa7'
};
```

### Comment Types
```typescript
type CommentType = 'text' | 'audio' | 'emoji';

const EMOJI_REACTIONS = [
  '❤️', '🙏', '💡', '👍', '😊', '🤔', '✨', '🔥', 
  '📖', '💭', '🎯', '⭐', '🔖', '💫', '🌟', '✍️'
];
```

## User Interface Design

### Highlight Creation Flow
1. **Text Selection**: User selects text by dragging
2. **Selection Popup**: Small popup appears with highlight options
3. **Color Selection**: User chooses highlight color
4. **Highlight Applied**: Text is highlighted with chosen color
5. **Comment Option**: User can immediately add a comment or skip

### Comment Creation Flow
1. **Highlight Click**: User clicks on existing highlight
2. **Comment Popup**: Popup shows existing comments and add option
3. **Type Selection**: User chooses comment type (text/audio/emoji)
4. **Content Creation**: User creates the comment content
5. **Submit**: Comment is added and synced with other users

### Comments Panel Layout
```
┌─────────────────────────────────┐
│ Comments & Highlights           │
├─────────────────────────────────┤
│ 📖 Chapter 3: The Journey       │
│                                 │
│ 💛 "This is important text"     │
│ 👤 John Doe - 2 min ago         │
│ 💬 Great insight! I agree       │
│ 🎵 [Audio comment - 0:15]       │
│ ❤️ 👍 💡 (3 reactions)          │
│                                 │
│ 💚 "Another highlighted text"   │
│ 👤 Jane Smith - 5 min ago       │
│ 😊 Love this part!              │
│                                 │
└─────────────────────────────────┘
```

## Technical Implementation

### Text Selection Detection
```typescript
const handleTextSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setTextSelection({
      isActive: true,
      selectedText: selection.toString(),
      range: range,
      boundingRect: rect,
      chapterNumber: getCurrentChapter(range)
    });
  }
};
```

### Highlight Rendering
```typescript
const renderHighlight = (highlight: Highlight) => {
  // Create highlight spans around the selected text
  const range = recreateRangeFromHighlight(highlight);
  const span = document.createElement('span');
  span.className = `highlight highlight-${highlight.color}`;
  span.dataset.highlightId = highlight.id;
  span.dataset.userId = highlight.userId;
  
  try {
    range.surroundContents(span);
  } catch (e) {
    // Handle complex selections that span multiple elements
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
};
```

### Real-time Synchronization
```typescript
const syncHighlight = (highlight: Highlight) => {
  // Send to other participants via WebSocket or similar
  if (collaborativeSession) {
    websocket.send({
      type: 'highlight_created',
      data: highlight,
      sessionId: collaborativeSession.id
    });
  }
};
```

## Error Handling

### Text Selection Edge Cases
1. **Cross-element Selection**: Handle selections that span multiple DOM elements
2. **Invalid Selections**: Prevent highlighting of UI elements, only content text
3. **Overlapping Highlights**: Manage multiple highlights on the same text
4. **Dynamic Content**: Handle highlights when content changes or reflows

### Audio Recording Issues
1. **Microphone Permissions**: Handle denied microphone access gracefully
2. **Recording Failures**: Provide fallback options when recording fails
3. **File Size Limits**: Compress or limit audio recording length
4. **Browser Compatibility**: Fallback for browsers without Web Audio API

### Collaborative Conflicts
1. **Simultaneous Highlights**: Handle multiple users highlighting same text
2. **Comment Ordering**: Ensure consistent comment ordering across users
3. **User Disconnection**: Handle highlights/comments from disconnected users
4. **Data Synchronization**: Resolve conflicts when users create overlapping content

## Performance Considerations

### Highlight Rendering Optimization
- Use CSS transforms for highlight positioning
- Implement virtual scrolling for large numbers of highlights
- Debounce text selection events to prevent excessive processing
- Cache highlight positions to avoid recalculation

### Memory Management
- Clean up event listeners when components unmount
- Limit the number of stored audio blobs in memory
- Implement pagination for comments in long reading sessions
- Use weak references for DOM element associations

## Accessibility

### Screen Reader Support
- Provide alt text for highlight colors
- Announce when highlights are created or selected
- Ensure keyboard navigation for all highlight interactions
- Provide text alternatives for audio comments

### Keyboard Navigation
- Tab navigation through highlights
- Keyboard shortcuts for common actions (Ctrl+H for highlight)
- Arrow key navigation in comments panel
- Enter/Space for activating highlight actions

## Security Considerations

### Content Validation
- Sanitize all text comments to prevent XSS
- Validate audio file types and sizes
- Ensure highlights only apply to legitimate content areas
- Rate limiting for comment/highlight creation

### User Privacy
- Allow users to make highlights private vs. public
- Provide options to delete personal data
- Secure audio file storage and transmission
- User consent for microphone access