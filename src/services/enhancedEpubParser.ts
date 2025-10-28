// Enhanced EPUB Parser Interface
// Unified interface for both simple and advanced EPUB parsing with CONTENTS-based navigation

import { 
  ClassifiedEpubContent, 
  EnhancedEpubChapter, 
  EnhancedEpubMetadata,
  ChapterContent,
  ChapterParsingOptions,
  EpubParsingResult,
  ChapterNavigationState,
  ChapterUtils
} from './epubTypes';
import { contentsParser, ContentsParseResult } from './contentsParser';

/**
 * Enhanced EPUB Parser that unifies simple and advanced parsing
 * with CONTENTS-based chapter navigation
 */
export abstract class EnhancedEpubParser {
  protected defaultParsingOptions: ChapterParsingOptions = {
    extractFullContent: true,
    preserveFormatting: true,
    includeImages: true,
    maxContentLength: null, // No limit by default
    skipAuxiliaryContent: false,
    validateContent: true
  };

  /**
   * Parse EPUB file and return classified content
   */
  abstract parseEpub(file: File, options?: Partial<ChapterParsingOptions>): Promise<ClassifiedEpubContent>;

  /**
   * Render specific chapter content
   */
  abstract renderChapter(chapterId: string, options?: Partial<ChapterParsingOptions>): Promise<ChapterContent>;

  /**
   * Get navigation state for current chapter
   */
  getNavigationState(content: ClassifiedEpubContent, currentChapterId: string): ChapterNavigationState | null {
    return ChapterUtils.generateNavigationState(content.chapters, currentChapterId);
  }

  /**
   * Get next chapter in reading order
   */
  getNextChapter(content: ClassifiedEpubContent, currentChapterId: string): EnhancedEpubChapter | undefined {
    return ChapterUtils.getNextChapter(content.chapters, currentChapterId);
  }

  /**
   * Get previous chapter in reading order
   */
  getPreviousChapter(content: ClassifiedEpubContent, currentChapterId: string): EnhancedEpubChapter | undefined {
    return ChapterUtils.getPreviousChapter(content.chapters, currentChapterId);
  }

  /**
   * Calculate reading progress
   */
  calculateProgress(content: ClassifiedEpubContent, currentChapterId: string): number {
    return ChapterUtils.calculateProgress(content.chapters, currentChapterId);
  }

  /**
   * Get all visible chapters (excluding auxiliary content if hidden)
   */
  getVisibleChapters(content: ClassifiedEpubContent, showAuxiliary: boolean = false): EnhancedEpubChapter[] {
    const chapters = showAuxiliary 
      ? [...content.chapters, ...content.auxiliaryContent]
      : content.chapters;
    
    return ChapterUtils.getVisibleChapters(chapters);
  }

