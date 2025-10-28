// Simple, Reliable EPUB Reader
// Direct ZIP parsing without external libraries that cause issues

import JSZip from 'jszip';
import { contentsParser } from './contentsParser';

export interface SimpleChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

export interface SimpleEpubBook {
  title: string;
  author: string;
  chapters: SimpleChapter[];
  totalChapters: number;
}

export interface EpubLoadingProgress {
  phase: 'initializing' | 'metadata' | 'structure' | 'first-chapter' | 'background-loading' | 'complete';
  progress: number; // 0-100
  message: string;
  chaptersLoaded: number;
  totalChapters: number;
}

export class SimpleEpubReader {
  private progressCallback?: (progress: EpubLoadingProgress) => void;
  
  async loadEpub(
    file: File, 
    onProgress?: (progress: EpubLoadingProgress) => void
  ): Promise<SimpleEpubBook> {
    this.progressCallback = onProgress;
    console.log('SimpleEpubReader: Starting progressive EPUB loading:', file.name);
    
    try {
      // Phase 1: Initialize
      this.reportProgress('initializing', 5, 'Inicializando archivo EPUB...', 0, 0);
      
      // Load EPUB as ZIP
      const zip = await JSZip.loadAsync(file);
      console.log('SimpleEpubReader: ZIP loaded successfully');
      
      // Phase 2: Parse metadata quickly
      this.reportProgress('metadata', 15, 'Extrayendo información del libro...', 0, 0);
      
      const opfPath = await this.findOpfFile(zip);
      const metadata = await this.parseMetadata(zip, opfPath);
      console.log('SimpleEpubReader: Metadata:', metadata);
      
      // Phase 3: Get chapter structure (fast)
      this.reportProgress('structure', 25, 'Analizando estructura de capítulos...', 0, 0);
      
      const chapterStructure = await this.getChapterStructure(zip, opfPath);
      console.log(`SimpleEpubReader: Found ${chapterStructure.length} chapters`);
      
      // Phase 4: Load first chapter immediately (Glose-style)
      this.reportProgress('first-chapter', 40, 'Cargando primer capítulo...', 0, chapterStructure.length);
      
      let firstChapter: SimpleChapter;
      try {
        firstChapter = await this.extractSingleChapter(zip, opfPath, chapterStructure[0], 0);
      } catch (error) {
        console.error('SimpleEpubReader: Failed to load first chapter, trying fallback:', error);
        
        // If CONTENTS-based loading fails, fall back to spine-based loading
        const fallbackStructure = await this.getSpineBasedStructure(zip, opfPath);
        console.log(`SimpleEpubReader: Fallback to spine-based structure with ${fallbackStructure.length} items`);
        
        if (fallbackStructure.length === 0) {
          throw new Error('No chapters found in EPUB');
        }
        
        firstChapter = await this.extractSingleChapter(zip, opfPath, fallbackStructure[0], 0);
        // Update chapter structure to use fallback
        chapterStructure.length = 0;
        chapterStructure.push(...fallbackStructure);
      }
      
      // Create initial book with just first chapter
      const initialBook: SimpleEpubBook = {
        title: metadata.title,
        author: metadata.author,
        chapters: [firstChapter],
        totalChapters: chapterStructure.length
      };
      
      // Phase 5: Start background loading of remaining chapters
      this.reportProgress('background-loading', 50, 'Cargando capítulos adicionales...', 1, chapterStructure.length);
      
      // Load remaining chapters in background (non-blocking)
      this.loadRemainingChaptersInBackground(zip, opfPath, chapterStructure, initialBook);
      
      return initialBook;
      
    } catch (error) {
      console.error('SimpleEpubReader: Error loading EPUB:', error);
      throw new Error(`Failed to load EPUB: ${error.message}`);
    }
  }

