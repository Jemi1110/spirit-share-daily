// Enhanced Simple EPUB Parser that extracts real content from CONTENTS section
import JSZip from 'jszip';
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

// Legacy interface for backward compatibility
export interface SimpleEpubContent {
  title: string;
  author: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
}

export class SimpleEpubParser extends EnhancedEpubParser {
  private currentFile: File | null = null;
  private currentZip: JSZip | null = null;
  private currentOpfPath: string | null = null;
  /**
   * Enhanced EPUB parsing using CONTENTS section
   */
  async parseEpub(file: File, options?: Partial<ChapterParsingOptions>): Promise<ClassifiedEpubContent> {
    const startTime = Date.now();
    this.currentFile = file;
    
    try {
      
      // Load the EPUB as a ZIP file
      const zip = await JSZip.loadAsync(file);
      this.currentZip = zip;
      
      // Find the OPF file (contains metadata and manifest)
      const opfPath = await this.findOpfFile(zip);
      this.currentOpfPath = opfPath;
      
      // Parse metadata using enhanced format
      const metadata = await this.parseEnhancedMetadata(zip, opfPath);
      
      // Use CONTENTS parser to get chapter structure
      const contentsResult = await contentsParser.parseContentsFromFile(file);
      
      // Extract full content for all chapters (no limits)
      const chaptersWithContent = await this.extractAllChapterContent(
        zip, 
        opfPath, 
        contentsResult.chapters,
        options
      );
      
      // Merge results with CONTENTS structure
      const classifiedContent = this.mergeWithContentsResults(
        chaptersWithContent,
        contentsResult,
        metadata
      );
      
      const parseTime = Date.now() - startTime;
      
      return classifiedContent;
    } catch (error) {
      console.error('SimpleEpubParser: Enhanced parsing failed:', error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async parseEpubFile(file: File): Promise<SimpleEpubContent> {
    const classifiedContent = await this.parseEpub(file);
    
    // Convert to legacy format
    return {
      title: classifiedContent.metadata.title,
      author: classifiedContent.metadata.author,
      chapters: classifiedContent.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        content: chapter.content || '',
        order: chapter.order
      }))
    };
  }

