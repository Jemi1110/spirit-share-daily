// Enhanced EPUB Types for CONTENTS-based chapter navigation
// Unified interfaces for both simple and advanced EPUB parsers

/**
 * Enhanced chapter interface with classification and visibility
 */
export interface EnhancedEpubChapter {
  id: string;
  title: string;
  href: string;
  order: number;
  type: 'chapter' | 'auxiliary' | 'metadata';
  isVisible: boolean; // Whether to show in navigation
  contentLength?: number;
  hasRealContent?: boolean;
  content?: string; // Full chapter content (for simple parser)
  originalTitle?: string; // Original title before cleaning
}

/**
 * Enhanced metadata interface
 */
export interface EnhancedEpubMetadata {
  title: string;
  author: string;
  description?: string;
  language?: string;
  publisher?: string;
  cover?: string;
  isbn?: string;
  publicationDate?: string;
  subjects?: string[];
}

/**
 * Chapter hierarchy for organized navigation
 */
export interface ChapterHierarchy {
  parts: ChapterPart[];
  flatChapters: EnhancedEpubChapter[];
  hasHierarchy: boolean;
}

/**
 * Chapter part/section for books with multiple parts
 */
export interface ChapterPart {
  title: string;
  chapters: EnhancedEpubChapter[];
  order: number;
  type: 'part' | 'section' | 'volume';
}

/**
 * Complete classified EPUB content structure
 */
export interface ClassifiedEpubContent {
  metadata: EnhancedEpubMetadata;
  chapters: EnhancedEpubChapter[]; // Only real chapters
  auxiliaryContent: EnhancedEpubChapter[]; // CONTENTS, ACKNOWLEDGMENTS, etc.
  totalRealChapters: number;
  totalAllItems: number;
  navigationStructure: ChapterHierarchy;
  parseMethod: 'contents-section' | 'toc-navigation' | 'spine-fallback';
  contentsFound: boolean;
  book?: any; // epub.js book instance (if available)
}

/**
 * Chapter content with full text and metadata
 */
export interface ChapterContent {
  chapter: EnhancedEpubChapter;
  htmlContent: string;
  textContent: string;
  wordCount: number;
  readingTimeMinutes: number;
  hasImages: boolean;
  images: ChapterImage[];
}

/**
 * Image information within chapters
 */
export interface ChapterImage {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/**
 * Navigation state for chapter progression
 */
export interface ChapterNavigationState {
  currentChapter: EnhancedEpubChapter;
  currentIndex: number;
  totalChapters: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextChapter?: EnhancedEpubChapter;
  previousChapter?: EnhancedEpubChapter;
  progress: number; // 0-100 percentage through book
}

/**
 * User preferences for chapter display
 */
export interface ChapterDisplayPreferences {
  showAuxiliaryContent: boolean;
  showChapterNumbers: boolean;
  groupByParts: boolean;
  sortOrder: 'original' | 'alphabetical' | 'custom';
  hideEmptyChapters: boolean;
}

/**
 * Chapter parsing options
 */
export interface ChapterParsingOptions {
  extractFullContent: boolean;
  preserveFormatting: boolean;
  includeImages: boolean;
  maxContentLength?: number; // null = no limit
  skipAuxiliaryContent: boolean;
  validateContent: boolean;
}

/**
 * EPUB parsing result with detailed information
 */
export interface EpubParsingResult {
  success: boolean;
  content?: ClassifiedEpubContent;
  error?: string;
  warnings: string[];
  parseTime: number;
  fileSize: number;
  epubVersion?: string;
  compressionRatio?: number;
}

/**
 * Chapter validation result
 */
export interface ChapterValidationResult {
  isValid: boolean;
  hasContent: boolean;
  contentLength: number;
  issues: ChapterIssue[];
  suggestions: string[];
}

/**
 * Issues found during chapter validation
 */
export interface ChapterIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  code: string;
  chapter?: string;
}

/**
 * Reading session state
 */
export interface ReadingSession {
  documentId: string;
  userId: string;
  currentChapter: string;
  currentPosition: number; // Position within chapter (0-1)
  totalProgress: number; // Progress through entire book (0-1)
  lastReadAt: Date;
  readingTimeMinutes: number;
  chaptersCompleted: string[];
  bookmarks: ReadingBookmark[];
  notes: ReadingNote[];
}

/**
 * Reading bookmark
 */
export interface ReadingBookmark {
  id: string;
  chapterId: string;
  position: number;
  text: string;
  note?: string;
  createdAt: Date;
}

/**
 * Reading note/annotation
 */