  /**
   * Search chapters by title or content
   */
  searchChapters(content: ClassifiedEpubContent, query: string): EnhancedEpubChapter[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return [];

    return content.chapters.filter(chapter => 
      chapter.title.toLowerCase().includes(searchTerm) ||
      (chapter.content && chapter.content.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Validate EPUB structure and content
   */
  validateEpub(content: ClassifiedEpubContent): EpubParsingResult {
    const warnings: string[] = [];
    let success = true;

    // Check if we have any real chapters
    if (content.totalRealChapters === 0) {
      warnings.push('No real chapters found - only auxiliary content detected');
      success = false;
    }

    // Check if chapters have content
    const emptyChapters = content.chapters.filter(chapter => !chapter.hasRealContent);
    if (emptyChapters.length > 0) {
      warnings.push(`${emptyChapters.length} chapters appear to be empty`);
    }

    // Check metadata completeness
    if (!content.metadata.title || content.metadata.title === 'Unknown Title') {
      warnings.push('Book title is missing or unknown');
    }

    if (!content.metadata.author || content.metadata.author === 'Unknown Author') {
      warnings.push('Book author is missing or unknown');
    }

    // Check if CONTENTS section was found
    if (!content.contentsFound) {
      warnings.push('CONTENTS section not found - using fallback parsing method');
    }

    return {
      success,
      content,
      warnings,
      parseTime: 0, // Will be set by implementing classes
      fileSize: 0, // Will be set by implementing classes
    };
  }

  /**
   * Convert legacy chapter format to enhanced format
   */
  protected convertToEnhancedChapter(
    legacyChapter: any, 
    index: number,
    type: 'chapter' | 'auxiliary' | 'metadata' = 'chapter'
  ): EnhancedEpubChapter {
    return {
      id: legacyChapter.id || `chapter-${index}`,
      title: legacyChapter.title || `Chapter ${index + 1}`,
      href: legacyChapter.href || '',
      order: legacyChapter.order || index + 1,
      type,
      isVisible: type === 'chapter',
      contentLength: legacyChapter.content?.length || 0,
      hasRealContent: !!(legacyChapter.content && legacyChapter.content.length > 0),
      content: legacyChapter.content,
      originalTitle: legacyChapter.title
    };
  }

  /**
   * Convert legacy metadata to enhanced format
   */
  protected convertToEnhancedMetadata(legacyMetadata: any): EnhancedEpubMetadata {
    return {
      title: legacyMetadata.title || 'Unknown Title',
      author: legacyMetadata.author || legacyMetadata.creator || 'Unknown Author',
      description: legacyMetadata.description || '',
      language: legacyMetadata.language || 'en',
      publisher: legacyMetadata.publisher || '',
      cover: legacyMetadata.cover,
      isbn: legacyMetadata.isbn,
      publicationDate: legacyMetadata.publicationDate || legacyMetadata.date,
      subjects: legacyMetadata.subjects || []
    };
  }

  /**
   * Merge CONTENTS parsing results with existing chapters
   */
  protected mergeWithContentsResults(
    existingChapters: EnhancedEpubChapter[],
    contentsResult: ContentsParseResult,
    metadata: EnhancedEpubMetadata
  ): ClassifiedEpubContent {
    // Use CONTENTS results if found, otherwise use existing chapters
    const chapters = contentsResult.contentsFound && contentsResult.chapters.length > 0
      ? contentsResult.chapters
      : existingChapters;

    return {
      metadata,
      chapters: ChapterUtils.getRealChapters(chapters),
      auxiliaryContent: contentsResult.auxiliaryContent,
      totalRealChapters: contentsResult.totalRealChapters || ChapterUtils.getRealChapters(chapters).length,
      totalAllItems: chapters.length + contentsResult.auxiliaryContent.length,
      navigationStructure: {
        parts: [], // Will be implemented in future if needed
        flatChapters: chapters,
        hasHierarchy: false
      },
      parseMethod: contentsResult.parseMethod,
      contentsFound: contentsResult.contentsFound
    };
  }

  /**
   * Clean and format chapter content for display
   */
  protected cleanChapterContent(htmlContent: string): string {
    return htmlContent
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/xmlns[^=]*="[^"]*"/gi, '')
      .replace(/xml:[^=]*="[^"]*"/gi, '')
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .trim();
  }

  /**
   * Extract text content from HTML
   */
  protected extractTextContent(htmlContent: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Remove unwanted elements
    const unwantedElements = doc.querySelectorAll('script, style, nav, header, footer, .navigation, .nav');
    unwantedElements.forEach(el => el.remove());
    
    return doc.body?.textContent || doc.documentElement?.textContent || '';
  }

  /**
   * Count words in text content
   */
  protected countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimate reading time
   */
  protected estimateReadingTime(wordCount: number): number {
    return ChapterUtils.estimateReadingTime(wordCount);
  }
}

/**
 * Factory function to create appropriate parser based on requirements
 */
export class EpubParserFactory {
  /**
   * Create parser instance based on requirements
   */
  static createParser(preferAdvanced: boolean = true): EnhancedEpubParser {
    // This will be implemented when we update the individual parsers
    throw new Error('Parser creation will be implemented in next tasks');
  }

  /**
   * Detect best parser for given file
   */
  static async detectBestParser(file: File): Promise<'simple' | 'advanced'> {
    // Simple heuristics for now - can be enhanced later
    if (file.size > 50 * 1024 * 1024) { // > 50MB
      return 'simple'; // Large files might have issues with epub.js
    }
    
    return 'advanced'; // Default to advanced parser
  }
}