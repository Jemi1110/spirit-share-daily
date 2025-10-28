// CONTENTS Section Parser Service
// Extracts chapter information from the CONTENTS/Table of Contents section of EPUB files

import JSZip from 'jszip';
import { 
  EnhancedEpubChapter, 
  ClassifiedEpubContent, 
  ChapterHierarchy,
  ChapterParsingOptions 
} from './epubTypes';

export interface ContentsParseResult {
  chapters: EnhancedEpubChapter[];
  totalRealChapters: number;
  auxiliaryContent: EnhancedEpubChapter[];
  contentsFound: boolean;
  parseMethod: 'contents-section' | 'toc-navigation' | 'spine-fallback';
}

export class ContentsParser {
  private auxiliaryKeywords = [
    'contents', 'table of contents', 'toc',
    'acknowledgments', 'acknowledgements', 'acknowledgment',
    'preface', 'foreword', 
    'index', 'bibliography', 'references', 'notes',
    'about the author', 'about this book',
    'copyright', 'legal', 'disclaimer',
    'appendix', 'glossary', 'resources',
    'dedication', 'epigraph'
  ];

  /**
   * Parse EPUB file and extract chapters from CONTENTS section
   */
  async parseContentsFromFile(file: File): Promise<ContentsParseResult> {
    try {
      console.log('ContentsParser: Starting CONTENTS parsing for:', file.name);
      
      const zip = await JSZip.loadAsync(file);
      const opfPath = await this.findOpfFile(zip);
      
      // Try multiple methods to find chapters
      let result = await this.parseFromContentsSection(zip, opfPath);
      
      if (!result.contentsFound) {
        console.log('ContentsParser: CONTENTS section not found, trying TOC navigation');
        result = await this.parseFromTocNavigation(zip, opfPath);
      }
      
      if (result.chapters.length === 0) {
        console.log('ContentsParser: No chapters found, using spine fallback');
        result = await this.parseFromSpineFallback(zip, opfPath);
      }
      
      // Classify chapters and filter auxiliary content
      result = this.classifyAndFilterChapters(result);
      
      console.log(`ContentsParser: Found ${result.totalRealChapters} real chapters, ${result.auxiliaryContent.length} auxiliary items`);
      
      return result;
    } catch (error) {
      console.error('ContentsParser: Error parsing CONTENTS:', error);
      throw error;
    }
  }

  /**
   * Parse chapters from epub.js book instance
   */
  async parseContentsFromEpubJs(book: any): Promise<ContentsParseResult> {
    try {
      console.log('ContentsParser: Parsing from epub.js book instance');
      
      let result: ContentsParseResult = {
        chapters: [],
        totalRealChapters: 0,
        auxiliaryContent: [],
        contentsFound: false,
        parseMethod: 'toc-navigation'
      };

      // Try to get navigation/TOC from epub.js
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for book to load
        
        const navigation = await Promise.race([
          book.loaded.navigation,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Navigation timeout')), 5000)
          )
        ]);

        if (navigation?.toc && navigation.toc.length > 0) {
          console.log('ContentsParser: Found TOC with', navigation.toc.length, 'items');
          
          navigation.toc.forEach((item: any, index: number) => {
            result.chapters.push({
              id: item.id || `toc-${index}`,
              title: item.label || `Chapter ${index + 1}`,
              href: item.href || '',
              order: index + 1,
              type: 'chapter', // Will be classified later
              isVisible: true,
              hasRealContent: true
            });

            // Add sub-items if they exist
            if (item.subitems && item.subitems.length > 0) {
              item.subitems.forEach((subitem: any, subIndex: number) => {
                result.chapters.push({
                  id: subitem.id || `toc-${index}-${subIndex}`,
                  title: subitem.label || `Section ${subIndex + 1}`,
                  href: subitem.href || '',
                  order: index + 1 + (subIndex + 1) * 0.1,
                  type: 'chapter',
                  isVisible: true,
                  hasRealContent: true
                });
              });
            }
          });
          
          result.contentsFound = true;
        }
      } catch (navError) {
        console.warn('ContentsParser: Navigation parsing failed:', navError);
      }