export interface ReadingNote {
  id: string;
  chapterId: string;
  position: number;
  selectedText: string;
  note: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type guards for runtime type checking
 */
export const isEnhancedEpubChapter = (obj: any): obj is EnhancedEpubChapter => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.href === 'string' &&
    typeof obj.order === 'number' &&
    ['chapter', 'auxiliary', 'metadata'].includes(obj.type) &&
    typeof obj.isVisible === 'boolean';
};

export const isClassifiedEpubContent = (obj: any): obj is ClassifiedEpubContent => {
  return obj &&
    obj.metadata &&
    Array.isArray(obj.chapters) &&
    Array.isArray(obj.auxiliaryContent) &&
    typeof obj.totalRealChapters === 'number' &&
    obj.navigationStructure;
};

/**
 * Utility functions for chapter operations
 */
export class ChapterUtils {
  /**
   * Filter chapters to show only visible ones
   */
  static getVisibleChapters(chapters: EnhancedEpubChapter[]): EnhancedEpubChapter[] {
    return chapters.filter(chapter => chapter.isVisible);
  }

  /**
   * Get real chapters (excluding auxiliary content)
   */
  static getRealChapters(chapters: EnhancedEpubChapter[]): EnhancedEpubChapter[] {
    return chapters.filter(chapter => chapter.type === 'chapter');
  }

  /**
   * Get auxiliary content
   */
  static getAuxiliaryContent(chapters: EnhancedEpubChapter[]): EnhancedEpubChapter[] {
    return chapters.filter(chapter => chapter.type === 'auxiliary');
  }

  /**
   * Sort chapters by order
   */
  static sortChaptersByOrder(chapters: EnhancedEpubChapter[]): EnhancedEpubChapter[] {
    return [...chapters].sort((a, b) => a.order - b.order);
  }

  /**
   * Find chapter by ID
   */
  static findChapterById(chapters: EnhancedEpubChapter[], id: string): EnhancedEpubChapter | undefined {
    return chapters.find(chapter => chapter.id === id);
  }

  /**
   * Get next chapter in sequence
   */
  static getNextChapter(chapters: EnhancedEpubChapter[], currentId: string): EnhancedEpubChapter | undefined {
    const sortedChapters = this.sortChaptersByOrder(this.getVisibleChapters(chapters));
    const currentIndex = sortedChapters.findIndex(chapter => chapter.id === currentId);
    return currentIndex >= 0 && currentIndex < sortedChapters.length - 1 
      ? sortedChapters[currentIndex + 1] 
      : undefined;
  }

  /**
   * Get previous chapter in sequence
   */
  static getPreviousChapter(chapters: EnhancedEpubChapter[], currentId: string): EnhancedEpubChapter | undefined {
    const sortedChapters = this.sortChaptersByOrder(this.getVisibleChapters(chapters));
    const currentIndex = sortedChapters.findIndex(chapter => chapter.id === currentId);
    return currentIndex > 0 
      ? sortedChapters[currentIndex - 1] 
      : undefined;
  }

  /**
   * Calculate reading progress
   */
  static calculateProgress(chapters: EnhancedEpubChapter[], currentChapterId: string): number {
    const visibleChapters = this.getVisibleChapters(chapters);
    const currentIndex = visibleChapters.findIndex(chapter => chapter.id === currentChapterId);
    return currentIndex >= 0 ? ((currentIndex + 1) / visibleChapters.length) * 100 : 0;
  }

  /**
   * Generate navigation state
   */
  static generateNavigationState(
    chapters: EnhancedEpubChapter[], 
    currentChapterId: string
  ): ChapterNavigationState | null {
    const currentChapter = this.findChapterById(chapters, currentChapterId);
    if (!currentChapter) return null;

    const visibleChapters = this.getVisibleChapters(chapters);
    const currentIndex = visibleChapters.findIndex(chapter => chapter.id === currentChapterId);
    
    return {
      currentChapter,
      currentIndex,
      totalChapters: visibleChapters.length,
      hasNext: currentIndex < visibleChapters.length - 1,
      hasPrevious: currentIndex > 0,
      nextChapter: this.getNextChapter(chapters, currentChapterId),
      previousChapter: this.getPreviousChapter(chapters, currentChapterId),
      progress: this.calculateProgress(chapters, currentChapterId)
    };
  }

  /**
   * Estimate reading time based on word count
   */
  static estimateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Clean chapter title for display
   */
  static cleanChapterTitle(title: string): string {
    return title
      .trim()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
      .replace(/^Chapter\s+\d+:?\s*/i, '') // Remove "Chapter X: "
      .replace(/^Part\s+\d+:?\s*/i, '') // Remove "Part X: "
      .trim();
  }

  /**
   * Format chapter title for display
   */
  static formatChapterTitle(chapter: EnhancedEpubChapter, showNumbers: boolean = true): string {
    if (showNumbers && chapter.order) {
      return `${chapter.order}. ${chapter.title}`;
    }
    return chapter.title;
  }
}