  private reportProgress(phase: EpubLoadingProgress['phase'], progress: number, message: string, loaded: number, total: number) {
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        progress,
        message,
        chaptersLoaded: loaded,
        totalChapters: total
      });
    }
  }

  private async getChapterStructure(zip: JSZip, opfPath: string): Promise<any[]> {
    console.log('SimpleEpubReader: Using CONTENTS-based chapter extraction');
    
    try {
      // Use contentsParser to get real chapters from CONTENTS section
      const contentsResult = await contentsParser.parseContentsFromFile(
        new File([await zip.generateAsync({ type: 'blob' })], 'temp.epub')
      );
      
      console.log(`SimpleEpubReader: CONTENTS parser result:`, {
        totalRealChapters: contentsResult.totalRealChapters,
        chaptersFound: contentsResult.chapters.length,
        contentsFound: contentsResult.contentsFound,
        parseMethod: contentsResult.parseMethod,
        chapterTitles: contentsResult.chapters.map(ch => ch.title)
      });
      
      if (contentsResult.chapters.length > 0) {
        // Convert CONTENTS chapters to our structure
        const chapterStructure = contentsResult.chapters.map((chapter, index) => ({
          idref: chapter.id,
          href: chapter.href,
          index: index,
          order: chapter.order,
          title: chapter.title
        }));
        
        console.log('SimpleEpubReader: Using CONTENTS chapters:', chapterStructure.map(ch => `"${ch.title}"`));
        console.log('SimpleEpubReader: Chapter structure details:', chapterStructure.slice(0, 3));
        return chapterStructure;
      }
    } catch (error) {
      console.warn('SimpleEpubReader: CONTENTS parsing failed, falling back to spine:', error);
    }
    
    // Fallback to spine if CONTENTS parsing fails
    console.log('SimpleEpubReader: Falling back to spine-based extraction');
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'text/xml');
    
    // Get spine items (reading order) - just structure, no content yet
    const spineItems = Array.from(doc.querySelectorAll('spine itemref'));
    const chapterStructure = [];
    
    for (let i = 0; i < spineItems.length; i++) {
      const itemref = spineItems[i];
      const idref = itemref.getAttribute('idref');
      
      if (!idref) continue;

      // Find manifest item
      const manifestItem = doc.querySelector(`manifest item[id="${idref}"]`);
      if (!manifestItem) continue;

      const href = manifestItem.getAttribute('href');
      if (!href) continue;

      chapterStructure.push({
        idref,
        href,
        index: i,
        order: chapterStructure.length + 1,
        title: `Chapter ${chapterStructure.length + 1}` // Fallback title
      });
    }
    
    return chapterStructure;
  }

  private async getSpineBasedStructure(zip: JSZip, opfPath: string): Promise<any[]> {
    console.log('SimpleEpubReader: Using spine-based structure as fallback with filtering');
    
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'text/xml');
    
    // Get spine items (reading order)
    const spineItems = Array.from(doc.querySelectorAll('spine itemref'));
    const chapterStructure = [];
    
    for (let i = 0; i < spineItems.length; i++) {
      const itemref = spineItems[i];
      const idref = itemref.getAttribute('idref');
      
      if (!idref) continue;

      // Find manifest item
      const manifestItem = doc.querySelector(`manifest item[id="${idref}"]`);
      if (!manifestItem) continue;

      const href = manifestItem.getAttribute('href');
      if (!href) continue;

      // Basic filtering even in spine fallback
      const filename = href.toLowerCase();
      const isAuxiliaryFile = [
        'cover', 'back', 'front', 'title', 'copyright', 'toc', 'contents',
        'notes', 'bibliography', 'index', 'acknowledgment', 'preface',
        'table', 'resources', 'about', 'author', 'ba.xhtml', 'dis.xhtml'
      ].some(keyword => filename.includes(keyword));
      
      if (isAuxiliaryFile) {
        console.log(`SimpleEpubReader: Skipping auxiliary file in spine: ${href}`);
        continue;
      }

      chapterStructure.push({
        idref,
        href,
        index: i,
        order: chapterStructure.length + 1,
        title: `Chapter ${chapterStructure.length + 1}` // Fallback title
      });
    }
    
    console.log(`SimpleEpubReader: Spine fallback found ${chapterStructure.length} real chapters after filtering`);
    return chapterStructure;
  }

  private async extractSingleChapter(zip: JSZip, opfPath: string, chapterInfo: any, index: number): Promise<SimpleChapter> {
    const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    
    // Clean href - remove fragments (everything after #)
    const cleanHref = chapterInfo.href.split('#')[0];
    const chapterPath = basePath + cleanHref;
    
    console.log(`SimpleEpubReader: Extracting chapter from path: ${chapterPath} (original href: ${chapterInfo.href})`);
    
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) {
      throw new Error(`Chapter file not found: ${chapterPath}`);
    }

    const chapterHtml = await chapterFile.async('text');
    const parser = new DOMParser();
    const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');
    
    // Extract title and content - prioritize HTML titles over generic CONTENTS titles
    console.log(`🔍 Chapter ${chapterInfo.order}: CONTENTS title = "${chapterInfo.title}"`);
    
    const htmlTitle = this.extractChapterTitle(chapterDoc, chapterInfo.order);
    console.log(`🔍 Chapter ${chapterInfo.order}: HTML title = "${htmlTitle}"`);
    
    // Use HTML title if it's more descriptive than CONTENTS title
    let title = chapterInfo.title;
    if (!title || title.startsWith('Chapter ') || title.match(/^Chapter\s+\d+$/)) {
      // CONTENTS title is generic, prefer HTML title
      title = htmlTitle;
      console.log(`🔄 Chapter ${chapterInfo.order}: Using HTML title over generic CONTENTS title`);
    } else if (htmlTitle && !htmlTitle.startsWith('Chapter ') && htmlTitle !== title) {
      // Both have real titles, prefer HTML as it's usually more accurate
      title = htmlTitle;
      console.log(`🔄 Chapter ${chapterInfo.order}: Using HTML title over CONTENTS title`);
    }
    
    console.log(`✅ Chapter ${chapterInfo.order}: Final title = "${title}"`);
    const content = this.extractChapterContent(chapterDoc);
    
    // Count words from text content, not HTML
    const textForWordCount = chapterDoc.body?.textContent || '';
    const wordCount = textForWordCount.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`SimpleEpubReader: Chapter content preview:`, content.substring(0, 200) + '...');
    
    console.log(`SimpleEpubReader: Loaded chapter ${chapterInfo.order}: "${title}" (${wordCount} words)`);
    
    return {
      id: chapterInfo.idref,
      title,
      content,
      order: chapterInfo.order,
      wordCount
    };
  }

  private async loadRemainingChaptersInBackground(
    zip: JSZip, 
    opfPath: string, 
    chapterStructure: any[], 
    book: SimpleEpubBook
  ): Promise<void> {
    // Load chapters in background without blocking UI
    setTimeout(async () => {
      console.log('SimpleEpubReader: Starting background chapter loading...');
      
      for (let i = 1; i < chapterStructure.length; i++) {
        try {
          console.log(`🔄 SimpleEpubReader: Loading chapter ${i + 1} of ${chapterStructure.length}`);
          const chapter = await this.extractSingleChapter(zip, opfPath, chapterStructure[i], i);
          
          // Add chapter to book
          book.chapters.push(chapter);
          console.log(`✅ SimpleEpubReader: Chapter ${i + 1} loaded: "${chapter.title}"`);
          
          // Report progress
          const progress = 50 + ((i / (chapterStructure.length - 1)) * 50);
          this.reportProgress(
            'background-loading', 
            progress, 
            `Cargando capítulo ${i + 1} de ${chapterStructure.length}...`,
            i + 1,
            chapterStructure.length
          );
          
          // Small delay to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          console.error(`❌ SimpleEpubReader: Error loading chapter ${i + 1}:`, error);
          // Continue with other chapters even if one fails
        }
      }
      
      // Complete
      this.reportProgress('complete', 100, 'EPUB cargado completamente', book.chapters.length, chapterStructure.length);
      console.log('SimpleEpubReader: Background loading complete');
    }, 100); // Small delay to let initial UI render
  }

  private async findOpfFile(zip: JSZip): Promise<string> {
    // Check container.xml first
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerContent = await containerFile.async('text');
      const match = containerContent.match(/full-path="([^"]+)"/);
      if (match) {
        return match[1];
      }
    }

    // Fallback: find .opf files
    const opfFiles = Object.keys(zip.files).filter(name => name.endsWith('.opf'));
    if (opfFiles.length > 0) {
      return opfFiles[0];
    }

    throw new Error('No OPF file found in EPUB');
  }

  private async parseMetadata(zip: JSZip, opfPath: string): Promise<{title: string, author: string}> {
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'text/xml');

    const title = doc.querySelector('title')?.textContent?.trim() || 'Unknown Title';
    const author = doc.querySelector('creator')?.textContent?.trim() || 'Unknown Author';

    return { title, author };
  }

  private async extractAllChapters(zip: JSZip, opfPath: string): Promise<SimpleChapter[]> {
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('OPF file not found');

    const opfContent = await opfFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'text/xml');
    
    const basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    
    // Get spine items (reading order)
    const spineItems = Array.from(doc.querySelectorAll('spine itemref'));
    const chapters: SimpleChapter[] = [];
    
    console.log(`SimpleEpubReader: Processing ${spineItems.length} spine items`);
    
    for (let i = 0; i < spineItems.length; i++) {
      const itemref = spineItems[i];
      const idref = itemref.getAttribute('idref');
      
      if (!idref) continue;

      // Find manifest item
      const manifestItem = doc.querySelector(`manifest item[id="${idref}"]`);
      if (!manifestItem) continue;

      const href = manifestItem.getAttribute('href');
      if (!href) continue;

      try {
        const chapterPath = basePath + href;
        const chapterFile = zip.file(chapterPath);
        
        if (!chapterFile) {
          console.warn(`SimpleEpubReader: Chapter file not found: ${chapterPath}`);
          continue;
        }

        const chapterHtml = await chapterFile.async('text');
        const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');
        
        // Extract title and content
        const extractedTitle = this.extractChapterTitle(chapterDoc, i + 1);
        const title = extractedTitle !== `Chapter ${i + 1}` ? extractedTitle : `Chapter ${chapters.length + 1}`;
        
        console.log(`SimpleEpubReader: Extracted title for chapter ${chapters.length + 1}: "${title}" (from HTML: "${extractedTitle}")`);
        
        // Extract clean text content
        const content = this.extractChapterContent(chapterDoc);
        
        // Skip if no meaningful content
        if (content.length < 50) {
          console.log(`SimpleEpubReader: Skipping chapter ${i + 1} - too short`);
          continue;
        }
        
        const wordCount = content.split(/\s+/).length;
        
        chapters.push({
          id: idref,
          title,
          content,
          order: chapters.length + 1, // Use actual chapter count, not spine index
          wordCount
        });
        
        console.log(`SimpleEpubReader: Chapter ${chapters.length}: "${title}" (${wordCount} words)`);
        
      } catch (error) {
        console.error(`SimpleEpubReader: Error processing chapter ${i + 1}:`, error);
      }
    }
    
    return chapters;
  }

  private extractChapterTitle(doc: Document, fallbackNumber: number): string {
    console.log(`🔍 extractChapterTitle: Starting extraction for chapter ${fallbackNumber}`);
    
    // Try different methods to find chapter title
    
    // Method 1: Look for headings with better filtering (including links inside headings)
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log(`🔍 extractChapterTitle: Found ${headings.length} headings`);
    
    for (const heading of headings) {
      let text = heading.textContent?.trim();
      console.log(`🔍 extractChapterTitle: Heading text: "${text}"`);
      
      if (text && text.length > 0 && text.length < 200) {
        const originalText = text;
        
        // Clean up common chapter prefixes
        text = text.replace(/^(CHAPTER\s+\w+:?\s*)/i, '').trim();
        text = text.replace(/^(Chapter\s+\d+:?\s*)/i, '').trim();
        text = text.replace(/^(\d+\.\s*)/i, '').trim();
        
        console.log(`🔍 extractChapterTitle: After cleanup: "${originalText}" -> "${text}"`);
        
        // If we have meaningful text after cleanup, use it
        if (text.length > 0 && !text.match(/^(chapter|cap\\.?)\\s*\\d*$/i)) {
          console.log(`✅ extractChapterTitle: Using heading title: "${text}"`);
          return text;
        }
      }
    }
    
    // Method 1.5: Look specifically for h1 with links (like in this EPUB)
    const h1Links = doc.querySelectorAll('h1 a, h2 a, h3 a');
    console.log(`🔍 extractChapterTitle: Found ${h1Links.length} heading links`);
    
    for (const link of h1Links) {
      let text = link.textContent?.trim();
      console.log(`🔍 extractChapterTitle: Heading link text: "${text}"`);
      
      if (text && text.length > 0 && text.length < 200) {
        const originalText = text;
        
        // Clean up common chapter prefixes
        text = text.replace(/^(CHAPTER\s+\w+:?\s*)/i, '').trim();
        text = text.replace(/^(Chapter\s+\d+:?\s*)/i, '').trim();
        text = text.replace(/^(\d+\.\s*)/i, '').trim();
        
        console.log(`🔍 extractChapterTitle: Link after cleanup: "${originalText}" -> "${text}"`);
        
        // If we have meaningful text after cleanup, use it
        if (text.length > 0 && !text.match(/^(chapter|cap\\.?)\\s*\\d*$/i)) {
          console.log(`✅ extractChapterTitle: Using heading link title: "${text}"`);
          return text;
        }
      }
    }
    
    // Method 2: Look for title tag
    const titleElement = doc.querySelector('title');
    if (titleElement) {
      let titleText = titleElement.textContent?.trim();
      if (titleText && titleText.length > 0 && titleText.length < 200) {
        // Clean up title text too
        titleText = titleText.replace(/^(CHAPTER\s+\w+:?\s*)/i, '').trim();
        titleText = titleText.replace(/^(Chapter\s+\d+:?\s*)/i, '').trim();
        if (titleText.length > 0) {
          return titleText;
        }
      }
    }
    
    // Method 3: Look for first paragraph that might be a title
    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        // Check if it looks like a title (short, no periods at end, etc.)
        if (!text.endsWith('.') && !text.includes('\n')) {
          return text;
        }
      }
    }
    
    // Method 4: Look for strong/bold text
    const strongElements = doc.querySelectorAll('strong, b');
    for (const element of strongElements) {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 100) {
        return text;
      }
    }
    
    // Fallback
    console.log(`⚠️ extractChapterTitle: Using fallback title for chapter ${fallbackNumber}`);
    return `Chapter ${fallbackNumber}`;
  }

  private extractChapterContent(doc: Document): string {
    console.log('🔍 extractChapterContent: Starting extraction');
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.navigation', '.nav', '.toc', '.table-of-contents'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Get body or main content
    const body = doc.querySelector('body') || doc.documentElement;
    if (!body) {
      console.log('⚠️ extractChapterContent: No body found');
      return '<p>No se pudo encontrar el contenido del capítulo</p>';
    }
    
    console.log('🔍 extractChapterContent: Body found, innerHTML length:', body.innerHTML?.length);
    
    // Extract HTML content instead of just text
    let htmlContent = body.innerHTML || '';
    
    // Clean up the HTML AND REMOVE ALL LINKS
    const originalLength = htmlContent.length;
    const linkCount = (htmlContent.match(/<a[^>]*>/gi) || []).length;
    
    htmlContent = htmlContent
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove styles
      .replace(/<a[^>]*>/gi, '') // Remove all <a> opening tags
      .replace(/<\/a>/gi, '') // Remove all </a> closing tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/>\s+</g, '><')
      .trim();
    
    if (linkCount > 0) {
      console.log(`🔗 extractChapterContent: Removed ${linkCount} links from chapter content`);
    }
    
    console.log('🔍 extractChapterContent: Cleaned HTML length:', htmlContent.length);
    
    // If no HTML content, fall back to text content formatted as paragraphs
    if (!htmlContent || htmlContent.length < 50) {
      console.log('⚠️ extractChapterContent: HTML too short, trying text fallback');
      const textContent = body.textContent || '';
      console.log('🔍 extractChapterContent: Text content length:', textContent.length);
      
      if (textContent.trim().length > 0) {
        const paragraphs = textContent
          .split(/\n\s*\n/)
          .filter(p => p.trim().length > 0)
          .map(p => `<p>${p.trim()}</p>`)
          .join('\n');
        
        console.log('✅ extractChapterContent: Created paragraphs from text, length:', paragraphs.length);
        return paragraphs || '<p>Contenido de texto no disponible</p>';
      } else {
        console.log('⚠️ extractChapterContent: No text content found, using fallback');
        return '<p>Contenido no disponible - archivo EPUB puede estar corrupto</p>';
      }
    }
    
    console.log('✅ extractChapterContent: Returning HTML content, length:', htmlContent.length);
    return htmlContent;
  }
}

export const simpleEpubReader = new SimpleEpubReader();