      // Fallback to spine if no TOC found OR if we only found 1 chapter (likely incomplete)
      if (result.chapters.length <= 1) {
        console.log(`ContentsParser: Using spine fallback for epub.js (found ${result.chapters.length} chapters, need more)`);
        result.parseMethod = 'spine-fallback';
        result.chapters = []; // Clear the incomplete results
        
        try {
          const spine = book.spine;
          console.log('ContentsParser: Spine object:', spine);
          
          if (spine) {
            // Try different ways to access spine items
            if (spine.each && typeof spine.each === 'function') {
              console.log('ContentsParser: Using spine.each method');
              spine.each((section: any, index: number) => {
                console.log(`ContentsParser: Spine section ${index}:`, section);
                result.chapters.push({
                  id: section.idref || `spine-${index}`,
                  title: section.title || `Chapter ${index + 1}`,
                  href: section.href || section.url || '',
                  order: index + 1,
                  type: 'chapter',
                  isVisible: true,
                  hasRealContent: true
                });
              });
            } else if (spine.spineItems && Array.isArray(spine.spineItems)) {
              console.log(`ContentsParser: Using spine.spineItems array with ${spine.spineItems.length} items`);
              spine.spineItems.forEach((section: any, index: number) => {
                console.log(`ContentsParser: Spine item ${index}:`, section);
                result.chapters.push({
                  id: section.idref || `spine-${index}`,
                  title: section.title || `Chapter ${index + 1}`,
                  href: section.href || section.url || '',
                  order: index + 1,
                  type: 'chapter',
                  isVisible: true,
                  hasRealContent: true
                });
              });
            } else if (Array.isArray(spine)) {
              console.log(`ContentsParser: Spine is an array with ${spine.length} items`);
              spine.forEach((section: any, index: number) => {
                result.chapters.push({
                  id: section.idref || `spine-${index}`,
                  title: section.title || `Chapter ${index + 1}`,
                  href: section.href || section.url || '',
                  order: index + 1,
                  type: 'chapter',
                  isVisible: true,
                  hasRealContent: true
                });
              });
            }
          }
          
          console.log(`ContentsParser: Spine fallback found ${result.chapters.length} chapters`);
        } catch (spineError) {
          console.warn('ContentsParser: Spine parsing failed:', spineError);
        }
      }

      // Classify and filter chapters
      result = this.classifyAndFilterChapters(result);
      
