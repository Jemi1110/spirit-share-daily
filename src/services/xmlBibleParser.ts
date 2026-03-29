// XML Bible Parser Service
// Handles parsing of various XML Bible formats (XMLBIBLE, OSIS, generic XML)

import { getSpanishBookName, getSpanishAbbreviation } from "./bibleBookNames";

export interface BibleParseResult {
  success: boolean;
  data?: ParsedBibleData;
  error?: string;
  warnings?: string[];
  metadata?: {
    format: 'XMLBIBLE' | 'OSIS' | 'GENERIC' | 'UNKNOWN';
    booksFound: number;
    chaptersFound: number;
    versesFound: number;
  };
}

export interface ParsedBibleData {
  books: BibleBook[];
  metadata?: {
    title?: string;
    version?: string;
    language?: string;
  };
}

export interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
  chapters: BibleChapter[];
  metadata?: {
    testament?: 'OLD' | 'NEW';
    category?: string;
    originalName?: string;
  };
}

export interface BibleChapter {
  id: string;
  number: string;
  reference: string;
  verses: Record<string, string>;
  metadata?: {
    title?: string;
    summary?: string;
  };
}

export interface BibleError {
  type: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
  suggestions?: string[];
}

export class XMLBibleParser {
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Main method to parse XML Bible content
   */
  parseXMLBible(xmlText: string): BibleParseResult {
    try {
      // Validate input
      if (!xmlText || xmlText.trim().length === 0) {
        return {
          success: false,
          error: 'Empty XML content provided'
        };
      }

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      if (!this.validateXMLStructure(xmlDoc)) {
        return {
          success: false,
          error: 'Invalid XML format. Please check your file syntax.'
        };
      }

      this.log('XML Root element:', xmlDoc.documentElement.tagName);
      this.log('Available elements:', Array.from(xmlDoc.documentElement.children).map(el => el.tagName));

      // Try different parsing strategies
      const parseStrategies = [
        { name: 'XMLBIBLE', parser: () => this.parseXMLBibleFormat(xmlDoc) },
        { name: 'OSIS', parser: () => this.parseOSISFormat(xmlDoc) },
        { name: 'GENERIC', parser: () => this.parseGenericFormat(xmlDoc) }
      ];

      for (const strategy of parseStrategies) {
        try {
          this.log(`Trying ${strategy.name} format...`);
          const books = strategy.parser();
          
          if (books && books.length > 0) {
            const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
            const totalVerses = books.reduce((sum, book) => 
              sum + book.chapters.reduce((chapterSum, chapter) => 
                chapterSum + Object.keys(chapter.verses).length, 0), 0);

            this.log(`Successfully parsed ${books.length} books, ${totalChapters} chapters, ${totalVerses} verses using ${strategy.name} format`);

            return {
              success: true,
              data: { books },
              metadata: {
                format: strategy.name as any,
                booksFound: books.length,
                chaptersFound: totalChapters,
                versesFound: totalVerses
              }
            };
          }
        } catch (error) {
          this.log(`${strategy.name} parsing failed:`, error);
        }
      }

      return {
        success: false,
        error: 'Unable to parse Bible content with any known format. Supported formats: XMLBIBLE, OSIS, generic XML.'
      };

    } catch (error) {
      return {
        success: false,
        error: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate XML structure and check for parsing errors
   */
  private validateXMLStructure(xmlDoc: Document): boolean {
    // Check for XML parsing errors
    const parseErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parseErrors.length > 0) {
      this.log('XML parsing errors found:', parseErrors[0].textContent);
      return false;
    }

    // Check if we have a valid root element
    if (!xmlDoc.documentElement) {
      this.log('No root element found in XML');
      return false;
    }

    return true;
  }

  /**
   * Parse XMLBIBLE format (BIBLEBOOK, CHAPTER, VERS elements)
   */
  private parseXMLBibleFormat(xmlDoc: Document): BibleBook[] {
    const books: BibleBook[] = [];
    const xmlBibleBooks = xmlDoc.getElementsByTagName('BIBLEBOOK');

    if (xmlBibleBooks.length === 0) {
      return books; // Not XMLBIBLE format
    }

    for (let i = 0; i < xmlBibleBooks.length; i++) {
      const bookElement = xmlBibleBooks[i];
      const rawBookName = bookElement.getAttribute('bname') || 
                         bookElement.getAttribute('name') || 
                         bookElement.getAttribute('bnumber') ||
                         (i + 1).toString();
      
      // Convert to proper Spanish name
      const bookName = getSpanishBookName(rawBookName);

      const chapters: BibleChapter[] = [];
      const chapterElements = bookElement.getElementsByTagName('CHAPTER');

      for (let j = 0; j < chapterElements.length; j++) {
        const chapterElement = chapterElements[j];
        const chapterNum = chapterElement.getAttribute('cnumber') || (j + 1).toString();

        const verses: Record<string, string> = {};
        const verseElements = chapterElement.getElementsByTagName('VERS');

        for (let k = 0; k < verseElements.length; k++) {
          const verseElement = verseElements[k];
          const verseNum = verseElement.getAttribute('vnumber') || (k + 1).toString();
          const verseText = this.sanitizeText(verseElement.textContent || '');
          
          if (verseText) {
            verses[verseNum] = verseText;
          }
        }

        if (Object.keys(verses).length > 0) {
          chapters.push({
            id: `${this.sanitizeId(bookName)}.${chapterNum}`,
            number: chapterNum,
            reference: `${bookName} ${chapterNum}`,
            verses: verses
          });
        }
      }

      if (chapters.length > 0) {
        books.push({
          id: this.sanitizeId(bookName),
          name: bookName,
          nameLong: bookName,
          abbreviation: getSpanishAbbreviation(bookName),
          chapters: chapters
        });
      }
    }

    return books;
  }

  /**
   * Parse OSIS format (div elements with type="book" and type="chapter")
   */
  private parseOSISFormat(xmlDoc: Document): BibleBook[] {
    const books: BibleBook[] = [];
    const osisBooks = xmlDoc.querySelectorAll('div[type="book"]');

    if (osisBooks.length === 0) {
      return books; // Not OSIS format
    }

    for (let i = 0; i < osisBooks.length; i++) {
      const bookDiv = osisBooks[i];
      const bookOsisID = bookDiv.getAttribute('osisID') || `Book${i + 1}`;
      const bookName = getSpanishBookName(bookOsisID);

      const chapters: BibleChapter[] = [];
      const chapterDivs = bookDiv.querySelectorAll('div[type="chapter"]');

      for (let j = 0; j < chapterDivs.length; j++) {
        const chapterDiv = chapterDivs[j];
        const chapterOsisID = chapterDiv.getAttribute('osisID');
        const chapterNum = chapterOsisID?.split('.')[1] || (j + 1).toString();

        const verses: Record<string, string> = {};
        const verseDivs = chapterDiv.querySelectorAll('verse');

        for (let k = 0; k < verseDivs.length; k++) {
          const verseDiv = verseDivs[k];
          const verseOsisID = verseDiv.getAttribute('osisID');
          const verseNum = verseOsisID?.split('.')[2] || (k + 1).toString();
          const verseText = this.sanitizeText(verseDiv.textContent || '');
          
          if (verseText) {
            verses[verseNum] = verseText;
          }
        }

        if (Object.keys(verses).length > 0) {
          chapters.push({
            id: `${bookOsisID}.${chapterNum}`,
            number: chapterNum,
            reference: `${bookName} ${chapterNum}`,
            verses: verses
          });
        }
      }

      if (chapters.length > 0) {
        books.push({
          id: bookOsisID,
          name: bookName,
          nameLong: bookName,
          abbreviation: getSpanishAbbreviation(bookName),
          chapters: chapters
        });
      }
    }

    return books;
  }

  /**
   * Parse generic XML format as fallback
   */
  private parseGenericFormat(xmlDoc: Document): BibleBook[] {
    const books: BibleBook[] = [];
    
    // Try multiple ways to find book elements
    const bookSelectors = [
      'book', 'Book', 'BOOK', 'BIBLEBOOK',
      '[name]', '[title]', '[bname]'
    ];

    let bookElements: NodeListOf<Element> | null = null;
    
    for (const selector of bookSelectors) {
      bookElements = xmlDoc.querySelectorAll(selector);
      if (bookElements.length > 0) {
        this.log(`Found ${bookElements.length} book elements using selector: ${selector}`);
        break;
      }
    }

    if (!bookElements || bookElements.length === 0) {
      return books; // No recognizable book structure
    }

    for (let i = 0; i < bookElements.length; i++) {
      const bookElement = bookElements[i];
      
      // Try multiple ways to get book name
      let bookName = bookElement.getAttribute('name') || 
                    bookElement.getAttribute('title') || 
                    bookElement.getAttribute('bname') ||
                    bookElement.getAttribute('bnumber');

      // If no attribute, try to find a title element inside
      if (!bookName) {
        const titleElement = bookElement.querySelector('title, name, bookname');
        if (titleElement) {
          bookName = titleElement.textContent?.trim();
        }
      }

      // Convert to proper Spanish name, or use generic name as last resort
      if (!bookName || bookName.length === 0) {
        bookName = getSpanishBookName((i + 1).toString());
      } else {
        bookName = getSpanishBookName(bookName);
      }

      const chapters: BibleChapter[] = [];
      
      // Try multiple ways to find chapter elements
      const chapterSelectors = [
        'chapter', 'Chapter', 'CHAPTER',
        '[cnumber]', '[number]'
      ];

      let chapterElements: NodeListOf<Element> | null = null;
      
      for (const selector of chapterSelectors) {
        chapterElements = bookElement.querySelectorAll(selector);
        if (chapterElements.length > 0) {
          break;
        }
      }

      if (chapterElements && chapterElements.length > 0) {
        for (let j = 0; j < chapterElements.length; j++) {
          const chapterElement = chapterElements[j];
          const chapterNum = chapterElement.getAttribute('number') || 
                            chapterElement.getAttribute('cnumber') ||
                            chapterElement.getAttribute('id') ||
                            (j + 1).toString();

          const verses = this.extractVersesFromChapter(chapterElement, j);

          if (Object.keys(verses).length > 0) {
            chapters.push({
              id: `${this.sanitizeId(bookName)}.${chapterNum}`,
              number: chapterNum,
              reference: `${bookName} ${chapterNum}`,
              verses: verses
            });
          }
        }
      }

      if (chapters.length > 0) {
        books.push({
          id: this.sanitizeId(bookName),
          name: bookName,
          nameLong: bookName,
          abbreviation: getSpanishAbbreviation(bookName),
          chapters: chapters
        });
      }
    }

    return books;
  }

  /**
   * Extract verses from a chapter element using various strategies
   */
  private extractVersesFromChapter(chapterElement: Element, chapterIndex: number): Record<string, string> {
    const verses: Record<string, string> = {};

    // Try to find verse elements
    const verseSelectors = [
      'verse', 'Verse', 'VERS',
      '[vnumber]', '[number]'
    ];

    let verseElements: NodeListOf<Element> | null = null;
    
    for (const selector of verseSelectors) {
      verseElements = chapterElement.querySelectorAll(selector);
      if (verseElements.length > 0) {
        break;
      }
    }

    if (verseElements && verseElements.length > 0) {
      // Parse individual verse elements
      for (let k = 0; k < verseElements.length; k++) {
        const verseElement = verseElements[k];
        const verseNum = verseElement.getAttribute('number') || 
                        verseElement.getAttribute('vnumber') ||
                        verseElement.getAttribute('id') ||
                        (k + 1).toString();
        
        const verseText = this.sanitizeText(verseElement.textContent || '');
        
        if (verseText) {
          verses[verseNum] = verseText;
        }
      }
    } else {
      // No verse tags found, try to parse text content
      const chapterText = chapterElement.textContent || '';
      
      if (chapterText.trim()) {
        // Try to split by verse numbers (1, 2, 3, etc.)
        const verseMatches = chapterText.match(/(\d+)\s+([^0-9]+?)(?=\d+\s+|$)/g);
        
        if (verseMatches && verseMatches.length > 1) {
          verseMatches.forEach(match => {
            const verseMatch = match.match(/^(\d+)\s+(.+)/);
            if (verseMatch) {
              verses[verseMatch[1]] = this.sanitizeText(verseMatch[2]);
            }
          });
        } else {
          // Treat the whole chapter as verse 1
          verses['1'] = this.sanitizeText(chapterText);
        }
      }
    }

    return verses;
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Sanitize ID strings
   */
  private sanitizeId(text: string): string {
    return text.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Generate abbreviation from book name
   */
  private generateAbbreviation(bookName: string): string {
    const words = bookName.split(/\s+/);
    if (words.length === 1) {
      return bookName.substring(0, 3).toUpperCase();
    }
    return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
  }

  /**
   * Logging utility
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
    }
  }
}