  private async findOpfFile(zip: JSZip): Promise<string> {
    // Check META-INF/container.xml for OPF path
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerContent = await containerFile.async('text');
      const opfMatch = containerContent.match(/full-path="([^"]+)"/);
      if (opfMatch) {
        return opfMatch[1];
      }
    }

    // Fallback: look for .opf files
    const opfFiles = Object.keys(zip.files).filter(name => name.endsWith('.opf'));
    if (opfFiles.length > 0) {
      return opfFiles[0];
    }

    throw new Error('Could not find OPF file in EPUB');
  }

  /**
   * Parse enhanced metadata from OPF file
   */
  private async parseEnhancedMetadata(zip: JSZip, opfPath: string): Promise<EnhancedEpubMetadata> {
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfContent, 'text/xml');

    const getMetadataValue = (selector: string): string => {
      const element = opfDoc.querySelector(selector);
      return element?.textContent?.trim() || '';
    };

    const getMultipleMetadataValues = (selector: string): string[] => {
      const elements = opfDoc.querySelectorAll(selector);
      return Array.from(elements).map(el => el.textContent?.trim() || '').filter(text => text.length > 0);
    };

    return {
      title: getMetadataValue('title') || 'Unknown Title',
      author: getMetadataValue('creator') || getMetadataValue('author') || 'Unknown Author',
      description: getMetadataValue('description') || '',
      language: getMetadataValue('language') || 'en',
      publisher: getMetadataValue('publisher') || '',
      isbn: getMetadataValue('identifier[scheme="ISBN"]') || getMetadataValue('identifier'),
      publicationDate: getMetadataValue('date') || '',
      subjects: getMultipleMetadataValues('subject')
    };
  }

  /**
   * Extract complete content for all chapters (no artificial limits)
   */
  private async extractAllChapterContent(
    zip: JSZip, 
    opfPath: string, 
    chapters: EnhancedEpubChapter[],
    options?: Partial<ChapterParsingOptions>
  ): Promise<EnhancedEpubChapter[]> {
    const mergedOptions = { ...this.defaultParsingOptions, ...options };
    const contentPath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    const chaptersWithContent: EnhancedEpubChapter[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      try {
        const chapterPath = contentPath + chapter.href;
        const chapterFile = zip.file(chapterPath);
        
        if (!chapterFile) {
          console.warn(`SimpleEpubParser: Chapter file not found: ${chapterPath}`);
          // Keep chapter but mark as having no content
          chaptersWithContent.push({
            ...chapter,
            hasRealContent: false,
            content: '',
            contentLength: 0
          });
          continue;
        }

        const chapterContent = await chapterFile.async('text');
        const chapterDoc = new DOMParser().parseFromString(chapterContent, 'text/html');
        
        // Extract and improve title if needed
        const improvedTitle = this.extractImprovedTitle(chapterDoc, chapter.title);
        
        // Extract complete content (no truncation unless specified)
        const { htmlContent, textContent } = this.extractCompleteContent(
          chapterDoc, 
          mergedOptions
        );

        const wordCount = this.countWords(textContent);
        
        
        chaptersWithContent.push({
          ...chapter,
          title: improvedTitle,
          originalTitle: chapter.title,
          content: textContent,
          contentLength: textContent.length,
          hasRealContent: textContent.length > 0
        });

      } catch (error) {
        console.error(`SimpleEpubParser: Error parsing chapter ${chapter.href}:`, error);
        // Keep chapter but mark as having error
        chaptersWithContent.push({
          ...chapter,
          hasRealContent: false,
          content: `Error loading chapter: ${error.message}`,
          contentLength: 0
        });
      }
    }

    return chaptersWithContent;
  }

  /**
   * Extract improved title from chapter content
   */
  private extractImprovedTitle(doc: Document, fallbackTitle: string): string {
    // Method 1: Look for headings in the content
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of headings) {
      const headingText = heading.textContent?.trim();
      if (headingText && headingText.length > 0 && headingText.length < 200) {
        return headingText;
      }
    }
    
    // Method 2: Look for title tag
    const titleElement = doc.querySelector('title');
    if (titleElement) {
      const titleText = titleElement.textContent?.trim();
      if (titleText && titleText.length > 0) {
        return titleText;
      }
    }
    
    // Method 3: Look for elements with title-like classes
    const titleElements = doc.querySelectorAll('.title, .chapter-title, .chapter-name, .heading');
    for (const element of titleElements) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 200) {
        return text;
      }
    }
    
    // Method 4: Look for first strong/bold text that might be a title
    const strongElements = doc.querySelectorAll('strong, b');
    for (const element of strongElements) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        return text;
      }
    }
    
    return fallbackTitle;
  }

  /**
   * Extract complete content without truncation
   */
  private extractCompleteContent(
    doc: Document, 
    options: ChapterParsingOptions
  ): { htmlContent: string; textContent: string } {
    const bodyElement = doc.querySelector('body') || doc.documentElement;
    
    if (!bodyElement) {
      return { htmlContent: '', textContent: '' };
    }

    // Clone to avoid modifying original
    const workingElement = bodyElement.cloneNode(true) as Element;
    
    // Remove unwanted elements
    const unwantedElements = workingElement.querySelectorAll(
      'script, style, nav, header, footer, .navigation, .nav, .toc, .table-of-contents'
    );
    unwantedElements.forEach(el => el.remove());
    
    // Get HTML content
    let htmlContent = workingElement.innerHTML;
    if (options.preserveFormatting) {
      htmlContent = this.cleanChapterContent(htmlContent);
    }
    
    // Extract text content
    let textContent = '';
    
    if (options.extractFullContent) {
      // Get all meaningful text content
      const paragraphs = workingElement.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
      const textParts: string[] = [];
      
      for (const element of paragraphs) {
        const text = element.textContent?.trim();
        if (text && text.length > 10) { // Include substantial text
          textParts.push(text);
        }
      }
      
      if (textParts.length > 0) {
        textContent = textParts.join('\n\n');
      } else {
        // Fallback to all text content
        textContent = workingElement.textContent || '';
      }
    } else {
      textContent = workingElement.textContent || '';
    }
    
    // Clean up whitespace
    textContent = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    // Apply length limit only if specified (no default truncation)
    if (options.maxContentLength && textContent.length > options.maxContentLength) {
      textContent = textContent.substring(0, options.maxContentLength) + 
        '\n\n[Content truncated - full content available in original EPUB]';
    }
    
    return { htmlContent, textContent };
  }

  /**
   * Render specific chapter content
   */
  async renderChapter(chapterId: string, options?: Partial<ChapterParsingOptions>): Promise<ChapterContent> {
    if (!this.currentZip || !this.currentOpfPath) {
      throw new Error('No EPUB file loaded');
    }

    // This would need to be implemented to find and render a specific chapter
    // For now, throw an error indicating it needs the full parsed content
    throw new Error('renderChapter requires full EPUB parsing first - use parseEpub() then access chapter content');
  }
}

// Export instances for both legacy and enhanced usage
export const simpleEpubParser = new SimpleEpubParser();
export const enhancedSimpleEpubParser = new SimpleEpubParser();