      return result;
    } catch (error) {
      console.error('ContentsParser: Error parsing from epub.js:', error);
      throw error;
    }
  }

  /**
   * Method 1: Look for dedicated CONTENTS section
   */
  private async parseFromContentsSection(zip: JSZip, opfPath: string): Promise<ContentsParseResult> {
    const result: ContentsParseResult = {
      chapters: [],
      totalRealChapters: 0,
      auxiliaryContent: [],
      contentsFound: false,
      parseMethod: 'contents-section'
    };

    try {
      // Look for files that might contain the table of contents
      const possibleContentsFiles = Object.keys(zip.files).filter(filename => {
        const name = filename.toLowerCase();
        return (
          name.includes('contents') ||
          name.includes('toc') ||
          name.includes('table') ||
          (name.includes('nav') && name.includes('.html')) ||
          (name.includes('nav') && name.includes('.xhtml'))
        );
      });

      console.log('ContentsParser: Found possible CONTENTS files:', possibleContentsFiles);

      for (const filename of possibleContentsFiles) {
        const file = zip.file(filename);
        if (!file) continue;

        const content = await file.async('text');
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // Look for chapter links in the CONTENTS section
        const links = doc.querySelectorAll('a[href]');
        let chapterIndex = 0;

        for (const link of links) {
          const href = link.getAttribute('href');
          const title = link.textContent?.trim();
          
          if (href && title && title.length > 0) {
            // Skip if it's clearly a navigation link (back to contents, etc.)
            if (this.isNavigationLink(title)) continue;
            
            // Skip if it's auxiliary content (including CONTENTS itself)
            if (this.isAuxiliaryContent(title)) {
              console.log(`ContentsParser: Skipping auxiliary content: "${title}"`);
              continue;
            }
            
            // Additional check: must look like a real chapter
            if (!this.looksLikeRealChapter(title)) {
              console.log(`ContentsParser: Skipping non-chapter content: "${title}"`);
              continue;
            }
            
            // Only add if it looks like real chapter content
            result.chapters.push({
              id: `contents-${chapterIndex}`,
              title: title,
              href: href,
              order: chapterIndex + 1,
              type: 'chapter',
              isVisible: true,
              hasRealContent: true
            });
            
            chapterIndex++;
            console.log(`ContentsParser: Added real chapter: "${title}"`);
          }
        }

        if (result.chapters.length > 0) {
          result.contentsFound = true;
          console.log(`ContentsParser: Found ${result.chapters.length} chapters in CONTENTS section`);
          break;
        }
      }
    } catch (error) {
      console.warn('ContentsParser: Error parsing CONTENTS section:', error);
    }

    return result;
  }

  /**
   * Method 2: Parse from NCX or navigation document
   */
  private async parseFromTocNavigation(zip: JSZip, opfPath: string): Promise<ContentsParseResult> {
    const result: ContentsParseResult = {
      chapters: [],
      totalRealChapters: 0,
      auxiliaryContent: [],
      contentsFound: false,
      parseMethod: 'toc-navigation'
    };

    try {
      // Find NCX file or navigation document from OPF
      const opfFile = zip.file(opfPath);
      if (!opfFile) return result;

      const opfContent = await opfFile.async('text');
      const parser = new DOMParser();
      const opfDoc = parser.parseFromString(opfContent, 'text/xml');

      // Look for NCX reference
      const ncxRef = opfDoc.querySelector('manifest item[media-type="application/x-dtbncx+xml"]');
      if (ncxRef) {
        const ncxHref = ncxRef.getAttribute('href');
        if (ncxHref) {
          const contentPath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
          const ncxPath = contentPath + ncxHref;
          const ncxFile = zip.file(ncxPath);
          
          if (ncxFile) {
            const ncxContent = await ncxFile.async('text');
            const ncxDoc = parser.parseFromString(ncxContent, 'text/xml');
            
            const navPoints = ncxDoc.querySelectorAll('navPoint');
            navPoints.forEach((navPoint, index) => {
              const navLabel = navPoint.querySelector('navLabel text');
              const content = navPoint.querySelector('content');
              
              if (navLabel && content) {
                const title = navLabel.textContent?.trim();
                const href = content.getAttribute('src');
                
                if (title && href) {
                  result.chapters.push({
                    id: `ncx-${index}`,
                    title: title,
                    href: href,
                    order: index + 1,
                    type: 'chapter',
                    isVisible: true,
                    hasRealContent: true
                  });
                }
              }
            });
            
            if (result.chapters.length > 0) {
              result.contentsFound = true;
              console.log(`ContentsParser: Found ${result.chapters.length} chapters in NCX`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('ContentsParser: Error parsing TOC navigation:', error);
    }

    return result;
  }

  /**
   * Method 3: Fallback to spine items (but without artificial limits)
   */
  private async parseFromSpineFallback(zip: JSZip, opfPath: string): Promise<ContentsParseResult> {
    const result: ContentsParseResult = {
      chapters: [],
      totalRealChapters: 0,
      auxiliaryContent: [],
      contentsFound: false,
      parseMethod: 'spine-fallback'
    };

    try {
      const opfFile = zip.file(opfPath);
      if (!opfFile) return result;

      const opfContent = await opfFile.async('text');
      const parser = new DOMParser();
      const opfDoc = parser.parseFromString(opfContent, 'text/xml');
      
      const contentPath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
      
      // Get ALL spine items (no artificial limit)
      const spineItems = Array.from(opfDoc.querySelectorAll('spine itemref'));
      console.log(`ContentsParser: Found ${spineItems.length} spine items (no limit applied)`);

      for (let i = 0; i < spineItems.length; i++) {
        const itemref = spineItems[i];
        const idref = itemref.getAttribute('idref');
        
        if (!idref) continue;

        // Find the corresponding manifest item
        const manifestItem = opfDoc.querySelector(`manifest item[id="${idref}"]`);
        if (!manifestItem) continue;

        const href = manifestItem.getAttribute('href');
        if (!href) continue;

        // Try to extract a meaningful title from the content
        let title = `Chapter ${i + 1}`;
        
        try {
          const chapterPath = contentPath + href;
          const chapterFile = zip.file(chapterPath);
          
          if (chapterFile) {
            const chapterContent = await chapterFile.async('text');
            const chapterDoc = parser.parseFromString(chapterContent, 'text/html');
            
            // Extract title from content
            const extractedTitle = this.extractTitleFromContent(chapterDoc);
            if (extractedTitle) {
              title = extractedTitle;
            }
          }
        } catch (error) {
          console.warn(`ContentsParser: Error extracting title for ${href}:`, error);
        }

        result.chapters.push({
          id: idref,
          title: title,
          href: href,
          order: i + 1,
          type: 'chapter',
          isVisible: true,
          hasRealContent: true
        });
      }

      console.log(`ContentsParser: Created ${result.chapters.length} chapters from spine`);
    } catch (error) {
      console.warn('ContentsParser: Error parsing spine fallback:', error);
    }

    return result;
  }

  /**
   * Classify chapters as real content vs auxiliary content
   */
  private classifyAndFilterChapters(result: ContentsParseResult): ContentsParseResult {
    const realChapters: EnhancedEpubChapter[] = [];
    const auxiliaryContent: EnhancedEpubChapter[] = [];

    console.log(`ContentsParser: Classifying ${result.chapters.length} chapters`);

    for (const chapter of result.chapters) {
      const isAuxiliary = this.isAuxiliaryContent(chapter.title);
      
      console.log(`ContentsParser: Chapter "${chapter.title}" -> ${isAuxiliary ? 'AUXILIARY' : 'REAL CHAPTER'}`);
      
      if (isAuxiliary) {
        chapter.type = 'auxiliary';
        chapter.isVisible = false; // Hide auxiliary content by default
        auxiliaryContent.push(chapter);
      } else {
        chapter.type = 'chapter';
        chapter.isVisible = true;
        realChapters.push(chapter);
      }
    }

    console.log(`ContentsParser: Classification result: ${realChapters.length} real chapters, ${auxiliaryContent.length} auxiliary`);

    // If we have very few real chapters, be less aggressive about filtering
    if (realChapters.length <= 1 && result.chapters.length > 1) {
      console.log('ContentsParser: Too few real chapters found, treating all as real chapters');
      return {
        ...result,
        chapters: result.chapters.map(ch => ({ ...ch, type: 'chapter', isVisible: true })),
        auxiliaryContent: [],
        totalRealChapters: result.chapters.length
      };
    }

    return {
      ...result,
      chapters: realChapters,
      auxiliaryContent: auxiliaryContent,
      totalRealChapters: realChapters.length
    };
  }

  /**
   * Check if a title indicates auxiliary content
   */
  private isAuxiliaryContent(title: string): boolean {
    const normalizedTitle = title.toLowerCase().trim();
    
    // Exact matches for common auxiliary content
    const exactMatches = [
      'contents', 'table of contents', 'toc', 'índice', 'contenido',
      'acknowledgments', 'acknowledgements', 'agradecimientos',
      'preface', 'prólogo', 'prefacio', 'foreword',
      'index', 'bibliography', 'references', 'notas',
      'about the author', 'sobre el autor', 'acerca del autor',
      'copyright', 'derechos', 'legal',
      'dedication', 'dedicatoria'
    ];
    
    // Check exact matches first
    if (exactMatches.includes(normalizedTitle)) {
      return true;
    }
    
    // Check if it contains auxiliary keywords
    return this.auxiliaryKeywords.some(keyword => 
      normalizedTitle.includes(keyword) ||
      normalizedTitle.startsWith(keyword + ' ') ||
      normalizedTitle.endsWith(' ' + keyword)
    );
  }

  /**
   * Check if a link is just navigation (not a chapter)
   */
  private isNavigationLink(title: string): boolean {
    const navKeywords = ['back', 'return', 'home', 'menu', 'navigation', 'nav'];
    const normalizedTitle = title.toLowerCase().trim();
    
    return navKeywords.some(keyword => normalizedTitle.includes(keyword));
  }

  /**
   * Check if a title looks like a real chapter (not auxiliary content)
   */
  private looksLikeRealChapter(title: string): boolean {
    const normalizedTitle = title.toLowerCase().trim();
    
    // Patterns that indicate real chapters
    const chapterPatterns = [
      /^chapter\s+\d+/i,           // "Chapter 1", "Chapter 2", etc.
      /^capítulo\s+\d+/i,          // "Capítulo 1", "Capítulo 2", etc.
      /^cap\.\s*\d+/i,             // "Cap. 1", "Cap. 2", etc.
      /^\d+\./,                    // "1.", "2.", etc.
      /^part\s+\d+/i,              // "Part 1", "Part 2", etc.
      /^parte\s+\d+/i,             // "Parte 1", "Parte 2", etc.
    ];
    
    // Check if it matches chapter patterns
    if (chapterPatterns.some(pattern => pattern.test(normalizedTitle))) {
      return true;
    }
    
    // If it's longer than 3 characters and doesn't contain auxiliary keywords, likely a chapter
    if (normalizedTitle.length > 3 && !this.isAuxiliaryContent(title)) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract meaningful title from chapter content
   */
  private extractTitleFromContent(doc: Document): string | null {
    // Method 1: Look for headings
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of headings) {
      const headingText = heading.textContent?.trim();
      if (headingText && headingText.length > 0 && headingText.length < 100) {
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
    
    // Method 3: Look for first strong/bold text that might be a title
    const strongElements = doc.querySelectorAll('strong, b, .title, .chapter-title');
    for (const element of strongElements) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        return text;
      }
    }
    
    return null;
  }

  /**
   * Find OPF file in EPUB
   */
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
}

export const contentsParser = new ContentsParser();