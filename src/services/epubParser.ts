// Enhanced EPUB Reader Service using epub.js with CONTENTS-based navigation
import ePub from 'epubjs';
import { 
  ClassifiedEpubContent, 
  EnhancedEpubChapter, 
  EnhancedEpubMetadata,
  ChapterContent,
  ChapterParsingOptions,
  EpubParsingResult
} from './epubTypes';
import { EnhancedEpubParser } from './enhancedEpubParser';
import { contentsParser, ContentsParseResult } from './contentsParser';

// Legacy interfaces for backward compatibility
export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  order: number;
}

export interface EpubMetadata {
  title: string;
  author: string;
  description?: string;
  language?: string;
  publisher?: string;
  cover?: string;
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  totalChapters: number;
  book: any; // The epub.js book instance
}

class EpubReader extends EnhancedEpubParser {
  private book: any = null;
  private currentFile: File | null = null;

  /**
   * Enhanced EPUB parsing using CONTENTS section with epub.js
   */
  async parseEpub(file: File, options?: Partial<ChapterParsingOptions>): Promise<ClassifiedEpubContent> {
    const startTime = Date.now();
    this.currentFile = file;
    
    try {
      
      // Create a blob URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Load the EPUB using epub.js
      this.book = ePub(fileUrl);
      
      // Wait for the book to be ready with timeout and error handling
      try {
        await Promise.race([
          this.book.ready,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('EPUB loading timeout')), 15000) // Increased timeout
          )
        ]);
      } catch (readyError) {
        console.warn('EpubReader: Book ready timeout, trying to continue anyway:', readyError);
        // Try to continue even if ready times out - the book might still be partially loaded
      }
      
      // Parse enhanced metadata
      const metadata = await this.parseEnhancedMetadata();
      
      // Use CONTENTS parser to get chapter structure from epub.js book
      const contentsResult = await contentsParser.parseContentsFromEpubJs(this.book);
      
      // If CONTENTS parser didn't find much, try our own epub.js parsing as fallback
      if (!contentsResult.contentsFound || contentsResult.chapters.length === 0) {
        const epubJsChapters = await this.parseEpubJsTableOfContents();
        
        // Convert epub.js chapters to enhanced format
        const enhancedChapters = epubJsChapters.map((chapter, index) => 
          this.convertToEnhancedChapter(chapter, index)
        );
        
        // Merge with empty CONTENTS result
        const fallbackResult: ContentsParseResult = {
          chapters: enhancedChapters,
          totalRealChapters: enhancedChapters.length,
          auxiliaryContent: [],
          contentsFound: false,
          parseMethod: 'toc-navigation'
        };
        
        const classifiedContent = this.mergeWithContentsResults(
          enhancedChapters,
          fallbackResult,
          metadata
        );
        
        classifiedContent.book = this.book;
        
        // Clean up the blob URL
        URL.revokeObjectURL(fileUrl);
        
        const parseTime = Date.now() - startTime;
        
        return classifiedContent;
      }
      
      // Merge CONTENTS results with epub.js book instance
      const classifiedContent = this.mergeWithContentsResults(
        contentsResult.chapters,
        contentsResult,
        metadata
      );
      
      // Add the epub.js book instance for rendering
      classifiedContent.book = this.book;
      
      // Clean up the blob URL
      URL.revokeObjectURL(fileUrl);
      
      const parseTime = Date.now() - startTime;
      
      return classifiedContent;
    } catch (error) {
      console.error('EpubReader: Enhanced parsing failed:', error);
      console.error('EpubReader: Error details:', error.stack);
      throw new Error(`Failed to parse EPUB file with epub.js: ${error.message}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async parseEpubLegacy(file: File): Promise<ParsedEpub> {
    try {
      
      // Use the enhanced parser and convert to legacy format
      const classifiedContent = await this.parseEpub(file);
      
      // Convert enhanced format back to legacy format
      const legacyChapters: EpubChapter[] = classifiedContent.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        href: chapter.href,
        order: chapter.order
      }));
      
      const legacyMetadata: EpubMetadata = {
        title: classifiedContent.metadata.title,
        author: classifiedContent.metadata.author,
        description: classifiedContent.metadata.description,
        language: classifiedContent.metadata.language,
        publisher: classifiedContent.metadata.publisher,
        cover: classifiedContent.metadata.cover
      };
      
      
      return {
        metadata: legacyMetadata,
        chapters: legacyChapters,
        totalChapters: legacyChapters.length,
        book: this.book
      };
    } catch (error) {
      console.error('EpubReader: Legacy parsing failed:', error);
      console.error('EpubReader: Error details:', error.stack);
      throw new Error(`Failed to parse EPUB file: ${error.message}`);
    }
  }

  /**
   * Parse enhanced metadata from epub.js book
   */
  private async parseEnhancedMetadata(): Promise<EnhancedEpubMetadata> {
    if (!this.book) throw new Error('Book not loaded');

    try {
      // Wait a bit for the book to load more data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try multiple ways to access metadata
      let metadata = null;
      
      // Method 1: Try package.metadata
      if (this.book.package?.metadata) {
        metadata = this.book.package.metadata;
      }
      
      // Method 2: Try loaded.metadata
      if (!metadata && this.book.loaded?.metadata) {
        try {
          const loadedMetadata = await this.book.loaded.metadata;
          metadata = loadedMetadata;
        } catch (e) {
          console.warn('EpubReader: Error loading metadata:', e);
        }
      }
      
      // Method 3: Try accessing properties directly
      if (!metadata) {
        metadata = {
          title: this.book.packaging?.metadata?.title || this.book.metadata?.title,
          creator: this.book.packaging?.metadata?.creator || this.book.metadata?.creator,
          description: this.book.packaging?.metadata?.description || this.book.metadata?.description,
          language: this.book.packaging?.metadata?.language || this.book.metadata?.language,
          publisher: this.book.packaging?.metadata?.publisher || this.book.metadata?.publisher
        };
      }
      
      return {
        title: metadata?.title || 'Unknown Title',
        author: metadata?.creator || metadata?.author || 'Unknown Author',
        description: metadata?.description || '',
        language: metadata?.language || 'en',
        publisher: metadata?.publisher || '',
        cover: this.book.cover || undefined,
        isbn: metadata?.identifier || '',
        publicationDate: metadata?.date || '',
        subjects: metadata?.subject ? [metadata.subject] : []
      };
    } catch (error) {
      console.warn('EpubReader: Error accessing metadata:', error);
      return {
        title: 'Unknown Title',
        author: 'Unknown Author',
        description: '',
        language: 'en',
        publisher: '',
        subjects: []
      };
    }
  }

  /**
   * Parse table of contents using epub.js (fallback method)
   */
  private async parseEpubJsTableOfContents(): Promise<EpubChapter[]> {
    if (!this.book) throw new Error('Book not loaded');

    const chapters: EpubChapter[] = [];
    
    // Wait a bit for the book to load more data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Try to load navigation with timeout
      const navigation = await Promise.race([
        this.book.loaded.navigation,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation loading timeout')), 8000) // Increased timeout
        )
      ]);
      
      
      // If we have a proper table of contents
      if (navigation?.toc && navigation.toc.length > 0) {
        navigation.toc.forEach((item: any, index: number) => {
          chapters.push({
            id: item.id || `chapter-${index}`,
            title: item.label || `Chapter ${index + 1}`,
            href: item.href,
            order: index + 1
          });
          
          // Add sub-chapters if they exist
          if (item.subitems && item.subitems.length > 0) {
            item.subitems.forEach((subitem: any, subIndex: number) => {
              chapters.push({
                id: subitem.id || `chapter-${index}-${subIndex}`,
                title: `  ${subitem.label}` || `  Section ${subIndex + 1}`,
                href: subitem.href,
                order: index + 1 + (subIndex + 1) * 0.1
              });
            });
          }
        });
      }
    } catch (navError) {
      console.warn('EpubReader: Error loading navigation, trying spine:', navError);
    }
    
    // Fallback: use spine items if no TOC or navigation failed
    if (chapters.length === 0) {
      try {
        const spine = this.book.spine;
        
        if (spine) {
          // Try different ways to access spine items (NO ARTIFICIAL LIMITS)
          if (spine.each && typeof spine.each === 'function') {
            spine.each((section: any, index: number) => {
              chapters.push({
                id: section.idref || `spine-${index}`,
                title: section.title || `Chapter ${index + 1}`,
                href: section.href || section.url || '',
                order: index + 1
              });
            });
          } else if (spine.spineItems && Array.isArray(spine.spineItems)) {
            spine.spineItems.forEach((section: any, index: number) => {
              chapters.push({
                id: section.idref || `spine-${index}`,
                title: section.title || `Chapter ${index + 1}`,
                href: section.href || section.url || '',
                order: index + 1
              });
            });
          } else if (Array.isArray(spine)) {
            spine.forEach((section: any, index: number) => {
              chapters.push({
                id: section.idref || `spine-${index}`,
                title: section.title || `Chapter ${index + 1}`,
                href: section.href || section.url || '',
                order: index + 1
              });
            });
          }
        }
      } catch (spineError) {
        console.warn('EpubReader: Error accessing spine:', spineError);
      }
    }
    
    // Last resort: create a single chapter if we still have nothing
    if (chapters.length === 0) {
      chapters.push({
        id: 'chapter-1',
        title: 'Chapter 1',
        href: '',
        order: 1
      });
    }
    
    return chapters.sort((a, b) => a.order - b.order);
  }

  /**
   * Render specific chapter content using enhanced interface
   */
  async renderChapter(chapterId: string, options?: Partial<ChapterParsingOptions>): Promise<ChapterContent> {
    if (!this.book) throw new Error('Book not loaded');

    try {
      // Find chapter by ID (this would need to be implemented with full chapter data)
      // For now, assume chapterId is actually the href
      const htmlContent = await this.renderChapterHtml(chapterId);
      const textContent = this.extractTextContent(htmlContent);
      const wordCount = this.countWords(textContent);
      
      return {
        chapter: {
          id: chapterId,
          title: 'Chapter', // Would need to be looked up
          href: chapterId,
          order: 1,
          type: 'chapter',
          isVisible: true,
          hasRealContent: true
        },
        htmlContent,
        textContent,
        wordCount,
        readingTimeMinutes: this.estimateReadingTime(wordCount),
        hasImages: htmlContent.includes('<img'),
        images: [] // Would need to be extracted
      };
    } catch (error) {
      console.error('EpubReader: Error rendering chapter:', error);
      throw error;
    }
  }

  /**
   * Legacy chapter rendering method
   */
  async renderChapterHtml(chapterHref: string): Promise<string> {
    if (!this.book) throw new Error('Book not loaded');

    try {
      // If no href provided, try to get the first section
      if (!chapterHref && this.book.spine) {
        const firstSection = this.book.spine.first();
        if (firstSection) {
          chapterHref = firstSection.href;
        }
      }

      // Get the section by href
      let section;
      try {
        section = this.book.spine.get(chapterHref);
      } catch (spineError) {
        console.warn('EpubReader: Error getting section from spine, trying first section:', spineError);
        section = this.book.spine.first();
      }
      
      if (!section) {
        throw new Error(`Chapter not found: ${chapterHref}`);
      }

      // Load and render the section
      await section.load(this.book.load.bind(this.book));
      const contents = await section.render();
      
      // Extract the HTML content
      const serializer = new XMLSerializer();
      const htmlContent = serializer.serializeToString(contents.documentElement);
      
      return this.cleanChapterContent(htmlContent);
    } catch (error) {
      console.error('EpubReader: Error rendering chapter:', error);
      return `<div class="error-content">
        <h2>Error loading chapter content</h2>
        <p>There was an issue loading this chapter. This might be due to external resources in the EPUB file.</p>
        <p>Chapter: ${chapterHref}</p>
        <p>Error: ${error.message}</p>
      </div>`;
    }
  }

  /**
   * Get the epub.js book instance
   */
  getBookInstance() {
    return this.book;
  }
}

// Export instances for both legacy and enhanced usage
export const epubReader = new EpubReader();
export const enhancedEpubReader = new EpubReader();

// Create a wrapper that maintains the legacy interface
export const legacyEpubReader = {
  async parseEpub(file: File): Promise<ParsedEpub> {
    return epubReader.parseEpubLegacy(file);
  },
  
  async renderChapter(chapterHref: string): Promise<string> {
    return epubReader.renderChapterHtml(chapterHref);
  },
  
  getBookInstance() {
    return epubReader.getBookInstance();
  }
};